import { createHmac } from "crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { Env } from "../../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  email: string;
};

export function signAccessToken(env: Env, payload: AccessTokenPayload): string {
  const secret = getJwtSecret(env);
  const options: SignOptions = {
    algorithm: "HS256",
    subject: payload.sub,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign(
    { email: payload.email, tenantId: payload.tenantId },
    secret,
    options
  );
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  const secret = getJwtSecret(env);
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"]
  });
  if (typeof decoded === "string" || !decoded || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  const dp = decoded as JwtPayload & { email?: unknown; tenantId?: unknown };
  const email = typeof dp.email === "string" ? dp.email : "";
  const tenantId =
    typeof dp.tenantId === "string" ? dp.tenantId : decoded.sub;
  return { sub: decoded.sub, tenantId, email };
}

/** Stateless reset tokens use HS256 with a secret derived from the user password hash. */
export function signPasswordResetToken(
  env: Env,
  creator: { id: string; email: string; passwordHash: string }
): string {
  const secret = derivePasswordResetSecret(env, creator.passwordHash);
  const options: SignOptions = {
    algorithm: "HS256",
    subject: creator.id,
    expiresIn: env.JWT_RESET_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign({ email: creator.email, tenantId: creator.id }, secret, options);
}

export function verifyPasswordResetToken(
  env: Env,
  token: string,
  passwordHash: string
): JwtPayload {
  const secret = derivePasswordResetSecret(env, passwordHash);
  return jwt.verify(token, secret, {
    algorithms: ["HS256"]
  }) as JwtPayload;
}

function derivePasswordResetSecret(env: Env, passwordHash: string): string {
  const root = getJwtSecret(env);
  return createHmac("sha256", root).update(`pwreset:${passwordHash}`, "utf8").digest("hex");
}

function getJwtSecret(env: Env): string {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return env.JWT_SECRET;
}
