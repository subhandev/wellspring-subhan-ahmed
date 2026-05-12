/** Shared domain types for the admin UI (mirrors API shapes where applicable). */

export type Program = {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  sessionCount: number;
};

export type SessionRow = {
  id: string;
  title: string;
  durationSeconds: number;
  position: number;
  instructorName: string;
  tags: string[];
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export type AuditLogRow = {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
};

export type CsvImportRowResult =
  | { clientRowId: string; ok: true; sessionId: string; idempotent?: boolean }
  | { clientRowId: string; ok: false; errors?: string[] };
