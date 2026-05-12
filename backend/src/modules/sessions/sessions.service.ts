import { Prisma } from "@prisma/client";
import { HttpError } from "../../lib/httpError.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import { prisma } from "../../config/database.js";
import type { TenantId } from "../../types/tenant.js";
import type { CreateSessionBody, ReorderSessionsBody, UpdateSessionBody } from "./schemas.js";
import * as repo from "./sessions.repository.js";

const POSITION_CONFLICT_MESSAGE =
  "Position is already in use for this program. Choose another position or use the reorder endpoint.";

function throwIfSessionPositionConflict(err: unknown): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    throw new HttpError(409, POSITION_CONFLICT_MESSAGE, "position_conflict");
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
      action: "session.created",
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
  try {
    const session = await repo.updateSession(tenantId, id, body);
    if (!session) {
      throw new HttpError(404, "Session not found", "not_found");
    }
    await appendAuditLog({
      tenantId,
      actorId,
      action: "session.updated",
      targetType: "session",
      targetId: id
    });
    return session;
  } catch (err) {
    throwIfSessionPositionConflict(err);
    throw err;
  }
}

export async function removeSession(tenantId: TenantId, actorId: string, id: string) {
  const ok = await repo.deleteSession(tenantId, id);
  if (!ok) {
    throw new HttpError(404, "Session not found", "not_found");
  }
  await appendAuditLog({
    tenantId,
    actorId,
    action: "session.deleted",
    targetType: "session",
    targetId: id
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
    throw new HttpError(400, "orderedSessionIds must not contain duplicates", "validation_error");
  }
  if (existing.length !== body.orderedSessionIds.length) {
    throw new HttpError(
      400,
      "orderedSessionIds must list every session in the program",
      "validation_error"
    );
  }
  for (const id of body.orderedSessionIds) {
    if (!existingIds.has(id)) {
      throw new HttpError(400, "Unknown session id for this program", "validation_error");
    }
  }

  await prisma.$transaction(async (tx) => {
    const offset = 1_000_000;
    for (let i = 0; i < body.orderedSessionIds.length; i++) {
      const sid = body.orderedSessionIds[i];
      await tx.session.updateMany({
        where: {
          id: sid,
          tenantId: tenantId as string,
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
          tenantId: tenantId as string,
          programId: body.programId
        },
        data: { position: i }
      });
    }
  });

  await appendAuditLog({
    tenantId,
    actorId,
    action: "session.reordered",
    targetType: "program",
    targetId: body.programId
  });

  return repo.listSessionsForProgram(tenantId, body.programId);
}
