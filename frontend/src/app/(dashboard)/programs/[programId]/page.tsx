"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable()
});

type Form = z.infer<typeof schema>;

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.programId === "string" ? params.programId : "";
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!programId) {
      return;
    }
    let cancelled = false;
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
        return;
      }
      form.reset({
        title: data.title ?? "",
        description: data.description ?? ""
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [programId, form]);

  async function onSubmit(data: Form) {
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

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
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
