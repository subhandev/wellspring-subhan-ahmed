"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import {
  DASH_PAGE_MAX,
  dashBackLink,
  dashPageDescription,
  dashPageTitle,
  dashPrimaryLink,
  dashSectionCard
} from "@/lib/dashboardUi";
import { formatAuditLogTime, formatSessionDuration } from "@/lib/formatDisplay";
import { cn } from "@/lib/utils";

/** Mirrors `GET /sessions/:id` (Prisma Session JSON). */
type SessionDetail = {
  programId?: string;
  title?: string;
  durationSeconds?: number;
  position?: number;
  instructorName?: string;
  tags?: string[];
  mediaUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.id === "string" ? params.id : "";
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function onConfirmDelete() {
    setDeleteError(null);
    const res = await apiFetch(`/sessions/${sessionId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(readApiErrorMessage(body, "Delete failed"));
      throw new Error("delete failed");
    }
    router.push(`/programs/${programId}/sessions`);
  }

  if (state === "loading") {
    return <PageLoader message="Loading session…" />;
  }

  if (state === "error" || !session) {
    return <p className="text-sm text-destructive">{error ?? "Failed to load session"}</p>;
  }

  const tags = session.tags?.length ? session.tags.join(", ") : "—";
  const mediaUrl = session.mediaUrl?.trim();
  const resolvedProgramId = session.programId ?? programId;
  const durationLabel =
    typeof session.durationSeconds === "number"
      ? formatSessionDuration(session.durationSeconds)
      : "—";
  const listOrder =
    typeof session.position === "number" && Number.isFinite(session.position)
      ? `${session.position + 1} in program list`
      : "—";

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
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/programs/${programId}/sessions/${sessionId}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "md" }))}
            >
              Edit session
            </Link>
            <Button type="button" variant="destructive" size="md" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className={dashSectionCard}>
        <dl className="divide-y divide-border px-6 py-2 text-sm">
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Title</dt>
            <dd className="font-medium text-foreground">{session.title?.trim() || "—"}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Instructor</dt>
            <dd className="font-medium text-foreground">{session.instructorName ?? "—"}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Duration</dt>
            <dd className="font-medium text-foreground">{durationLabel}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Tags</dt>
            <dd className="font-medium text-foreground">{tags}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Media</dt>
            <dd className="font-medium text-foreground">
              {mediaUrl ? (
                <a
                  href={mediaUrl}
                  className={cn(dashPrimaryLink, "inline-flex items-center gap-1")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open media
                  <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Program</dt>
            <dd className="font-medium text-foreground">
              {resolvedProgramId ? (
                <Link href={`/programs/${resolvedProgramId}`} className={dashPrimaryLink}>
                  View program
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">List order</dt>
            <dd className="font-medium text-foreground">{listOrder}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Created</dt>
            <dd className="font-medium text-foreground">
              {session.createdAt ? formatAuditLogTime(session.createdAt) : "—"}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
            <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Last updated</dt>
            <dd className="font-medium text-foreground">
              {session.updatedAt ? formatAuditLogTime(session.updatedAt) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleteError(null);
          }
        }}
        title="Delete session?"
        description={
          session.title
            ? `This will permanently delete “${session.title}”.`
            : "This will permanently delete this session."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={onConfirmDelete}
      />
      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
    </div>
  );
}
