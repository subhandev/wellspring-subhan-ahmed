import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  /** Required for Prisma at runtime; optional for HTTP-only smoke in CI. */
  DATABASE_URL: z.string().min(1).optional(),
  /** HS256 signing secret; required when issuing or verifying JWTs. */
  JWT_SECRET: z.string().min(16).optional(),
  JWT_EXPIRES_IN: z.string().default("7d"),
  /** Short-lived HS256 token for password reset (signed with secret derived from password hash). */
  JWT_RESET_EXPIRES_IN: z.string().default("15m"),
  /** In dev/test without SMTP, log reset URL at `debug` when issuing password reset. */
  PASSWORD_RESET_DEBUG_LOG: z.enum(["0", "1"]).optional(),

  AWS_REGION: z.string().min(1).optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  PRESIGN_EXPIRES_SECONDS: z.coerce.number().min(60).max(3600).default(900),
  /** Presigned GET for viewing private objects (browser open / media playback). */
  PRESIGN_GET_EXPIRES_SECONDS: z.coerce.number().min(60).max(604800).default(3600),
  S3_ENDPOINT: z.string().url().optional(),
  /** Base URL for GET access to uploaded objects (e.g. CloudFront or `https://bucket.s3.region.amazonaws.com`). */
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  /**
   * `1` = expose `GET /openapi.json` and `GET /api-docs` without auth.
   * `0` = hide docs. Default: hidden in production unless set to `1`.
   */
  ENABLE_API_DOCS: z.enum(["0", "1"]).optional(),
  /** Comma-separated allowed browser `Origin` values. In development/test, `http(s)://localhost:*` and 127.0.0.1 are allowed if unset. */
  CORS_ORIGIN: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;

/** OpenAPI/Swagger when explicitly enabled or when not in production. */
export function apiDocsEnabled(env: Env): boolean {
  if (env.ENABLE_API_DOCS !== undefined) {
    return env.ENABLE_API_DOCS === "1";
  }
  return env.NODE_ENV !== "production";
}

/** Normalize alternate env names some hosts use for S3 uploads. */
function normalizeProcessEnv(input: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out = { ...input };
  if (!out.S3_BUCKET?.trim() && out.AWS_S3_BUCKET?.trim()) {
    out.S3_BUCKET = out.AWS_S3_BUCKET.trim();
  }
  if (out.PRESIGN_EXPIRES_SECONDS === undefined && out.S3_PRESIGNED_URL_EXPIRES !== undefined) {
    out.PRESIGN_EXPIRES_SECONDS = out.S3_PRESIGNED_URL_EXPIRES;
  }
  return out;
}

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(normalizeProcessEnv(process.env));
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
