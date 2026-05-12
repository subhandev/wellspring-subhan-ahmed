import { prisma } from "../config/database.js";
import type { TenantId } from "../types/tenant.js";

export async function appendAuditLog(input: {
  tenantId: TenantId;
  actorId: string;
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
