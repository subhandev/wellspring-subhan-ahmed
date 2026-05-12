/** Display helpers for admin lists (locale: en-US). */

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
