import { prisma } from "../config/database.js";
import type { TenantId } from "../types/tenant.js";

/**
 * Persist an audit row for an admin write. `action` must use **past-tense**
 * verbs after `domain.` or `resource.` — e.g. `program.created`, `sessions.imported`.
 * See backend Cursor rule (`backend.mdc`) § Audit log actions.
 */
export async function appendAuditLog(input: {
  tenantId: TenantId;
  actorId: string;
  /** Past-tense dotted identifier, e.g. `program.updated`. */
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId as string,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? undefined,
      metadata: input.metadata as import("@prisma/client").Prisma.InputJsonValue | undefined
    }
  });
}
