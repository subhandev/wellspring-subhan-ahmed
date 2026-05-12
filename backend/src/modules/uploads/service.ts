import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import type { TenantId } from "../../types/tenant.js";
import type { PresignBody } from "./schemas.js";

const ALLOWED_CONTENT_PREFIXES = ["audio/", "video/", "image/"];

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/[^\w.\-()+ ]/g, "_");
  return base.slice(0, 180) || "upload.bin";
}

function s3Configured(env: Env): boolean {
  return Boolean(
    env.AWS_REGION &&
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY &&
      env.S3_BUCKET
  );
}

function getS3Client(env: Env): S3Client {
  return new S3Client({
    region: env.AWS_REGION!,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
    }
  });
}

export async function createPresignedPut(
  env: Env,
  tenantId: TenantId,
  actorId: string,
  body: PresignBody
) {
  if (!s3Configured(env)) {
    throw new HttpError(
      503,
      "S3 uploads are not configured (set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET)",
      "uploads_unconfigured"
    );
  }

  const ct = body.contentType.toLowerCase();
  if (!ALLOWED_CONTENT_PREFIXES.some((p) => ct.startsWith(p))) {
    throw new HttpError(
      400,
      "contentType must be audio/*, video/*, or image/*",
      "validation_error"
    );
  }

  const safeName = sanitizeFileName(body.fileName);
  const key = `tenants/${tenantId as string}/media/${randomUUID()}-${safeName}`;

  const client = getS3Client(env);
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: key,
    ContentType: body.contentType
  });

  const expiresIn = env.PRESIGN_EXPIRES_SECONDS;
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  await appendAuditLog({
    tenantId,
    actorId,
    action: "media.presign",
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
