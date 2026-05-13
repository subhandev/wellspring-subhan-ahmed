import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";
import multer from "multer";
import { HttpError } from "../lib/httpError.js";

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          success: false,
          error: {
            code: "validation_error",
            message: "CSV file exceeds maximum allowed size"
          },
          requestId: req.requestId
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          code: "validation_error",
          message: err.message || "File upload error"
        },
        requestId: req.requestId
      });
      return;
    }

    if (err instanceof HttpError) {
      res.status(err.status).json({
        success: false,
        error: {
          code: err.code ?? "error",
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {})
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
