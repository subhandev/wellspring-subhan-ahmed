import jwt, { type SignOptions } from "jsonwebtoken";
import type { Env } from "../../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export function signAccessToken(env: Env, payload: AccessTokenPayload): string {
  const secret = getJwtSecret(env);
  const options: SignOptions = {
    algorithm: "HS256",
    subject: payload.sub,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign({ email: payload.email }, secret, options);
}

export function verifyAccessToken(env: Env, token: string): AccessTokenPayload {
  const secret = getJwtSecret(env);
  const decoded = jwt.verify(token, secret, {
    algorithms: ["HS256"]
  });
  if (typeof decoded === "string" || !decoded || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  const email = typeof decoded.email === "string" ? decoded.email : "";
  return { sub: decoded.sub, email };
}

function getJwtSecret(env: Env): string {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return env.JWT_SECRET;
}
