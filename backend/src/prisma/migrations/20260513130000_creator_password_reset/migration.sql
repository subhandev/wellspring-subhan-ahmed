-- AlterTable
ALTER TABLE "Creator" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "Creator" ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3);
