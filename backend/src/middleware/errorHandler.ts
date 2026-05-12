import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import { HttpError } from "../lib/httpError.js";

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof HttpError) {
      res.status(err.status).json({
        success: false,
        error: {
          code: err.code ?? "error",
          message: err.message
        },
        requestId: req.requestId
      });
      return;
    }

    const status =
      typeof err === "object" &&
      err &&
      "status" in err &&
      typeof (err as { status?: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;

    const message = err instanceof Error ? err.message : "Internal Server Error";

    logger.error(
      {
        err,
        request_id: req.requestId,
        tenant_id: req.tenantId ?? "pre_auth"
      },
      message
    );

    res.status(status).json({
      success: false,
      error: {
        code: status === 500 ? "internal_error" : "error",
        message: status === 500 ? "Internal Server Error" : message
      },
      requestId: req.requestId
    });
  };
}
