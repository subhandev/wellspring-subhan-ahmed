-- AlterTable
ALTER TABLE "SessionImportKey" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'success';

-- AlterTable
ALTER TABLE "SessionImportKey" ADD COLUMN "errorMsg" TEXT;
