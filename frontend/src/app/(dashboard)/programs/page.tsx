"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useCreatorEmail } from "@/components/layout/creatorContext";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageLoader } from "@/components/ui/PageLoader";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { formatRelativeShort } from "@/lib/formatDisplay";
import { dashListActions, dashListRowLinkLayer, dashListRowSurface } from "@/lib/dashboardUi";
import { cn } from "@/lib/utils";
import type { Program } from "@/types";

function greetingNameFromEmail(email: string | null): string {
  if (!email) {
    return "";
  }
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[._-]/).filter(Boolean)[0] ?? local;
  if (!first) {
    return "";
  }
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function ProgramsFallback() {
  return <PageLoader message="Loading your programs…" />;
}

function ProgramsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const creatorEmail = useCreatorEmail();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const greeting = greetingNameFromEmail(creatorEmail);

  const stats = useMemo(() => {
    if (!programs?.length) {
      return {
        totalPrograms: 0,
        totalSessions: 0,
        lastActivity: null as string | null
      };
    }
    const totalSessions = programs.reduce((sum, p) => sum + (p.sessionCount ?? 0), 0);
    const latest = programs.reduce((best, p) => {
      const t = new Date(p.createdAt).getTime();
      if (Number.isNaN(t)) {
        return best;
      }
      if (!best || t > new Date(best).getTime()) {
        return p.createdAt;
      }
      return best;
    }, null as string | null);
    return {
      totalPrograms: programs.length,
      totalSessions,
      lastActivity: latest
    };
  }, [programs]);

  useEffect(() => {
    const created = searchParams.get("created");
    const saved = searchParams.get("saved");
    if (created) {
      setBanner("Program created.");
    } else if (saved) {
      setBanner("Changes saved.");
    }
    if (created || saved) {
      router.replace("/programs", { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const t = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await apiFetch("/programs");
      const body = await res.json().catch(() => ({}));
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setError(readApiErrorMessage(body, "Failed to load programs"));
        return;
      }
      const data = body as { programs?: Program[] };
      const rows = (data.programs ?? []).map((p) => ({
        ...p,
        sessionCount: typeof p.sessionCount === "number" ? p.sessionCount : 0,
        createdAt: p.createdAt ?? ""
      }));
      setPrograms(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onConfirmDeleteProgram() {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    const res = await apiFetch(`/programs/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(readApiErrorMessage(body, "Delete failed"));
      throw new Error("delete failed");
    }
    setPrograms((prev) => (prev ? prev.filter((p) => p.id !== deleteTarget.id) : prev));
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!programs) {
    return <ProgramsFallback />;
  }

  const lastActivityLabel =
    stats.lastActivity != null ? formatRelativeShort(stats.lastActivity) : "—";

  return (
    <div>
      {banner ? (
        <div
          className="mb-8 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
          role="status"
        >
          {banner}
        </div>
      ) : null}

      <header className="mb-10">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          Welcome back{greeting ? `, ${greeting}` : ""}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your programs today.
        </p>
      </header>

      <section aria-label="Summary" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-5 py-5">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Programs</div>
          <div className="mt-2 text-[26px] font-semibold tracking-tight text-foreground tabular-nums">
            {stats.totalPrograms}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-5">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Sessions</div>
          <div className="mt-2 text-[26px] font-semibold tracking-tight text-foreground tabular-nums">
            {stats.totalSessions}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-5">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Last activity</div>
          <div className="mt-2 text-[26px] font-semibold tracking-tight text-foreground">
            {lastActivityLabel}
          </div>
        </div>
      </section>

      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-muted-foreground">No programs yet. Create your first program.</p>
          <Link href="/programs/new" className={cn(buttonVariants({ size: "md" }), "mt-4 inline-flex")}>
            Create your first program
          </Link>
        </div>
      ) : (
        <section
          className="overflow-hidden rounded-xl border border-border bg-card"
          aria-labelledby="your-programs-heading"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <h2 id="your-programs-heading" className="text-[15px] font-semibold tracking-tight text-foreground">
              Your Programs
            </h2>
            <Link href="/programs/new" className={cn(buttonVariants({ size: "default" }))}>
              New program
            </Link>
          </div>
          <ul>
            {programs.map((p, index) => {
              const count = p.sessionCount;
              const countLabel = `${count} session${count === 1 ? "" : "s"}`;
              const sessionsHref = `/programs/${p.id}/sessions`;
              return (
                <li
                  key={p.id}
                  className={cn(
                    dashListRowSurface,
                    "flex flex-wrap items-center justify-between gap-3 px-6 py-4",
                    index > 0 && "border-t border-border"
                  )}
                >
                  <Link
                    href={sessionsHref}
                    className={dashListRowLinkLayer}
                    aria-label={`Open sessions for ${p.title}`}
                  />
                  <div className="pointer-events-none relative z-[1] min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{p.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{countLabel}</div>
                    {p.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                    ) : null}
                  </div>
                  <div className={cn(dashListActions, "relative z-[1] pointer-events-auto")}>
                    <Link
                      href={`/programs/${p.id}/edit`}
                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
                      onClick={() => setDeleteTarget(p)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title="Delete program?"
        description={
          deleteTarget
            ? `This will permanently delete “${deleteTarget.title}” and all its sessions.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={onConfirmDeleteProgram}
      />
      {deleteError ? <p className="mt-4 text-sm text-red-600">{deleteError}</p> : null}
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <Suspense fallback={<ProgramsFallback />}>
      <ProgramsInner />
    </Suspense>
  );
}
