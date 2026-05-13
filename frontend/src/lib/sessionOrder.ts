import type { SessionRow } from "@/types";

/** Stable program order: `position` ascending, then id (ties / legacy gaps). */
export function sortSessionsByPosition(sessions: SessionRow[]): SessionRow[] {
  return [...sessions].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.id.localeCompare(b.id);
  });
}

export function sessionOrderSignature(sessions: SessionRow[]): string {
  return sessions.map((s) => s.id).join("|");
}
