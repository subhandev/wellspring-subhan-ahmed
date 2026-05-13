import { AuditLogAction } from "@prisma/client";

/** Values exposed on GET /v1/audit (stable dotted identifiers). */
export const AUDIT_ACTION_API_VALUES = [
  "auth.logged_out",
  "auth.signed_up",
  "auth.password_reset",
  "program.created",
  "program.updated",
  "program.deleted",
  "session.created",
  "session.updated",
  "session.deleted",
  "session.reordered",
  "sessions.imported",
  "media.presigned",
  "media.relay_uploaded"
] as const;

export type AuditActionApiValue = (typeof AUDIT_ACTION_API_VALUES)[number];

/** Map stable API / filter strings to persisted Prisma enum. */
export const auditActionApiToPrisma: Record<AuditActionApiValue, AuditLogAction> = {
  "auth.logged_out": AuditLogAction.auth_logged_out,
  "auth.signed_up": AuditLogAction.auth_signed_up,
  "auth.password_reset": AuditLogAction.auth_password_reset,
  "program.created": AuditLogAction.program_created,
  "program.updated": AuditLogAction.program_updated,
  "program.deleted": AuditLogAction.program_deleted,
  "session.created": AuditLogAction.session_created,
  "session.updated": AuditLogAction.session_updated,
  "session.deleted": AuditLogAction.session_deleted,
  "session.reordered": AuditLogAction.session_reordered,
  "sessions.imported": AuditLogAction.sessions_imported,
  "media.presigned": AuditLogAction.media_presigned,
  "media.relay_uploaded": AuditLogAction.media_relay_uploaded
};

const toApi = new Map<AuditLogAction, AuditActionApiValue>(
  (Object.entries(auditActionApiToPrisma) as [AuditActionApiValue, AuditLogAction][]).map(([k, v]) => [
    v,
    k
  ])
);

export function auditActionToApi(action: AuditLogAction): AuditActionApiValue {
  const out = toApi.get(action);
  if (!out) {
    throw new Error(`Unknown AuditLogAction: ${String(action)}`);
  }
  return out;
}
