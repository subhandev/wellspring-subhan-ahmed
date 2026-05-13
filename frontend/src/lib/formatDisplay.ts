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
