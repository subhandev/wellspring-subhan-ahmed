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
