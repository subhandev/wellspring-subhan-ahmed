import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import { importSessionsBodySchema } from "./schemas.js";
import * as importService from "./service.js";

function requireTenantContext(req: Parameters<RequestHandler>[0]) {
  const tenantId = req.tenantId;
  const creatorId = req.creatorId;
  if (!tenantId || !creatorId) {
    return null;
  }
  return { tenantId, creatorId };
}

export const importSessions: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const parsed = importSessionsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const out = await importService.importSessionsFromCsv(ctx.tenantId, ctx.creatorId, parsed.data);
    res.status(200).json(out);
  } catch (e) {
    next(e);
  }
};
