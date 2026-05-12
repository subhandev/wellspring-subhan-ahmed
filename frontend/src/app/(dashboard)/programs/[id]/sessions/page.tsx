"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SessionList } from "@/components/sessions/SessionList";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Program, SessionRow } from "@/types";

export default function SessionsPage() {
  const params = useParams();
  const programId = typeof params.id === "string" ? params.id : "";
  const [program, setProgram] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const [progRes, sessRes] = await Promise.all([
        apiFetch(`/programs/${programId}`),
        apiFetch(`/sessions?programId=${encodeURIComponent(programId)}`)
      ]);
      const progBody = await progRes.json().catch(() => ({}));
      const sessBody = await sessRes.json().catch(() => ({}));
      if (cancelled) {
        return;
      }
      if (!progRes.ok) {
        setError(readApiErrorMessage(progBody, "Failed to load program"));
        return;
      }
      if (!sessRes.ok) {
        setError(readApiErrorMessage(sessBody, "Failed to load sessions"));
        return;
      }
      const p = progBody as Program & { sessionCount?: number; createdAt?: string };
      setProgram({
        id: p.id,
        title: p.title,
        description: p.description ?? null,
        createdAt: typeof p.createdAt === "string" ? p.createdAt : "",
        sessionCount: typeof p.sessionCount === "number" ? p.sessionCount : 0
      });
      const s = sessBody as { sessions?: SessionRow[] };
      setSessions(s.sessions ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!sessions || !program) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading sessions…</p>
      </div>
    );
  }

  const count = sessions.length;

  return (
    <div className="space-y-4">
      <Link
        href="/programs"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Programs
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{program.title}</h1>
          <p className="text-sm text-muted-foreground">
            {count} session{count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/programs/${programId}/sessions/new`} className={cn(buttonVariants())}>
            New Session
          </Link>
          <Link
            href={`/programs/${programId}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit Program
          </Link>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Drag handles to reorder. Order saves automatically.
      </p>
      {sessions.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-6 py-10 text-center">
          <p className="text-muted-foreground">No sessions yet. Add your first session.</p>
          <Link href={`/programs/${programId}/sessions/new`} className={cn(buttonVariants(), "mt-4 inline-flex")}>
            New Session
          </Link>
        </div>
      ) : (
        <SessionList programId={programId} initialSessions={sessions} />
      )}
    </div>
  );
}
