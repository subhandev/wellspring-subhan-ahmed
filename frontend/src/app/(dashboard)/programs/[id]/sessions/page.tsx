"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SessionList } from "@/components/sessions/SessionList";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashBackLink, dashPageDescription, dashPageTitle, dashSectionCard } from "@/lib/dashboardUi";
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
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!sessions || !program) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading sessions…</p>
      </div>
    );
  }

  const count = sessions.length;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/programs" className={dashBackLink}>
          ← Back to programs
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className={dashPageTitle}>{program.title}</h1>
            <p className={dashPageDescription}>
              {count} session{count === 1 ? "" : "s"}
            </p>
            {program.description ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-3">
                {program.description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:gap-2.5">
            <Link href={`/programs/${programId}/sessions/new`} className={cn(buttonVariants({ size: "default" }))}>
              New session
            </Link>
            <Link
              href={`/programs/${programId}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Edit program
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
        Drag handles to reorder · order saves automatically
      </p>

      {sessions.length === 0 ? (
        <div
          className={cn(
            dashSectionCard,
            "border-dashed bg-muted/15 px-8 py-14 text-center text-muted-foreground"
          )}
        >
          <p>No sessions yet. Add your first session.</p>
          <Link href={`/programs/${programId}/sessions/new`} className={cn(buttonVariants({ size: "md" }), "mt-5 inline-flex")}>
            New session
          </Link>
        </div>
      ) : (
        <SessionList
          programId={programId}
          initialSessions={sessions}
          onSessionsChanged={setSessions}
        />
      )}
    </div>
  );
}
