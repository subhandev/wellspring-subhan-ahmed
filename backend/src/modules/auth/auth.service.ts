import { AuditLogAction, Prisma } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import type { Env } from "../../config/env.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import { HttpError } from "../../lib/httpError.js";
import { toTenantId, type TenantId } from "../../types/tenant.js";
import { signAccessToken, signPasswordResetToken, verifyPasswordResetToken } from "./jwt.js";
import * as repo from "./repository.js";
import type { ForgotPasswordBody, LoginBody, ResetPasswordBody, SignupBody } from "./schemas.js";

const BCRYPT_ROUNDS = 10;

export type AuthTokenBundle = {
  accessToken: string;
  creator: { id: string; email: string };
};

export async function recordLogout(tenantId: TenantId, creatorId: string): Promise<void> {
  await appendAuditLog({
    tenantId,
    actorId: creatorId,
    action: AuditLogAction.auth_logged_out,
    targetType: "creator",
    targetId: creatorId
  });
}

export async function signup(env: Env, body: SignupBody): Promise<AuthTokenBundle> {
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

  const accessToken = signAccessToken(env, {
    sub: creator.id,
    tenantId: creator.id,
    email: creator.email
  });
  const tenantId = toTenantId(creator.id);
  await appendAuditLog({
    tenantId,
    actorId: creator.id,
    action: AuditLogAction.auth_signed_up,
    targetType: "creator",
    targetId: creator.id
  });
  return {
    accessToken,
    creator: { id: creator.id, email: creator.email }
  };
}

export async function login(env: Env, body: LoginBody): Promise<AuthTokenBundle> {
  const creator = await repo.findCreatorByEmail(body.email);
  if (!creator) {
    throw new HttpError(401, "Invalid email or password", "invalid_credentials");
  }
  const ok = await bcrypt.compare(body.password, creator.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid email or password", "invalid_credentials");
  }
  const accessToken = signAccessToken(env, {
    sub: creator.id,
    tenantId: creator.id,
    email: creator.email
  });
  return {
    accessToken,
    creator: { id: creator.id, email: creator.email }
  };
}

/**
 * Issues a short-lived reset JWT bound to the current `passwordHash`.
 * When the password is changed, the hash changes and the token can no longer be verified.
 */
export async function forgotPassword(
  _env: Env,
  body: ForgotPasswordBody
): Promise<{ resetToken: string | null }> {
  const creator = await repo.findCreatorByEmail(body.email);
  if (!creator) {
    return { resetToken: null };
  }
  const resetToken = signPasswordResetToken(_env, {
    id: creator.id,
    email: creator.email,
    passwordHash: creator.passwordHash
  });
  return { resetToken };
}

export async function resetPassword(env: Env, body: ResetPasswordBody): Promise<AuthTokenBundle> {
  const unverified = jwt.decode(body.token, { complete: false });
  if (
    unverified === null ||
    typeof unverified === "string" ||
    typeof unverified !== "object" ||
    typeof unverified.sub !== "string"
  ) {
    throw new HttpError(401, "Invalid reset token", "invalid_reset_token");
  }

  const creator = await repo.findCreatorById(unverified.sub);
  if (!creator) {
    throw new HttpError(401, "Invalid reset token", "invalid_reset_token");
  }

  try {
    verifyPasswordResetToken(env, body.token, creator.passwordHash);
  } catch {
    throw new HttpError(401, "Invalid or expired reset token", "invalid_reset_token");
  }

  const passwordHash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);
  await repo.updatePassword(creator.id, passwordHash);

  const tenantId = toTenantId(creator.id);
  await appendAuditLog({
    tenantId,
    actorId: creator.id,
    action: AuditLogAction.auth_password_reset,
    targetType: "creator",
    targetId: creator.id
  });

  const accessToken = signAccessToken(env, {
    sub: creator.id,
    tenantId: creator.id,
    email: creator.email
  });
  return {
    accessToken,
    creator: { id: creator.id, email: creator.email }
  };
}

export async function getMe(creatorId: string): Promise<{ id: string; email: string }> {
  const creator = await repo.findCreatorById(creatorId);
  if (!creator) {
    throw new HttpError(401, "User not found", "user_not_found");
  }
  return { id: creator.id, email: creator.email };
}
