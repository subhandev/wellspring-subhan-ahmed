"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SortableSessionList, type SessionRow } from "@/components/sessions/SortableSessionList";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SessionsPage() {
  const params = useParams();
  const programId = typeof params.programId === "string" ? params.programId : "";
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const res = await apiFetch(`/sessions?programId=${encodeURIComponent(programId)}`);
      const data = (await res.json().catch(() => ({}))) as {
        sessions?: SessionRow[];
        message?: string;
      };
      if (!res.ok) {
        if (!cancelled) {
          setError(data.message ?? "Failed to load sessions");
        }
        return;
      }
      if (!cancelled) {
        setSessions(data.sessions ?? []);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!sessions) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <div className="flex gap-2">
          <Link href={`/programs/${programId}/sessions/new`} className={cn(buttonVariants())}>
            New session
          </Link>
          <Link
            href={`/programs/${programId}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Program
          </Link>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Drag handles to reorder. Order saves automatically.
      </p>
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">No sessions yet.</p>
      ) : (
        <SortableSessionList programId={programId} initialSessions={sessions} />
      )}
    </div>
  );
}
