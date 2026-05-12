import type { RequestHandler } from "express";
import type { Env } from "../config/env.js";
import { verifyAccessToken } from "../modules/auth/jwt.js";
import { toTenantId } from "../types/tenant.js";

/** Routes that do not require a JWT (method + path as seen on the root app). */
const PUBLIC_ROUTES: ReadonlyArray<{ method: string; pathPrefix: string }> = [
  { method: "GET", pathPrefix: "/health" },
  { method: "POST", pathPrefix: "/v1/auth/signup" },
  { method: "POST", pathPrefix: "/v1/auth/login" },
  { method: "POST", pathPrefix: "/v1/auth/forgot-password" },
  { method: "POST", pathPrefix: "/v1/auth/reset-password" }
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some((r) => r.method === method && path === r.pathPrefix);
}

export function createJwtAuthMiddleware(getEnv: () => Env): RequestHandler {
  return (req, res, next) => {
    if (isPublicRoute(req.method, req.path)) {
      next();
      return;
    }

    const env = getEnv();
    if (!env.JWT_SECRET) {
      res.status(503).json({
        error: "service_unavailable",
        message: "JWT_SECRET is not configured",
        requestId: req.requestId
      });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({
        error: "unauthorized",
        message: "Missing bearer token",
        requestId: req.requestId
      });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({
        error: "unauthorized",
        message: "Missing bearer token",
        requestId: req.requestId
      });
      return;
    }

    try {
      const payload = verifyAccessToken(env, token);
      req.creatorId = payload.sub;
      req.tenantId = toTenantId(payload.sub);
      next();
    } catch {
      res.status(401).json({
        error: "unauthorized",
        message: "Invalid or expired token",
        requestId: req.requestId
      });
    }
  };
}
