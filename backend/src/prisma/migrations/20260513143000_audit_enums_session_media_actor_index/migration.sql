-- CreateEnum
CREATE TYPE "AuditLogAction" AS ENUM (
  'auth.logged_out',
  'program.created',
  'program.updated',
  'program.deleted',
  'session.created',
  'session.updated',
  'session.deleted',
  'session.reordered',
  'sessions.imported',
  'media.presigned',
  'media.relay_uploaded'
);

-- AlterEnum (AuditLog.action)
ALTER TABLE "AuditLog"
  ALTER COLUMN "action" TYPE "AuditLogAction"
  USING ("action"::text::"AuditLogAction");

-- CreateEnum
CREATE TYPE "SessionImportKeyStatus" AS ENUM ('pending', 'success');

-- AlterEnum (SessionImportKey.status)
ALTER TABLE "SessionImportKey"
  ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "SessionImportKey"
  ALTER COLUMN "status" TYPE "SessionImportKeyStatus"
  USING ("status"::text::"SessionImportKeyStatus");
ALTER TABLE "SessionImportKey"
  ALTER COLUMN "status" SET DEFAULT 'success'::"SessionImportKeyStatus";

-- CreateEnum
CREATE TYPE "SessionMediaType" AS ENUM ('AUDIO', 'VIDEO');

-- Migrate Session.mediaType from free-form text / MIME to SessionMediaType
ALTER TABLE "Session" ADD COLUMN "mediaType_new" "SessionMediaType";

UPDATE "Session"
SET "mediaType_new" = CASE
  WHEN "mediaType" IS NULL THEN NULL
  WHEN "mediaType"::text IN ('AUDIO', 'VIDEO') THEN "mediaType"::text::"SessionMediaType"
  WHEN LOWER("mediaType"::text) LIKE 'audio/%' THEN 'AUDIO'::"SessionMediaType"
  WHEN LOWER("mediaType"::text) LIKE 'video/%' THEN 'VIDEO'::"SessionMediaType"
  ELSE NULL
END;

ALTER TABLE "Session" DROP COLUMN "mediaType";
ALTER TABLE "Session" RENAME COLUMN "mediaType_new" TO "mediaType";

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
