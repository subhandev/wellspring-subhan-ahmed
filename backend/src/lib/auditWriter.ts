import type { AuditLogAction } from "@prisma/client";
import { prisma } from "../config/database.js";
import type { TenantId } from "../types/tenant.js";

/**
 * Persist an audit row for an admin write. Use {@link AuditLogAction} members
 * (e.g. `AuditLogAction.program_created`); GET /v1/audit maps these to dotted
 * strings for clients. See backend Cursor rule (`backend.mdc`) § Audit log actions.
 */
export async function appendAuditLog(input: {
  tenantId: TenantId;
  actorId: string;
  action: AuditLogAction;
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
