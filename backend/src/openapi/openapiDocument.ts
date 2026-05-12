import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type ResponseConfig
} from "@asteasolutions/zod-to-openapi";
import { z } from "../lib/zodOpenapi.js";
import {
  signupBodySchema,
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema
} from "../modules/auth/schemas.js";
import { createProgramBodySchema, updateProgramBodySchema } from "../modules/programs/schemas.js";
import {
  createSessionBodySchema,
  reorderSessionsBodySchema,
  updateSessionBodySchema
} from "../modules/sessions/schemas.js";
import { presignBodySchema } from "../modules/uploads/schemas.js";
import { importSessionsBodySchema } from "../modules/import/schemas.js";
import { auditQuerySchema } from "../modules/audit/schemas.js";

const CreatorPublicSchema = z
  .object({
    id: z.string(),
    email: z.string().email()
  })
  .openapi("CreatorPublic");

const AuthTokenResponseSchema = z
  .object({
    accessToken: z.string(),
    creator: CreatorPublicSchema
  })
  .openapi("AuthTokenResponse");

const AuthSignupSuccessSchema = z
  .object({
    success: z.literal(true),
    data: AuthTokenResponseSchema
  })
  .openapi("AuthSignupSuccess");

const ForgotPasswordSuccessSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      resetToken: z.string().nullable()
    })
  })
  .openapi("ForgotPasswordSuccess");

const AuthMeSuccessSchema = z
  .object({
    success: z.literal(true),
    data: CreatorPublicSchema
  })
  .openapi("AuthMeSuccess");

const ErrorBodySchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string()
    }),
    requestId: z.string().optional()
  })
  .openapi("ErrorBody");

function err(description: string): ResponseConfig {
  return {
    description,
    content: {
      "application/json": {
        schema: ErrorBodySchema
      }
    }
  };
}

const ProgramSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    createdAt: z.union([z.string(), z.number()]).openapi({
      description: "ISO datetime string after JSON serialization"
    }),
    updatedAt: z.union([z.string(), z.number()]),
    sessionCount: z.number().int().openapi({ description: "Number of sessions in this program" })
  })
  .openapi("Program");

const ProgramListSchema = z.object({ programs: z.array(ProgramSchema) }).openapi("ProgramList");

const SessionSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    programId: z.string(),
    title: z.string(),
    durationSeconds: z.number(),
    position: z.number(),
    instructorName: z.string(),
    tags: z.array(z.string()),
    mediaUrl: z.string().nullable(),
    mediaType: z.string().nullable(),
    createdAt: z.union([z.string(), z.number()]),
    updatedAt: z.union([z.string(), z.number()])
  })
  .openapi("Session");

const SessionListWrapperSchema = z
  .object({ sessions: z.array(SessionSchema) })
  .openapi("SessionList");

const PresignResponseSchema = z
  .object({
    uploadUrl: z.string(),
    key: z.string(),
    bucket: z.string(),
    expiresIn: z.number(),
    contentType: z.string(),
    publicUrl: z.string()
  })
  .openapi("PresignResponse");

const ImportRowOkSchema = z.object({
  clientRowId: z.string(),
  ok: z.literal(true),
  sessionId: z.string(),
  idempotent: z.boolean().optional()
});

const ImportRowErrSchema = z.object({
  clientRowId: z.string(),
  ok: z.literal(false),
  errors: z.array(z.string())
});

const ImportRowResultSchema = z
  .union([ImportRowOkSchema, ImportRowErrSchema])
  .openapi("ImportRowResult");

const ImportSessionsResponseSchema = z
  .object({
    clientImportId: z.string(),
    results: z.array(ImportRowResultSchema)
  })
  .openapi("ImportSessionsResponse");

const AuditLogSchema = z
  .object({
    id: z.string(),
    tenantId: z.string(),
    actorId: z.string(),
    action: z.string(),
    targetType: z.string(),
    targetId: z.string().nullable(),
    metadata: z.unknown().nullable(),
    createdAt: z.union([z.string(), z.number()])
  })
  .openapi("AuditLog");

const AuditListSchema = z.object({ auditLogs: z.array(AuditLogSchema) }).openapi("AuditLogList");

const HealthSchema = z.object({ ok: z.literal(true) }).openapi("Health");

const jsonOk = (
  schema: z.ZodType,
  description: string = "Successful response"
): ResponseConfig => ({
  description,
  content: { "application/json": { schema } }
});

const bearer401 = err("Unauthorized: missing or invalid Bearer token");

export function buildOpenApiDocument(): ReturnType<OpenApiGeneratorV3["generateDocument"]> {
  const registry = new OpenAPIRegistry();

  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "HS256 JWT. Claims include `sub` and `tenantId` (both equal creator id) and `email`."
  });

  registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["System"],
    security: [],
    summary: "Liveness probe",
    responses: {
      200: jsonOk(HealthSchema, "Service is reachable")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/signup",
    tags: ["Auth"],
    security: [],
    summary: "Register a creator account",
    request: {
      body: {
        content: { "application/json": { schema: signupBodySchema } }
      }
    },
    responses: {
      201: jsonOk(AuthSignupSuccessSchema, "Registered; returns bearer token"),
      400: err("Validation error"),
      409: err("Email already registered"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    security: [],
    summary: "Login",
    request: {
      body: {
        content: { "application/json": { schema: loginBodySchema } }
      }
    },
    responses: {
      200: jsonOk(AuthSignupSuccessSchema, "Access token issued"),
      400: err("Validation error"),
      401: err("Invalid email or password"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/forgot-password",
    tags: ["Auth"],
    security: [],
    summary: "Request password reset JWT (no email sent)",
    description:
      "Returns a short-lived JWT tied to the current password hash, or `resetToken: null` if the email is unknown.",
    request: {
      body: {
        content: {
          "application/json": { schema: forgotPasswordBodySchema }
        }
      }
    },
    responses: {
      200: jsonOk(ForgotPasswordSuccessSchema, "Reset token issued when email exists"),
      400: err("Validation error"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/reset-password",
    tags: ["Auth"],
    security: [],
    summary: "Complete reset using JWT from forgot-password",
    request: {
      body: {
        content: {
          "application/json": { schema: resetPasswordBodySchema }
        }
      }
    },
    responses: {
      200: jsonOk(AuthSignupSuccessSchema, "Password updated"),
      400: err("Validation error"),
      401: err("Invalid or expired reset token"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/me",
    tags: ["Auth"],
    summary: "Current creator profile",
    responses: {
      200: jsonOk(AuthMeSuccessSchema, "Creator identity"),
      401: bearer401,
      404: err("User not found")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    tags: ["Auth"],
    summary: "Record logout (audit)",
    responses: {
      204: { description: "Logout recorded; discard JWT on the client" },
      401: bearer401,
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "get",
    path: "/v1/programs",
    tags: ["Programs"],
    summary: "List programs for authenticated tenant",
    responses: {
      200: jsonOk(ProgramListSchema, "Programs (order defined by persistence layer)"),
      401: bearer401,
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/v1/programs",
    tags: ["Programs"],
    summary: "Create program",
    request: {
      body: {
        content: {
          "application/json": { schema: createProgramBodySchema }
        }
      }
    },
    responses: {
      201: jsonOk(ProgramSchema, "Created program"),
      400: err("Validation error"),
      401: bearer401,
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "get",
    path: "/v1/programs/{id}",
    tags: ["Programs"],
    summary: "Get program by id",
    request: {
      params: z.object({ id: z.string().min(1) })
    },
    responses: {
      200: jsonOk(ProgramSchema, "Program detail"),
      401: bearer401,
      404: err("Program not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/v1/programs/{id}",
    tags: ["Programs"],
    summary: "Update program",
    request: {
      params: z.object({ id: z.string().min(1) }),
      body: {
        content: {
          "application/json": { schema: updateProgramBodySchema }
        }
      }
    },
    responses: {
      200: jsonOk(ProgramSchema, "Updated program"),
      400: err("Validation error"),
      401: bearer401,
      404: err("Program not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/v1/programs/{id}",
    tags: ["Programs"],
    summary: "Delete program",
    request: {
      params: z.object({ id: z.string().min(1) })
    },
    responses: {
      204: { description: "Deleted" },
      401: bearer401,
      404: err("Program not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "get",
    path: "/v1/sessions",
    tags: ["Sessions"],
    summary: "List sessions in a program",
    request: {
      query: z.object({
        programId: z
          .string()
          .min(1)
          .openapi({
            description: "Program id scoped to authenticated tenant",
            param: {
              style: "form",
              explode: true
            }
          })
      })
    },
    responses: {
      200: jsonOk(SessionListWrapperSchema, "Ordered sessions"),
      400: err("Missing or invalid query programId"),
      401: bearer401,
      404: err("Program not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/v1/sessions/reorder",
    tags: ["Sessions"],
    summary: "Reorder sessions within a program",
    request: {
      body: {
        content: {
          "application/json": { schema: reorderSessionsBodySchema }
        }
      }
    },
    responses: {
      200: jsonOk(SessionListWrapperSchema, "Sessions after reorder"),
      400: err("Validation or ordering constraint violated"),
      401: bearer401,
      404: err("Program not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/v1/sessions",
    tags: ["Sessions"],
    summary: "Create session",
    request: {
      body: {
        content: {
          "application/json": { schema: createSessionBodySchema }
        }
      }
    },
    responses: {
      201: jsonOk(SessionSchema, "Created session"),
      400: err("Validation error"),
      401: bearer401,
      404: err("Program not found for tenant"),
      409: err("Session position conflicts with existing row (unique programId+position)"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "get",
    path: "/v1/sessions/{id}",
    tags: ["Sessions"],
    summary: "Get session by id",
    request: {
      params: z.object({ id: z.string().min(1) })
    },
    responses: {
      200: jsonOk(SessionSchema, "Session detail"),
      401: bearer401,
      404: err("Session not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "patch",
    path: "/v1/sessions/{id}",
    tags: ["Sessions"],
    summary: "Update session",
    request: {
      params: z.object({ id: z.string().min(1) }),
      body: {
        content: {
          "application/json": { schema: updateSessionBodySchema }
        }
      }
    },
    responses: {
      200: jsonOk(SessionSchema, "Updated session"),
      400: err("Validation error"),
      401: bearer401,
      404: err("Session not found for tenant"),
      409: err("Session position conflicts with existing row (unique programId+position)"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "delete",
    path: "/v1/sessions/{id}",
    tags: ["Sessions"],
    summary: "Delete session",
    request: {
      params: z.object({ id: z.string().min(1) })
    },
    responses: {
      204: { description: "Deleted" },
      401: bearer401,
      404: err("Session not found for tenant"),
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/v1/uploads/presign",
    tags: ["Uploads"],
    summary: "Presign PUT to tenant-scoped S3 key",
    request: {
      body: {
        content: {
          "application/json": { schema: presignBodySchema }
        }
      }
    },
    responses: {
      201: jsonOk(PresignResponseSchema, "Presigned PUT URL issued"),
      400: err("Validation or unsupported content type"),
      401: bearer401,
      503: err("S3 not configured or JWT misconfigured")
    }
  });

  registry.registerPath({
    method: "post",
    path: "/v1/import/sessions",
    tags: ["Import"],
    summary: "CSV bulk import (idempotent per client_import_id / client_row_id)",
    request: {
      body: {
        content: {
          "application/json": { schema: importSessionsBodySchema }
        }
      }
    },
    responses: {
      200: jsonOk(ImportSessionsResponseSchema, "Per-row outcomes"),
      400: err("CSV or validation failures"),
      401: bearer401,
      503: err("JWT_SECRET not configured")
    }
  });

  registry.registerPath({
    method: "get",
    path: "/v1/audit",
    tags: ["Audit"],
    summary: "List audit log entries",
    request: {
      query: auditQuerySchema
    },
    responses: {
      200: jsonOk(AuditListSchema, "Recent audit logs (bounded)"),
      400: err("Invalid filter values"),
      401: bearer401,
      503: err("JWT_SECRET not configured")
    }
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Wellspring API",
      version: "1.0.0",
      description:
        "Multi-tenant CMS API for wellness creators. Public routes omit Bearer auth; tenant scope is enforced from JWT `sub` on protected routes."
    },
    servers: [{ url: "/" }],
    tags: [
      { name: "System" },
      { name: "Auth" },
      { name: "Programs" },
      { name: "Sessions" },
      { name: "Uploads" },
      { name: "Import" },
      { name: "Audit" }
    ],
    security: [{ bearerAuth: [] }]
  });
}
