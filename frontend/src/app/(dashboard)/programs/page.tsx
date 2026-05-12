"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import type { Program } from "@/types";
import { cn } from "@/lib/utils";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
      setPrograms(data.programs ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!programs) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        </div>
        <ul className="divide-y rounded-md border">
          {[0, 1, 2].map((i) => (
            <li key={i} className="px-4 py-3">
              <div className="h-5 w-1/2 max-w-xs animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-2/3 max-w-sm animate-pulse rounded bg-muted/70" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Programs</h1>
        <Link href="/programs/new" className={cn(buttonVariants())}>
          New program
        </Link>
      </div>
      {programs.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-6 py-10 text-center">
          <p className="text-muted-foreground">No programs yet. Create one to add sessions and media.</p>
          <Link href="/programs/new" className={cn(buttonVariants(), "mt-4 inline-flex")}>
            Create your first program
          </Link>
        </div>
      ) : (
        <ul className="divide-y rounded-md border">
          {programs.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-medium">{p.title}</p>
                {p.description ? (
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/programs/${p.id}/edit`}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  Edit
                </Link>
                <Link
                  href={`/programs/${p.id}/sessions`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Sessions
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
