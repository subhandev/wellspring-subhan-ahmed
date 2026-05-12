import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import {
  createProgramBodySchema,
  updateProgramBodySchema
} from "./schemas.js";
import * as programsService from "./service.js";

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
    const rows = await programsService.listPrograms(ctx.tenantId);
    res.json({ programs: rows });
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
    const program = await programsService.getProgram(ctx.tenantId, req.params.id);
    res.json(program);
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
    const parsed = createProgramBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const p = await programsService.createProgram(
      ctx.tenantId,
      ctx.creatorId,
      parsed.data
    );
    res.status(201).json(p);
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
    const parsed = updateProgramBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(new HttpError(400, "Invalid request body", "validation_error"));
      return;
    }
    const p = await programsService.updateProgram(
      ctx.tenantId,
      ctx.creatorId,
      req.params.id,
      parsed.data
    );
    res.json(p);
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
    await programsService.removeProgram(ctx.tenantId, ctx.creatorId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
