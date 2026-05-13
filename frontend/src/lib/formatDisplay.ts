/** Display helpers for admin lists (locale: en-US). */

/** Short relative time for dashboard stats (e.g. "2h ago"). */
export function formatRelativeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const ms = Date.now() - d.getTime();
  if (ms < 0) {
    return "just now";
  }
  const sec = Math.floor(ms / 1000);
  if (sec < 60) {
    return "just now";
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const h = Math.floor(min / 60);
  if (h < 48) {
    return `${h}h ago`;
  }
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

/** Audit log table: readable local time; use `title` on the cell for full ISO when needed. */
export function formatAuditLogTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function formatProgramCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return `Created ${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

/** Human-readable duration for session rows (e.g. "10 min", "90s"). */
export function formatSessionDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) {
    return `${m} min`;
  }
  return `${m} min ${s}s`;
}

/** Compact byte size for audit / upload metadata (base-1024). */
export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return mb < 10 ? `${mb.toFixed(1)} MB` : `${Math.round(mb)} MB`;
  }
  return `${(mb / 1024).toFixed(1)} GB`;
}
