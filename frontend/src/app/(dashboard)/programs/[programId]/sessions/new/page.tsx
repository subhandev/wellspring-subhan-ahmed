"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  durationSeconds: z.coerce.number().int().positive(),
  instructorName: z.string().min(1),
  tags: z.string().optional(),
  position: z.coerce.number().int().min(0).optional()
});

type Form = z.infer<typeof schema>;

export default function NewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.programId === "string" ? params.programId : "";
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      durationSeconds: 600,
      instructorName: "",
      tags: ""
    }
  });

  async function onSubmit(data: Form) {
    setError(null);
    const tags =
      data.tags
        ?.split(/[|,]/)
        .map((t) => t.trim())
        .filter(Boolean) ?? [];
    const payload: Record<string, unknown> = {
      programId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      instructorName: data.instructorName,
      tags
    };
    if (data.position !== undefined && !Number.isNaN(data.position)) {
      payload.position = data.position;
    }
    const res = await apiFetch("/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      setError(body.message ?? "Could not create session");
      return;
    }
    if (body.id) {
      router.push(`/programs/${programId}/sessions/${body.id}/edit`);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">New session</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("title")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Duration (sec)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...form.register("durationSeconds", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Position (optional)</label>
            <input
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...form.register("position")}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Instructor</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("instructorName")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tags (comma or pipe)</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("tags")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Create
          </Button>
          <Link
            href={`/programs/${programId}/sessions`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
