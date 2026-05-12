import type { RequestHandler } from "express";
import type { Env } from "../../config/env.js";
import { HttpError } from "../../lib/httpError.js";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  signupBodySchema
} from "./schemas.js";
import * as authService from "./service.js";

function getEnv(req: Parameters<RequestHandler>[0]): Env {
  return req.app.get("env") as Env;
}

export const signup: RequestHandler = async (req, res, next) => {
  try {
    const parsed = signupBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const out = await authService.signup(env, parsed.data);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const out = await authService.login(env, parsed.data);
    res.status(200).json(out);
  } catch (e) {
    next(e);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const parsed = forgotPasswordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const env = getEnv(req);
    const log = req.log;
    await authService.forgotPassword(env, parsed.data, log, req.requestId);
    res.status(202).json({ ok: true });
  } catch (e) {
    next(e);
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  try {
    const parsed = resetPasswordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const env = getEnv(req);
    if (!env.JWT_SECRET) {
      next(new HttpError(503, "JWT_SECRET is not configured", "auth_misconfigured"));
      return;
    }
    const out = await authService.resetPassword(env, parsed.data);
    res.status(200).json(out);
  } catch (e) {
    next(e);
  }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    const creatorId = req.creatorId;
    if (!creatorId) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const out = await authService.getMe(creatorId);
    res.status(200).json(out);
  } catch (e) {
    next(e);
  }
};
