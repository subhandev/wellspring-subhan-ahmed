import { createHash, randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { Logger } from "pino";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import { signAccessToken } from "./jwt.js";
import * as repo from "./repository.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  ResetPasswordBody,
  SignupBody
} from "./schemas.js";

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_BYTES = 32;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function signup(env: Env, body: SignupBody) {
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  let creator;
  try {
    creator = await repo.createCreator({
      email: body.email,
      passwordHash
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Email already registered", "email_taken");
    }
    throw e;
  }

  const accessToken = signAccessToken(env, { sub: creator.id, email: creator.email });
  return {
    accessToken,
    creator: { id: creator.id, email: creator.email }
  };
}

export async function login(env: Env, body: LoginBody) {
  const creator = await repo.findCreatorByEmail(body.email);
  if (!creator) {
    throw new HttpError(401, "Invalid email or password", "invalid_credentials");
  }
  const ok = await bcrypt.compare(body.password, creator.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid email or password", "invalid_credentials");
  }
  const accessToken = signAccessToken(env, { sub: creator.id, email: creator.email });
  return {
    accessToken,
    creator: { id: creator.id, email: creator.email }
  };
}

/** Always returns success shape; never reveals whether email exists. */
export async function forgotPassword(
  env: Env,
  body: ForgotPasswordBody,
  log: Logger,
  requestId: string
) {
  const creator = await repo.findCreatorByEmail(body.email);
  if (creator) {
    const rawToken = randomBytes(RESET_TOKEN_BYTES).toString("hex");
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await repo.setPasswordResetFields(creator.id, tokenHash, expiresAt);

    log.info(
      {
        request_id: requestId,
        event: "password_reset_issued",
        creatorId: creator.id,
        tenant_id: "pre_auth"
      },
      "password reset token issued"
    );

    if (
      env.NODE_ENV !== "production" &&
      (env.PASSWORD_RESET_DEBUG_LOG === "1" || env.NODE_ENV === "development" || env.NODE_ENV === "test")
    ) {
      log.debug(
        { request_id: requestId, tenant_id: "pre_auth" },
        `[dev] password reset raw token (omit in prod): ${rawToken}`
      );
    }
  }

  return { ok: true };
}

export async function resetPassword(env: Env, body: ResetPasswordBody) {
  const tokenHash = hashResetToken(body.token);
  const creator = await repo.findCreatorByResetTokenHash(tokenHash);
  if (
    !creator ||
    !creator.passwordResetExpiresAt ||
    creator.passwordResetExpiresAt < new Date()
  ) {
    throw new HttpError(401, "Invalid or expired reset token", "invalid_reset_token");
  }
  const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);
  await repo.updatePassword(creator.id, passwordHash);
  const accessToken = signAccessToken(env, { sub: creator.id, email: creator.email });
  return {
    accessToken,
    creator: { id: creator.id, email: creator.email }
  };
}

export async function getMe(creatorId: string) {
  const creator = await repo.findCreatorById(creatorId);
  if (!creator) {
    throw new HttpError(401, "User not found", "user_not_found");
  }
  return { id: creator.id, email: creator.email };
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
