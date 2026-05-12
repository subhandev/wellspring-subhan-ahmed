import type { Program } from "@prisma/client";
import { prisma } from "../../config/database.js";
import type { TenantId } from "../../types/tenant.js";

export async function listPrograms(tenantId: TenantId): Promise<Program[]> {
  return prisma.program.findMany({
    where: { tenantId: tenantId as string },
    orderBy: { createdAt: "desc" }
  });
}

export async function getProgramById(
  tenantId: TenantId,
  id: string
): Promise<Program | null> {
  return prisma.program.findFirst({
    where: { id, tenantId: tenantId as string }
  });
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
): Promise<Program | null> {
  const existing = await getProgramById(tenantId, id);
  if (!existing) {
    return null;
  }
  return prisma.program.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {})
    }
  });
}

export async function deleteProgram(
  tenantId: TenantId,
  id: string
): Promise<boolean> {
  const result = await prisma.program.deleteMany({
    where: { id, tenantId: tenantId as string }
  });
  return result.count > 0;
}
