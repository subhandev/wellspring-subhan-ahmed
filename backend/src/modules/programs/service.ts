import { HttpError } from "../../lib/httpError.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import type { TenantId } from "../../types/tenant.js";
import type { CreateProgramBody, UpdateProgramBody } from "./schemas.js";
import * as repo from "./repository.js";

export async function listPrograms(tenantId: TenantId) {
  return repo.listPrograms(tenantId);
}

export async function getProgram(tenantId: TenantId, id: string) {
  const p = await repo.getProgramById(tenantId, id);
  if (!p) {
    throw new HttpError(404, "Program not found", "not_found");
  }
  return p;
}

export async function createProgram(tenantId: TenantId, actorId: string, body: CreateProgramBody) {
  const p = await repo.createProgram(tenantId, {
    title: body.title,
    description: body.description
  });
  await appendAuditLog({
    tenantId,
    actorId,
    action: "program.created",
    targetType: "program",
    targetId: p.id,
    metadata: { title: p.title }
  });
  return { ...p, sessionCount: 0 };
}

export async function updateProgram(
  tenantId: TenantId,
  actorId: string,
  id: string,
  body: UpdateProgramBody
) {
  const p = await repo.updateProgram(tenantId, id, {
    title: body.title,
    description: body.description
  });
  if (!p) {
    throw new HttpError(404, "Program not found", "not_found");
  }
  await appendAuditLog({
    tenantId,
    actorId,
    action: "program.updated",
    targetType: "program",
    targetId: p.id
  });
  return p;
}

export async function removeProgram(tenantId: TenantId, actorId: string, id: string) {
  const ok = await repo.deleteProgram(tenantId, id);
  if (!ok) {
    throw new HttpError(404, "Program not found", "not_found");
  }
  await appendAuditLog({
    tenantId,
    actorId,
    action: "program.deleted",
    targetType: "program",
    targetId: id
  });
}
