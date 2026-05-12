import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import {
  createSessionBodySchema,
  reorderSessionsBodySchema,
  updateSessionBodySchema
} from "./schemas.js";
import * as sessionsService from "./sessions.service.js";

function requireTenantContext(req: Parameters<RequestHandler>[0]) {
  const tenantId = req.tenantId;
  const creatorId = req.creatorId;
  if (!tenantId || !creatorId) {
    return null;
  }
  return { tenantId, creatorId };
}

export const list: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const programId = typeof req.query.programId === "string" ? req.query.programId : "";
    if (!programId) {
      next(new HttpError(400, "query programId is required", "validation_error"));
      return;
    }
    const sessions = await sessionsService.listSessions(ctx.tenantId, programId);
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
};

export const getById: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const session = await sessionsService.getSession(ctx.tenantId, req.params.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const parsed = createSessionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const session = await sessionsService.createSession(ctx.tenantId, ctx.creatorId, parsed.data);
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const parsed = updateSessionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const session = await sessionsService.updateSession(
      ctx.tenantId,
      ctx.creatorId,
      req.params.id,
      parsed.data
    );
    res.json(session);
  } catch (e) {
    next(e);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    await sessionsService.removeSession(ctx.tenantId, ctx.creatorId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};

export const reorder: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    const parsed = reorderSessionsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const sessions = await sessionsService.reorderSessions(
      ctx.tenantId,
      ctx.creatorId,
      parsed.data
    );
    res.json({ sessions });
  } catch (e) {
    next(e);
  }
};
