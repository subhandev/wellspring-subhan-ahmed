# 2026-05-14 — AuditLogAction migration (transaction-safe)

Replaced `ALTER TYPE "AuditLogAction" DROP VALUE 'media.relay_uploaded'` in `20260513200000_drop_audit_media_relay_uploaded/migration.sql` with the standard recreation flow: `CREATE TYPE ..._new`, `ALTER TABLE ... ALTER COLUMN ... USING`, `DROP TYPE` old, `RENAME TYPE` to final name. Reason: PostgreSQL rejects `DROP VALUE` inside a transaction; Prisma wraps migrations in a transaction, so Railway `migrate deploy` failed and left migration history stuck.

Recovery on Railway: from `backend/`, `pnpm exec prisma migrate resolve --schema src/prisma/schema.prisma --rolled-back 20260513200000_drop_audit_media_relay_uploaded` (or delete unfinished `_prisma_migrations` row), then redeploy.
