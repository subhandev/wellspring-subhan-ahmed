"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { formatProgramCreatedAt } from "@/lib/formatDisplay";
import { cn } from "@/lib/utils";
import type { Program } from "@/types";

function ProgramsFallback() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">Loading programs…</p>
    </div>
  );
}

function ProgramsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      {banner ? (
        <div
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
          role="status"
        >
          {banner}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Programs</h1>
        <Link href="/programs/new" className={cn(buttonVariants())}>
          New Program
        </Link>
      </div>
      {programs.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-6 py-10 text-center">
          <p className="text-muted-foreground">No programs yet. Create your first program.</p>
          <Link href="/programs/new" className={cn(buttonVariants(), "mt-4 inline-flex")}>
            Create your first program
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {programs.map((p) => {
            const created = formatProgramCreatedAt(p.createdAt);
            const count = p.sessionCount;
            const countLabel = `${count} session${count === 1 ? "" : "s"}`;
            const sessionsHref = `/programs/${p.id}/sessions`;
            return (
              <li key={p.id} className="flex flex-wrap items-stretch gap-0">
                <Link
                  href={sessionsHref}
                  className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3 outline-offset-[-2px] hover:bg-muted/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {created ? `${created} · ` : null}
                    {countLabel}
                  </span>
                  {p.description ? (
                    <span className="text-sm text-muted-foreground line-clamp-2">{p.description}</span>
                  ) : null}
                </Link>
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-l bg-card px-4 py-3">
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
      {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
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
