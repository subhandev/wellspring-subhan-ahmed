import type { ErrorRequestHandler } from "express";
import type { Logger } from "pino";

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err, req, res, next) => {
    if (res.headersSent) {
      next(err);
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
      error: status === 500 ? "internal_error" : "error",
      message: status === 500 ? "Internal Server Error" : message,
      requestId: req.requestId
    });
  };
}
