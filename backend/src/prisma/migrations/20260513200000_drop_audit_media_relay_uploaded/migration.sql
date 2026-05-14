-- Remove legacy S3 relay audit value (requires PostgreSQL 15+ for DROP VALUE).
UPDATE "AuditLog"
SET action = 'media.presigned'::"AuditLogAction"
WHERE action = 'media.relay_uploaded'::"AuditLogAction";

ALTER TYPE "AuditLogAction" DROP VALUE 'media.relay_uploaded';
