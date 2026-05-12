import type { RequestHandler } from "express";

/**
 * Stub: real JWT verification will set `req.tenantId` / `req.creatorId`.
 * Logs use `tenant_id: "pre_auth"` until then.
 */
export const authStubMiddleware: RequestHandler = (_req, _res, next) => {
  next();
};
