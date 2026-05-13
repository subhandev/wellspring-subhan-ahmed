"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import {
  DASH_PAGE_MAX,
  dashBackLink,
  dashFormSection,
  dashInputCn,
  dashLabel,
  dashPageDescription,
  dashPageTitle,
  dashSectionCard,
  dashTextareaCn
} from "@/lib/dashboardUi";
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
      <div className={cn(DASH_PAGE_MAX, "space-y-6")}>
        <div className={cn(dashSectionCard, "p-8")}>
          <p className="text-sm text-muted-foreground">Loading program…</p>
          <div className="mt-4 space-y-3">
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (loadState === "error" || loadError) {
    return <p className="text-sm text-destructive">{loadError ?? "Failed to load program"}</p>;
  }

  return (
    <div className={cn(DASH_PAGE_MAX, "space-y-8")}>
      <div>
        <Link href="/programs" className={dashBackLink}>
          ← Back to programs
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className={dashPageTitle}>Edit program</h1>
            <p className={dashPageDescription}>Update the title and description shown across the admin.</p>
          </div>
          <Link
            href={`/programs/${programId}/sessions`}
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}
          >
            Sessions
          </Link>
        </div>
      </div>

      <div className={dashSectionCard}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={dashFormSection}>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="edit-program-title">
              Title <span className="text-destructive">*</span>
            </label>
            <input id="edit-program-title" className={dashInputCn()} {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="edit-program-description">
              Description
            </label>
            <textarea
              id="edit-program-description"
              rows={4}
              className={dashTextareaCn()}
              {...form.register("description")}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
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
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
