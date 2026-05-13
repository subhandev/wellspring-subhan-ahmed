import { AuditLogAction, Prisma } from "@prisma/client";
import { SESSION_POSITION_CONFLICT_USER_MESSAGE } from "../../lib/sessionPositionConflict.js";
import { HttpError } from "../../lib/httpError.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import { assertSessionMediaUrlForTenant } from "../../lib/sessionMediaUrl.js";
import { prisma } from "../../config/database.js";
import type { TenantId } from "../../types/tenant.js";
import type { CreateSessionBody, ReorderSessionsBody, UpdateSessionBody } from "./schemas.js";
import * as repo from "./sessions.repository.js";

function throwIfSessionPositionConflict(err: unknown): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new HttpError(409, SESSION_POSITION_CONFLICT_USER_MESSAGE, "position_conflict", {
      fieldErrors: { position: [SESSION_POSITION_CONFLICT_USER_MESSAGE] },
      formErrors: [] as string[]
    });
  }
}

export async function listSessions(tenantId: TenantId, programId: string) {
  const program = await repo.assertProgramOwnedByTenant(tenantId, programId);
  if (!program) {
    throw new HttpError(404, "Program not found", "not_found");
  }
  return repo.listSessionsForProgram(tenantId, programId);
}

export async function getSession(tenantId: TenantId, id: string) {
  const s = await repo.getSessionById(tenantId, id);
  if (!s) {
    throw new HttpError(404, "Session not found", "not_found");
  }
  return s;
}

export async function createSession(tenantId: TenantId, actorId: string, body: CreateSessionBody) {
  const program = await repo.assertProgramOwnedByTenant(tenantId, body.programId);
  if (!program) {
    throw new HttpError(404, "Program not found", "not_found");
  }

  const position =
    body.position !== undefined ? body.position : await repo.nextPosition(tenantId, body.programId);

  assertSessionMediaUrlForTenant(tenantId, body.mediaUrl);

  try {
    const session = await repo.createSession(tenantId, {
      programId: body.programId,
      title: body.title,
      durationSeconds: body.durationSeconds,
      position,
      instructorName: body.instructorName,
      tags: body.tags,
      mediaUrl: body.mediaUrl,
      mediaType: body.mediaType
    });

    await appendAuditLog({
      tenantId,
      actorId,
      action: AuditLogAction.session_created,
      targetType: "session",
      targetId: session.id,
      metadata: { programId: body.programId, title: session.title }
    });

    return session;
  } catch (err) {
    throwIfSessionPositionConflict(err);
    throw err;
  }
}

export async function updateSession(
  tenantId: TenantId,
  actorId: string,
  id: string,
  body: UpdateSessionBody
) {
  const patch: UpdateSessionBody = { ...body };
  if (patch.mediaUrl === null) {
    patch.mediaType = null;
  }

  if (patch.mediaUrl !== undefined) {
    assertSessionMediaUrlForTenant(tenantId, patch.mediaUrl);
  }

  try {
    const session = await repo.updateSession(tenantId, id, patch);
    if (!session) {
      throw new HttpError(404, "Session not found", "not_found");
    }
    await appendAuditLog({
      tenantId,
      actorId,
      action: AuditLogAction.session_updated,
      targetType: "session",
      targetId: id,
      metadata: { programId: session.programId, title: session.title }
    });
    return session;
  } catch (err) {
    throwIfSessionPositionConflict(err);
    throw err;
  }
}

export async function removeSession(tenantId: TenantId, actorId: string, id: string) {
  const existing = await repo.getSessionById(tenantId, id);
  if (!existing) {
    throw new HttpError(404, "Session not found", "not_found");
  }
  const ok = await repo.deleteSession(tenantId, id);
  if (!ok) {
    throw new HttpError(404, "Session not found", "not_found");
  }
  await appendAuditLog({
    tenantId,
    actorId,
    action: AuditLogAction.session_deleted,
    targetType: "session",
    targetId: id,
    metadata: { programId: existing.programId, title: existing.title }
  });
}

export async function reorderSessions(
  tenantId: TenantId,
  actorId: string,
  body: ReorderSessionsBody
) {
  const program = await repo.assertProgramOwnedByTenant(tenantId, body.programId);
  if (!program) {
    throw new HttpError(404, "Program not found", "not_found");
  }

  const existing = await repo.listSessionsForProgram(tenantId, body.programId);
  const existingIds = new Set(existing.map((s) => s.id));
  const uniq = new Set(body.orderedSessionIds);
  if (uniq.size !== body.orderedSessionIds.length) {
    throw new HttpError(400, "orderedSessionIds must not contain duplicates", "validation_error", {
      fieldErrors: {
        orderedSessionIds: ["Must not contain duplicate session ids"]
      },
      formErrors: [] as string[]
    });
  }
  if (existing.length !== body.orderedSessionIds.length) {
    throw new HttpError(
      400,
      "orderedSessionIds must list every session in the program",
      "validation_error",
      {
        fieldErrors: {
          orderedSessionIds: [
            `Expected ${existing.length} session id(s), got ${body.orderedSessionIds.length}`
          ]
        },
        formErrors: [] as string[]
      }
    );
  }
  for (const id of body.orderedSessionIds) {
    if (!existingIds.has(id)) {
      throw new HttpError(400, "Unknown session id for this program", "validation_error", {
        fieldErrors: {
          orderedSessionIds: ["Each id must belong to this program"]
        },
        formErrors: [] as string[]
      });
    }
  }

  const tenant = tenantId as string;
  /** Two sequential update passes × N rows; default Prisma interactive tx timeout is 5s and hits P2028 for larger programs. */
  const reorderTxTimeoutMs = Math.min(
    120_000,
    Math.max(15_000, body.orderedSessionIds.length * 500 + 12_000)
  );

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "Session" WHERE "tenantId" = ${tenant} AND "programId" = ${body.programId} ORDER BY id FOR UPDATE`
        );

        const offset = 1_000_000;
        for (let i = 0; i < body.orderedSessionIds.length; i++) {
          const sid = body.orderedSessionIds[i];
          await tx.session.updateMany({
            where: {
              id: sid,
              tenantId: tenant,
              programId: body.programId
            },
            data: { position: offset + i }
          });
        }
        for (let i = 0; i < body.orderedSessionIds.length; i++) {
          const sid = body.orderedSessionIds[i];
          await tx.session.updateMany({
            where: {
              id: sid,
              tenantId: tenant,
              programId: body.programId
            },
            data: { position: i }
          });
        }
      },
      { maxWait: 20_000, timeout: reorderTxTimeoutMs }
    );
  } catch (err) {
    throwIfSessionPositionConflict(err);
    throw err;
  }

  await appendAuditLog({
    tenantId,
    actorId,
    action: AuditLogAction.session_reordered,
    targetType: "program",
    targetId: body.programId
  });

  return repo.listSessionsForProgram(tenantId, body.programId);
}
