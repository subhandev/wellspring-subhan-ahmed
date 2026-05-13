import type { RequestHandler } from "express";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { httpErrorFromZod } from "../../lib/httpErrorFromZod.js";
import { presignBodySchema } from "./schemas.js";
import * as uploadsService from "./service.js";

function requireTenantContext(req: Parameters<RequestHandler>[0]) {
  const tenantId = req.tenantId;
  const creatorId = req.creatorId;
  if (!tenantId || !creatorId) {
    return null;
  }
  return { tenantId, creatorId };
}

export const presign: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const parsed = presignBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(httpErrorFromZod(parsed.error));
      return;
    }
    const env = req.app.get("env") as Env;
    const out = await uploadsService.createPresignedPut(
      env,
      ctx.tenantId,
      ctx.creatorId,
      parsed.data
    );
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
};

/** Fallback when browser PUT to S3 fails: stream body to `PutObject` (needs Content-Length). */
export const relayUpload: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const key = req.headers["x-wellspring-s3-key"];
    if (typeof key !== "string" || !key.trim()) {
      next(
        new HttpError(400, "Missing X-Wellspring-S3-Key header", "validation_error", {
          fieldErrors: { key: ["Send `key` from the presign response as X-Wellspring-S3-Key"] },
          formErrors: [] as string[]
        })
      );
      return;
    }
    const ct = typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : "";
    if (!ct.trim()) {
      next(
        new HttpError(400, "Missing Content-Type", "validation_error", {
          fieldErrors: {
            headers: ["Content-Type must match the presigned upload (e.g. video/mp4)"]
          },
          formErrors: [] as string[]
        })
      );
      return;
    }
    const cl = req.headers["content-length"];
    if (cl === undefined) {
      next(
        new HttpError(400, "Content-Length required for relay upload", "validation_error", {
          fieldErrors: {
            "content-length": ["Required (browser sends this automatically with Blob/File body)"]
          },
          formErrors: [] as string[]
        })
      );
      return;
    }
    const contentLength = parseInt(String(cl), 10);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      next(
        new HttpError(400, "Invalid Content-Length for relay upload", "validation_error", {
          fieldErrors: { "content-length": ["Must be a non-negative byte length"] },
          formErrors: [] as string[]
        })
      );
      return;
    }
    const env = req.app.get("env") as Env;
    await uploadsService.relayUploadStream(
      env,
      ctx.tenantId,
      ctx.creatorId,
      key,
      ct,
      req,
      contentLength
    );
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
