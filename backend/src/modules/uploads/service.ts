import { randomUUID } from "crypto";
import type { Readable } from "node:stream";
import { AuditLogAction } from "@prisma/client";
import { GetObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import type { TenantId } from "../../types/tenant.js";
import { parseTenantMediaObjectKey } from "../../lib/sessionMediaUrl.js";
import type { PresignBody, PresignGetBody } from "./schemas.js";

const ALLOWED_CONTENT_PREFIXES = ["audio/", "video/", "image/"];

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/[^\w.\-()+ ]/g, "_");
  return base.slice(0, 180) || "upload.bin";
}

function s3Configured(env: Env): boolean {
  return Boolean(
    env.AWS_REGION && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.S3_BUCKET
  );
}

function getS3Client(env: Env): S3Client {
  return new S3Client({
    region: env.AWS_REGION!,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    /** Omit flexible checksum query params on presigned PUTs (raw browser uploads cannot satisfy CRC32). */
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
    }
  });
}

function tenantMediaKeyPrefix(tenantId: TenantId): string {
  return `tenants/${tenantId as string}/media/`;
}

function assertRelayKeyForTenant(tenantId: TenantId, key: string): void {
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes("..") || trimmed.includes("\\")) {
    throw new HttpError(400, "Invalid object key", "validation_error");
  }
  if (!trimmed.startsWith(tenantMediaKeyPrefix(tenantId))) {
    throw new HttpError(
      400,
      "Object key must use this tenant's media prefix from presign",
      "validation_error"
    );
  }
}

export async function createPresignedPut(
  env: Env,
  tenantId: TenantId,
  actorId: string,
  body: PresignBody
) {
  const ct = body.contentType.toLowerCase();
  if (!ALLOWED_CONTENT_PREFIXES.some((p) => ct.startsWith(p))) {
    throw new HttpError(
      400,
      "contentType must be audio/*, video/*, or image/*",
      "validation_error"
    );
  }

  if (!s3Configured(env)) {
    throw new HttpError(
      503,
      "S3 uploads are not configured (set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET)",
      "uploads_unconfigured"
    );
  }

  const safeName = sanitizeFileName(body.fileName);
  const key = `${tenantMediaKeyPrefix(tenantId)}${randomUUID()}-${safeName}`;

  const client = getS3Client(env);
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key,
    ContentType: body.contentType
  });

  const expiresIn = env.PRESIGN_EXPIRES_SECONDS;
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn,
    signableHeaders: new Set(["content-type"])
  });

  await appendAuditLog({
    tenantId,
    actorId,
    action: AuditLogAction.media_presigned,
    targetType: "s3_object",
    targetId: key,
    metadata: { contentType: body.contentType }
  });

  const publicUrl = publicObjectUrl(env, key);

  return {
    uploadUrl,
    key,
    bucket: env.S3_BUCKET,
    expiresIn,
    contentType: body.contentType,
    publicUrl
  };
}

export async function createPresignedGet(
  env: Env,
  tenantId: TenantId,
  body: PresignGetBody
): Promise<{ viewUrl: string; expiresIn: number }> {
  if (!s3Configured(env)) {
    throw new HttpError(
      503,
      "S3 uploads are not configured (set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET)",
      "uploads_unconfigured"
    );
  }

  const key = parseTenantMediaObjectKey(tenantId, body.mediaUrl);
  const client = getS3Client(env);
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key
  });
  const expiresIn = env.PRESIGN_GET_EXPIRES_SECONDS;
  const viewUrl = await getSignedUrl(client, command, { expiresIn });
  return { viewUrl, expiresIn };
}

/** `PutObject` from a stream requires `ContentLength` in Node. */
export async function relayUploadStream(
  env: Env,
  tenantId: TenantId,
  actorId: string,
  key: string,
  contentType: string,
  body: Readable,
  contentLength: number
) {
  assertRelayKeyForTenant(tenantId, key);

  const ctBase = contentType.trim().split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ALLOWED_CONTENT_PREFIXES.some((p) => ctBase.startsWith(p))) {
    throw new HttpError(
      400,
      "contentType must be audio/*, video/*, or image/*",
      "validation_error"
    );
  }

  if (!Number.isInteger(contentLength) || contentLength < 0) {
    throw new HttpError(400, "Invalid Content-Length for relay upload", "validation_error", {
      fieldErrors: { "content-length": ["Must be a non-negative integer (bytes)"] },
      formErrors: [] as string[]
    });
  }

  if (!s3Configured(env)) {
    throw new HttpError(
      503,
      "S3 uploads are not configured (set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET)",
      "uploads_unconfigured"
    );
  }

  const client = getS3Client(env);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: key.trim(),
        ContentType: contentType.trim().split(";")[0]?.trim(),
        ContentLength: contentLength,
        Body: body
      })
    );
  } catch (e) {
    if (e instanceof S3ServiceException) {
      throw new HttpError(502, e.message, "s3_upload_failed");
    }
    throw e;
  }

  await appendAuditLog({
    tenantId,
    actorId,
    action: AuditLogAction.media_relay_uploaded,
    targetType: "s3_object",
    targetId: key.trim(),
    metadata: { contentType: ctBase, bytes: contentLength }
  });
}

function publicObjectUrl(env: Env, key: string): string {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/")}`;
  }
  return `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")}`;
}
