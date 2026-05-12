"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SessionList } from "@/components/sessions/SessionList";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SessionRow } from "@/types";

export default function SessionsPage() {
  const params = useParams();
  const programId = typeof params.id === "string" ? params.id : "";
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const res = await apiFetch(`/sessions?programId=${encodeURIComponent(programId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (!cancelled) {
          setError(readApiErrorMessage(body, "Failed to load sessions"));
        }
        return;
      }
      if (!cancelled) {
        const data = body as { sessions?: SessionRow[] };
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
            href={`/programs/${programId}/edit`}
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
        <SessionList programId={programId} initialSessions={sessions} />
      )}
    </div>
  );
}
