import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import { auditQuerySchema } from "./schemas.js";
import * as auditService from "./service.js";

function requireTenantContext(req: Parameters<RequestHandler>[0]) {
  const tenantId = req.tenantId;
  if (!tenantId) {
    return null;
  }
  return { tenantId };
}

function singleQuery(v: unknown): string | undefined {
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v) && typeof v[0] === "string") {
    return v[0];
  }
  return undefined;
}

export const list: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const parsed = auditQuerySchema.safeParse({
      from: singleQuery(req.query.from),
      to: singleQuery(req.query.to),
      action: singleQuery(req.query.action)
    });
    if (!parsed.success) {
      next(new HttpError(400, "Invalid query parameters", "validation_error"));
      return;
    }
    const logs = await auditService.listAuditLogs(ctx.tenantId, parsed.data);
    res.json({ auditLogs: logs });
  } catch (e) {
    next(e);
  }
};
