"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Program } from "@/lib/programs";
import { cn } from "@/lib/utils";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await apiFetch("/programs");
      const data = (await res.json().catch(() => ({}))) as {
        programs?: Program[];
        message?: string;
      };
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setError(data.message ?? "Failed to load programs");
        return;
      }
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
    return <p className="text-muted-foreground">Loading…</p>;
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
        <p className="text-muted-foreground">No programs yet.</p>
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
                  href={`/programs/${p.id}`}
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
