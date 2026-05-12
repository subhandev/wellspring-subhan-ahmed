import type { RequestHandler } from "express";

export const notImplemented: RequestHandler = (_req, res) => {
  res.status(501).json({ error: "not_implemented", module: "audit" });
};
