-- Remove legacy `media.relay_uploaded` using enum recreation (safe inside a transaction).
-- `ALTER TYPE ... DROP VALUE` cannot run in a transaction block, which breaks Prisma migrate.
--
-- If this migration previously failed on deploy, from `backend/` run before redeploying:
--   pnpm exec prisma migrate resolve --schema src/prisma/schema.prisma --rolled-back 20260513200000_drop_audit_media_relay_uploaded
-- Or in psql (only when the migration never committed):
--   DELETE FROM "_prisma_migrations"
--   WHERE "migration_name" = '20260513200000_drop_audit_media_relay_uploaded' AND "finished_at" IS NULL;

UPDATE "AuditLog"
SET "action" = 'media.presigned'::"AuditLogAction"
WHERE "action"::text = 'media.relay_uploaded';

CREATE TYPE "AuditLogAction_new" AS ENUM (
  'auth.logged_out',
  'auth.signed_up',
  'auth.password_reset',
  'program.created',
  'program.updated',
  'program.deleted',
  'session.created',
  'session.updated',
  'session.deleted',
  'session.reordered',
  'sessions.imported',
  'media.presigned'
);

ALTER TABLE "AuditLog"
  ALTER COLUMN "action" TYPE "AuditLogAction_new"
  USING (
    CASE "action"::text
      WHEN 'media.relay_uploaded' THEN 'media.presigned'
      ELSE "action"::text
    END::"AuditLogAction_new"
  );

DROP TYPE "AuditLogAction";

ALTER TYPE "AuditLogAction_new" RENAME TO "AuditLogAction";
