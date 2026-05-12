import type { Program, Session } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { TenantId } from "../../types/tenant.js";

export async function assertProgramOwnedByTenant(
  tenantId: TenantId,
  programId: string
): Promise<Program | null> {
  return prisma.program.findFirst({
    where: { id: programId, tenantId: tenantId as string }
  });
}

export async function listSessionsForProgram(
  tenantId: TenantId,
  programId: string
): Promise<Session[]> {
  return prisma.session.findMany({
    where: {
      tenantId: tenantId as string,
      programId
    },
    orderBy: { position: "asc" }
  });
}

export async function getSessionById(tenantId: TenantId, id: string): Promise<Session | null> {
  return prisma.session.findFirst({
    where: { id, tenantId: tenantId as string }
  });
}

export async function nextPosition(tenantId: TenantId, programId: string): Promise<number> {
  const agg = await prisma.session.aggregate({
    where: { tenantId: tenantId as string, programId },
    _max: { position: true }
  });
  return (agg._max.position ?? -1) + 1;
}

export async function createSession(
  tenantId: TenantId,
  data: {
    programId: string;
    title: string;
    durationSeconds: number;
    position: number;
    instructorName: string;
    tags: string[];
    mediaUrl: string | null | undefined;
    mediaType: string | null | undefined;
  }
): Promise<Session> {
  return prisma.session.create({
    data: {
      tenantId: tenantId as string,
      programId: data.programId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      position: data.position,
      instructorName: data.instructorName,
      tags: data.tags,
      mediaUrl: data.mediaUrl ?? undefined,
      mediaType: data.mediaType ?? undefined
    }
  });
}

export async function updateSession(
  tenantId: TenantId,
  id: string,
  data: {
    title?: string;
    durationSeconds?: number;
    position?: number;
    instructorName?: string;
    tags?: string[];
    mediaUrl?: string | null;
    mediaType?: string | null;
  }
): Promise<Session | null> {
  const existing = await getSessionById(tenantId, id);
  if (!existing) {
    return null;
  }
  const result = await prisma.session.updateMany({
    where: { id, tenantId: tenantId as string },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.durationSeconds !== undefined ? { durationSeconds: data.durationSeconds } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
      ...(data.instructorName !== undefined ? { instructorName: data.instructorName } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.mediaUrl !== undefined ? { mediaUrl: data.mediaUrl } : {}),
      ...(data.mediaType !== undefined ? { mediaType: data.mediaType } : {})
    }
  });
  if (result.count === 0) {
    return null;
  }
  return getSessionById(tenantId, id);
}

export async function deleteSession(tenantId: TenantId, id: string): Promise<boolean> {
  const result = await prisma.session.deleteMany({
    where: { id, tenantId: tenantId as string }
  });
  return result.count > 0;
}
