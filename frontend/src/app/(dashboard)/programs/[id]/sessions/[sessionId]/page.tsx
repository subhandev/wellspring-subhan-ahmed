"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
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
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground">Loading session…</p>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (state === "error" || !session) {
    return <p className="text-sm text-red-600">{error ?? "Failed to load session"}</p>;
  }

  const tags = session.tags?.length ? session.tags.join(", ") : "—";
  const mediaUrl = session.mediaUrl?.trim();

  return (
    <div className="max-w-lg space-y-4">
      <Link
        href={`/programs/${programId}/sessions`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Sessions
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold">{session.title ?? "Session"}</h1>
        <Link
          href={`/programs/${programId}/sessions/${sessionId}/edit`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Edit
        </Link>
      </div>
      <dl className="space-y-3 rounded-md border bg-card px-4 py-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Instructor</dt>
          <dd className="font-medium">{session.instructorName ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="font-medium">
            {typeof session.durationSeconds === "number"
              ? formatSessionDuration(session.durationSeconds)
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tags</dt>
          <dd className="font-medium">{tags}</dd>
        </div>
        {mediaUrl ? (
          <div>
            <dt className="text-muted-foreground">Media</dt>
            <dd className="break-all font-medium">
              <a href={mediaUrl} className="text-primary underline underline-offset-4" target="_blank" rel="noreferrer">
                {mediaUrl}
              </a>
              {session.mediaType ? (
                <span className="mt-1 block text-xs text-muted-foreground">{session.mediaType}</span>
              ) : null}
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-muted-foreground">Media</dt>
            <dd className="font-medium">None</dd>
          </div>
        )}
      </dl>
      <Link href={`/programs/${programId}/sessions`} className={cn(buttonVariants({ variant: "outline" }))}>
        Back to list
      </Link>
    </div>
  );
}
