import type { RequestHandler } from "express";
import type { Env } from "../config/env.js";
import { prisma } from "../config/database.js";
import { verifyAccessToken } from "../modules/auth/jwt.js";
import { toTenantId } from "../types/tenant.js";

function isPublicRoute(method: string, path: string): boolean {
  if (method === "GET" && (path === "/health" || path === "/openapi.json")) {
    return true;
  }
  if (method === "GET" && path.startsWith("/api-docs")) {
    return true;
  }
  const publicAuthPosts = new Set([
    "/api/auth/signup",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/reset-password"
  ]);
  if (method === "POST" && publicAuthPosts.has(path)) {
    return true;
  }
  return false;
}

export function createAuthenticateMiddleware(getEnv: () => Env): RequestHandler {
  return async (req, res, next) => {
    if (isPublicRoute(req.method, req.path)) {
      next();
      return;
    }

    const env = getEnv();
    if (!env.JWT_SECRET) {
      res.status(503).json({
        success: false,
        error: {
          code: "auth_misconfigured",
          message: "JWT_SECRET is not configured"
        },
        requestId: req.requestId
      });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          code: "unauthorized",
          message: "Missing bearer token"
        },
        requestId: req.requestId
      });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "unauthorized",
          message: "Missing bearer token"
        },
        requestId: req.requestId
      });
      return;
    }

    try {
      const payload = verifyAccessToken(env, token);
      const row = await prisma.creator.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });
      if (!row) {
        res.status(401).json({
          success: false,
          error: {
            code: "unauthorized",
            message: "Invalid or unknown user"
          },
          requestId: req.requestId
        });
        return;
      }
      req.creatorId = row.id;
      req.tenantId = toTenantId(row.id);
      req.creator = row;
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: {
          code: "unauthorized",
          message: "Invalid or expired token"
        },
        requestId: req.requestId
      });
    }
  };
}
