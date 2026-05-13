-- AlterEnum: auth account lifecycle (signup + password reset)
ALTER TYPE "AuditLogAction" ADD VALUE 'auth.signed_up';
ALTER TYPE "AuditLogAction" ADD VALUE 'auth.password_reset';
