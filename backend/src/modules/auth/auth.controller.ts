import type { RequestHandler } from "express";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  signupBodySchema
} from "./schemas.js";
import * as authService from "./auth.service.js";

function getEnv(req: Parameters<RequestHandler>[0]): Env {
  return req.app.get("env") as Env;
}

function firstValidationMessage(err: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): string {
  const flat = err.flatten().fieldErrors;
  const firstKey = Object.keys(flat)[0];
  const msgs = firstKey ? flat[firstKey] : undefined;
  return msgs?.[0] ?? "Invalid request body";
}

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a creator account
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupBody'
 *     responses:
 *       201:
 *         description: Created — returns JWT access token and public creator profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 data:
 *                   type: object
 *                   required: [accessToken, creator]
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: HS256 JWT; payload includes sub, tenantId (creator id), email
 *                     creator:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         email: { type: string, format: email }
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StructuredError'
 *       409:
 *         description: Email already registered
 *       503:
 *         description: JWT_SECRET not configured
 */
export const signup: RequestHandler = async (req, res, next) => {
  try {
    const parsed = signupBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, firstValidationMessage(parsed.error), "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const data = await authService.signup(env, parsed.data);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and receive a JWT
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 data:
 *                   type: object
 *                   required: [accessToken, creator]
 *                   properties:
 *                     accessToken: { type: string }
 *                     creator:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         email: { type: string, format: email }
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid email or password
 *       503:
 *         description: JWT_SECRET not configured
 */
export const login: RequestHandler = async (req, res, next) => {
  try {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, firstValidationMessage(parsed.error), "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const data = await authService.login(env, parsed.data);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset JWT (no email is sent)
 *     description: |
 *       Returns a short-lived JWT signed with a key derived from the user's current password hash.
 *       If the email is unknown, `resetToken` is null. No email transport is performed.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordBody'
 *     responses:
 *       200:
 *         description: Reset token generated when the email exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 data:
 *                   type: object
 *                   required: [resetToken]
 *                   properties:
 *                     resetToken:
 *                       type: string
 *                       nullable: true
 *                       description: Opaque reset JWT, or null if email was not found
 *       400:
 *         description: Validation failed
 *       503:
 *         description: JWT_SECRET not configured
 */
export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const parsed = forgotPasswordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, firstValidationMessage(parsed.error), "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const out = await authService.forgotPassword(env, parsed.data);
    res.status(200).json({ success: true, data: out });
  } catch (e) {
    next(e);
  }
};

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the forgot-password JWT
 *     description: |
 *       Verifies the reset token against the stored password hash. After a successful password change,
 *       the hash rotates and previously issued reset tokens are invalidated automatically.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordBody'
 *     responses:
 *       200:
 *         description: Password updated; new access token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 data:
 *                   type: object
 *                   required: [accessToken, creator]
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Invalid or expired reset token
 *       503:
 *         description: JWT_SECRET not configured
 */
export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const parsed = resetPasswordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, firstValidationMessage(parsed.error), "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const data = await authService.resetPassword(env, parsed.data);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current authenticated creator
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Creator identity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, data]
 *               properties:
 *                 success: { type: boolean, enum: [true] }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     email: { type: string, format: email }
 *       401:
 *         description: Missing or invalid bearer token
 */
export const me: RequestHandler = async (req, res, next) => {
  try {
    const creatorId = req.creatorId;
    if (!creatorId) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const data = await authService.getMe(creatorId);
    res.status(200).json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
