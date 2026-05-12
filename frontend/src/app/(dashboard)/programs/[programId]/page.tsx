"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { editProgramFormSchema, type EditProgramForm } from "@/lib/programs";
import { cn } from "@/lib/utils";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.programId === "string" ? params.programId : "";
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const form = useForm<EditProgramForm>({
    resolver: zodResolver(editProgramFormSchema)
  });

  useEffect(() => {
    if (!programId) {
      setLoadError("Missing program id");
      setLoadState("error");
      return;
    }
    let cancelled = false;
    setLoadState("loading");
    setLoadError(null);
    (async () => {
      const res = await apiFetch(`/programs/${programId}`);
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        title?: string;
        description?: string | null;
        message?: string;
      };
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setLoadError(data.message ?? "Not found");
        setLoadState("error");
        return;
      }
      form.reset({
        title: data.title ?? "",
        description: data.description ?? ""
      });
      setLoadState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, form]);

  async function onSubmit(data: EditProgramForm) {
    setError(null);
    const res = await apiFetch(`/programs/${programId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        description: data.description === "" ? null : data.description
      })
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setError(body.message ?? "Update failed");
      return;
    }
    router.refresh();
  }

  async function onDelete() {
    if (!confirm("Delete this program and all sessions?")) {
      return;
    }
    const res = await apiFetch(`/programs/${programId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      alert(body.message ?? "Delete failed");
      return;
    }
    router.push("/programs");
  }

  if (loadState === "loading") {
    return (
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground">Loading program…</p>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (loadState === "error" || loadError) {
    return <p className="text-sm text-red-600">{loadError ?? "Failed to load program"}</p>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Edit program</h1>
        <Link
          href={`/programs/${programId}/sessions`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Sessions
        </Link>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            {...form.register("description")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
          <Link href="/programs" className={cn(buttonVariants({ variant: "outline" }))}>
            Back
          </Link>
        </div>
      </form>
    </div>
  );
}
