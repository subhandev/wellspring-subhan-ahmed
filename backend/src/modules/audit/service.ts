import { prisma } from "../../config/database.js";
import { HttpError } from "../../lib/httpError.js";
import type { TenantId } from "../../types/tenant.js";
import type { AuditQuery } from "./schemas.js";

export async function listAuditLogs(tenantId: TenantId, query: AuditQuery) {
  const where: {
    tenantId: string;
    createdAt?: { gte?: Date; lte?: Date };
    action?: string;
  } = {
    tenantId: tenantId as string
  };

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) {
      const d = new Date(query.from);
      if (Number.isNaN(d.getTime())) {
        throw new HttpError(400, "Invalid from date", "validation_error");
      }
      where.createdAt.gte = d;
    }
    if (query.to) {
      const d = new Date(query.to);
      if (Number.isNaN(d.getTime())) {
        throw new HttpError(400, "Invalid to date", "validation_error");
      }
      where.createdAt.lte = d;
    }
  }

  if (query.action) {
    where.action = query.action;
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      actor: { select: { email: true } }
    }
  });

  return logs.map(({ actor, ...row }) => ({
    ...row,
    actorEmail: actor.email
  }));
}
