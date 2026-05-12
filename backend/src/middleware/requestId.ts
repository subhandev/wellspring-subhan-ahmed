import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};
