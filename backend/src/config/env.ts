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
  /** In dev/test without SMTP, log reset URL at `debug` when issuing password reset. */
  PASSWORD_RESET_DEBUG_LOG: z.enum(["0", "1"]).optional(),

  AWS_REGION: z.string().min(1).optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  PRESIGN_EXPIRES_SECONDS: z.coerce.number().min(60).max(3600).default(900),
  S3_ENDPOINT: z.string().url().optional(),
  /** Base URL for GET access to uploaded objects (e.g. CloudFront or `https://bucket.s3.region.amazonaws.com`). */
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  /**
   * `1` = expose `GET /openapi.json` and `GET /api-docs` without auth.
   * `0` = hide docs. Default: hidden in production unless set to `1`.
   */
  ENABLE_API_DOCS: z.enum(["0", "1"]).optional()
});

export type Env = z.infer<typeof envSchema>;

/** OpenAPI/Swagger when explicitly enabled or when not in production. */
export function apiDocsEnabled(env: Env): boolean {
  if (env.ENABLE_API_DOCS !== undefined) {
    return env.ENABLE_API_DOCS === "1";
  }
  return env.NODE_ENV !== "production";
}

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}
