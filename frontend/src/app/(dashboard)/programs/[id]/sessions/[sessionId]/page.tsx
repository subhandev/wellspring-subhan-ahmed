"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import {
  DASH_PAGE_MAX,
  dashBackLink,
  dashPageDescription,
  dashPageTitle,
  dashPrimaryLink,
  dashSectionCard
} from "@/lib/dashboardUi";
import { formatSessionDuration } from "@/lib/formatDisplay";
import { cn } from "@/lib/utils";

type SessionDetail = {
  title?: string;
  durationSeconds?: number;
  instructorName?: string;
  tags?: string[];
  mediaUrl?: string | null;
  mediaType?: string | null;
};

export default function SessionDetailPage() {
  const params = useParams();
  const programId = typeof params.id === "string" ? params.id : "";
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing session id");
      setState("error");
      return;
    }
    let cancelled = false;
    setState("loading");
    setError(null);
    void (async () => {
      const res = await apiFetch(`/sessions/${sessionId}`);
      const body = await res.json().catch(() => ({}));
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setError(readApiErrorMessage(body, "Not found"));
        setState("error");
        return;
      }
      setSession(body as SessionDetail);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (state === "loading") {
    return (
      <div className={cn(DASH_PAGE_MAX, "space-y-6")}>
        <div className={cn(dashSectionCard, "p-8")}>
          <p className="text-sm text-muted-foreground">Loading session…</p>
          <div className="mt-4 space-y-3">
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (state === "error" || !session) {
    return <p className="text-sm text-destructive">{error ?? "Failed to load session"}</p>;
  }

  const tags = session.tags?.length ? session.tags.join(", ") : "—";
  const mediaUrl = session.mediaUrl?.trim();

  return (
    <div className={cn(DASH_PAGE_MAX, "space-y-8")}>
      <div>
        <Link href={`/programs/${programId}/sessions`} className={dashBackLink}>
          ← Back to sessions
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={dashPageTitle}>{session.title ?? "Session"}</h1>
            <p className={dashPageDescription}>Session details and media.</p>
          </div>
          <Link
            href={`/programs/${programId}/sessions/${sessionId}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "md" }), "shrink-0")}
          >
            Edit session
          </Link>
        </div>
      </div>

      <div className={dashSectionCard}>
        <dl className="divide-y divide-border px-6 py-2 text-sm">
          <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Instructor</dt>
            <dd className="font-medium text-foreground">{session.instructorName ?? "—"}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Duration</dt>
            <dd className="font-medium text-foreground">
              {typeof session.durationSeconds === "number"
                ? formatSessionDuration(session.durationSeconds)
                : "—"}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Tags</dt>
            <dd className="font-medium text-foreground">{tags}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Media</dt>
            <dd className="font-medium text-foreground">
              {mediaUrl ? (
                <>
                  <a href={mediaUrl} className={cn(dashPrimaryLink, "inline-flex flex-wrap items-center gap-1 break-all")} target="_blank" rel="noreferrer">
                    Open media
                    <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                  </a>
                  {session.mediaType ? (
                    <span className="mt-1 block text-xs text-muted-foreground">{session.mediaType}</span>
                  ) : null}
                  <span className="mt-2 block max-w-xl break-all text-xs text-muted-foreground">{mediaUrl}</span>
                </>
              ) : (
                "None"
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
