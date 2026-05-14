import { formatByteSize } from "@/lib/formatDisplay";
import type { AuditLogRow } from "@/types";

/** Max rows returned by GET /v1/audit (must match backend `take`). */
export const AUDIT_LIST_MAX = 500;

export const AUDIT_ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "auth.signed_up", label: "Auth signed up" },
  { value: "auth.password_reset", label: "Auth password reset" },
  { value: "auth.logged_out", label: "Auth logged out" },
  { value: "program.created", label: "Program created" },
  { value: "program.updated", label: "Program updated" },
  { value: "program.deleted", label: "Program deleted" },
  { value: "session.created", label: "Session created" },
  { value: "session.updated", label: "Session updated" },
  { value: "session.deleted", label: "Session deleted" },
  { value: "session.reordered", label: "Session reordered" },
  { value: "sessions.imported", label: "Sessions imported" },
  { value: "media.presigned", label: "Media presigned" }
];

const ACTION_LABEL_MAP = Object.fromEntries(
  AUDIT_ACTION_FILTERS.filter((o) => o.value).map((o) => [o.value, o.label])
) as Record<string, string>;

export function humanAuditAction(action: string): string {
  return ACTION_LABEL_MAP[action] ?? action;
}

function metaRecord(metadata: unknown): Record<string, unknown> | null {
  if (metadata === null || metadata === undefined) {
    return null;
  }
  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  return metadata as Record<string, unknown>;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** One-line summary from stored metadata and action (best-effort). */
export function summarizeAuditRow(row: AuditLogRow): string | null {
  const m = metaRecord(row.metadata);
  if (!m) {
    if (row.action === "session.reordered") {
      return "Sessions reordered";
    }
    return null;
  }

  switch (row.action) {
    case "sessions.imported": {
      const rows = num(m.rows);
      const failed = num(m.failed);
      const parts: string[] = [];
      if (rows != null) {
        parts.push(`${rows} row${rows === 1 ? "" : "s"}`);
      }
      if (failed != null && failed > 0) {
        parts.push(`${failed} failed`);
      }
      if (parts.length) {
        return parts.join(" · ");
      }
      return str(m.clientImportId);
    }
    case "media.presigned": {
      const ct = str(m.contentType);
      const bytes = num(m.bytes);
      const bits = [ct, bytes != null ? formatByteSize(bytes) : null].filter(Boolean) as string[];
      return bits.length ? bits.join(" · ") : null;
    }
    case "program.created":
    case "program.updated":
    case "program.deleted":
      return str(m.title);
    case "session.created":
    case "session.updated":
    case "session.deleted": {
      const title = str(m.title);
      const programId = str(m.programId);
      if (title && programId) {
        return `${title}\nProgram: ${programId}`;
      }
      return title ?? programId;
    }
    default:
      return null;
  }
}

export function truncateAuditId(id: string | null, max = 16): { short: string; full: string } {
  if (!id) {
    return { short: "—", full: "" };
  }
  if (id.length <= max) {
    return { short: id, full: id };
  }
  return { short: `${id.slice(0, max)}…`, full: id };
}

export function targetTypeLabel(type: string): string {
  const map: Record<string, string> = {
    program: "Program",
    session: "Session",
    import: "Import",
    s3_object: "Media",
    creator: "Creator"
  };
  return map[type] ?? type;
}

export function auditRowMatchesSearch(row: AuditLogRow, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const parts = [
    row.action,
    row.targetType,
    row.targetId ?? "",
    row.actorEmail,
    row.actorId,
    summarizeAuditRow(row) ?? "",
    humanAuditAction(row.action)
  ]
    .join(" ")
    .toLowerCase();
  return parts.includes(needle);
}
