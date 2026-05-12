import express, { type Application } from "express";
import pinoHttp from "pino-http";
import { loadEnv, type Env } from "./config/env.js";
import { createRootLogger } from "./config/logger.js";
import { createErrorHandler } from "./middleware/errorHandler.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { authStubMiddleware } from "./middleware/auth.js";
import { authRouter } from "./modules/auth/routes.js";
import { programsRouter } from "./modules/programs/routes.js";
import { sessionsRouter } from "./modules/sessions/routes.js";
import { uploadsRouter } from "./modules/uploads/routes.js";
import { importRouter } from "./modules/import/routes.js";
import { auditRouter } from "./modules/audit/routes.js";

export function createApp(env: Env = loadEnv()): Application {
  const logger = createRootLogger(env);
  const app = express();

  app.disable("x-powered-by");

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.requestId,
      customProps: (req) => ({
        request_id: req.requestId,
        tenant_id: req.tenantId ?? "pre_auth"
      })
    })
  );

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use(authStubMiddleware);

  app.use("/v1/auth", authRouter);
  app.use("/v1/programs", programsRouter);
  app.use("/v1/sessions", sessionsRouter);
  app.use("/v1/uploads", uploadsRouter);
  app.use("/v1/import", importRouter);
  app.use("/v1/audit", auditRouter);

  app.use(createErrorHandler(logger));

  return app;
}
