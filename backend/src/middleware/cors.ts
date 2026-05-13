import type { RequestHandler } from "express";
import type { Env } from "../config/env.js";

const localhostOrigin =
  /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/;

function allowedOrigin(env: Env, origin: string | undefined): string | null {
  if (!origin) {
    return null;
  }
  const list = (env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.includes(origin)) {
    return origin;
  }
  if ((env.NODE_ENV === "development" || env.NODE_ENV === "test") && localhostOrigin.test(origin)) {
    return origin;
  }
  return null;
}

/** Browser clients (Next.js on another port) need CORS for JSON + Authorization. */
export function createCorsMiddleware(env: Env): RequestHandler {
  return (req, res, next) => {
    const origin = allowedOrigin(env, req.headers.origin);
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.append("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    /** Include custom headers used by multipart-like uploads (`POST /v1/uploads/relay`). */
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-Wellspring-S3-Key"
    );
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  };
}
