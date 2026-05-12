import type { Creator } from "@prisma/client";
import { prisma } from "../../config/database.js";

export async function findCreatorByEmail(email: string): Promise<Creator | null> {
  return prisma.creator.findUnique({ where: { email: email.toLowerCase().trim() } });
}

export async function findCreatorById(id: string): Promise<Creator | null> {
  return prisma.creator.findUnique({ where: { id } });
}

export async function createCreator(data: {
  email: string;
  passwordHash: string;
}): Promise<Creator> {
  return prisma.creator.create({
    data: {
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash
    }
  });
}

export async function updatePassword(id: string, passwordHash: string): Promise<void> {
  await prisma.creator.update({
    where: { id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null
    }
  });
}
