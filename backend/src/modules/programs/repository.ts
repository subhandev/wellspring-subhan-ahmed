import type { Program } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { TenantId } from "../../types/tenant.js";

/** Program row returned to HTTP clients (session count for admin UI). */
export type ProgramDto = Program & { sessionCount: number };

function mapProgramWithCount(
  row: Program & { _count: { sessions: number } }
): ProgramDto {
  const { _count, ...rest } = row;
  return { ...rest, sessionCount: _count.sessions };
}

export async function listPrograms(tenantId: TenantId): Promise<ProgramDto[]> {
  const rows = await prisma.program.findMany({
    where: { tenantId: tenantId as string },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sessions: true } } }
  });
  return rows.map(mapProgramWithCount);
}

export async function getProgramById(tenantId: TenantId, id: string): Promise<ProgramDto | null> {
  const row = await prisma.program.findFirst({
    where: { id, tenantId: tenantId as string },
    include: { _count: { select: { sessions: true } } }
  });
  if (!row) {
    return null;
  }
  return mapProgramWithCount(row);
}

export async function createProgram(
  tenantId: TenantId,
  data: { title: string; description?: string | null }
): Promise<Program> {
  return prisma.program.create({
    data: {
      tenantId: tenantId as string,
      title: data.title,
      description: data.description ?? undefined
    }
  });
}

export async function updateProgram(
  tenantId: TenantId,
  id: string,
  data: { title?: string; description?: string | null }
): Promise<ProgramDto | null> {
  const patch = {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {})
  };
  const result = await prisma.program.updateMany({
    where: { id, tenantId: tenantId as string },
    data: patch
  });
  if (result.count === 0) {
    return null;
  }
  return getProgramById(tenantId, id);
}

export async function deleteProgram(tenantId: TenantId, id: string): Promise<boolean> {
  const result = await prisma.program.deleteMany({
    where: { id, tenantId: tenantId as string }
  });
  return result.count > 0;
}
