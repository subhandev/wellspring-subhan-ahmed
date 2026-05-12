"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { editProgramFormSchema, type EditProgramForm } from "@/lib/programs";
import { cn } from "@/lib/utils";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.id === "string" ? params.id : "";
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
    void (async () => {
      const res = await apiFetch(`/programs/${programId}`);
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        title?: string;
        description?: string | null;
      };
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setLoadError(readApiErrorMessage(data, "Not found"));
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
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Update failed"));
      return;
    }
    router.push("/programs?saved=1");
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
      <Link
        href="/programs"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Programs
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Edit Program</h1>
        <Link
          href={`/programs/${programId}/sessions`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Sessions
        </Link>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="edit-program-title">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="edit-program-title"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="edit-program-description">
            Description
          </label>
          <textarea
            id="edit-program-description"
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            {...form.register("description")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/programs" className={cn(buttonVariants({ variant: "outline" }))}>
            Cancel
          </Link>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                  aria-hidden
                />
                Saving…
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
