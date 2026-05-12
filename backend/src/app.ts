import express, { type Application } from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { apiDocsEnabled, loadEnv, type Env } from "./config/env.js";
import { buildOpenApiDocument } from "./openapi/openapiDocument.js";
import { createRootLogger } from "./config/logger.js";
import { createErrorHandler } from "./middleware/errorHandler.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { createAuthenticateMiddleware } from "./middleware/authenticate.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { programsRouter } from "./modules/programs/routes.js";
import { sessionsRouter } from "./modules/sessions/sessions.routes.js";
import { uploadsRouter } from "./modules/uploads/routes.js";
import { importRouter } from "./modules/import/routes.js";
import { auditRouter } from "./modules/audit/routes.js";

export function createApp(env: Env = loadEnv()): Application {
  const logger = createRootLogger(env);
  const app = express();

  app.disable("x-powered-by");
  app.set("env", env);

  app.use(createCorsMiddleware(env));
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

  if (apiDocsEnabled(env)) {
    const openApiDocument = buildOpenApiDocument();
    app.get("/openapi.json", (_req, res) => {
      res.json(openApiDocument);
    });
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  } else {
    app.get("/openapi.json", (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: "not_found",
          message: "API documentation is disabled"
        },
        requestId: req.requestId
      });
    });
    app.use("/api-docs", (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: "not_found",
          message: "API documentation is disabled"
        },
        requestId: req.requestId
      });
    });
  }

  app.use(createAuthenticateMiddleware(() => app.get("env") as Env));

  app.use("/api/auth", authRouter);
  app.use("/v1/programs", programsRouter);
  app.use("/v1/sessions", sessionsRouter);
  app.use("/v1/uploads", uploadsRouter);
  app.use("/v1/import", importRouter);
  app.use("/v1/audit", auditRouter);

  app.use(createErrorHandler(logger));

  return app;
}
