"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { newProgramFormSchema, type NewProgramForm } from "@/lib/programs";
import { cn } from "@/lib/utils";

export default function NewProgramPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<NewProgramForm>({
    resolver: zodResolver(newProgramFormSchema),
    defaultValues: { title: "", description: "" }
  });

  async function onSubmit(data: NewProgramForm) {
    setError(null);
    const res = await apiFetch("/programs", {
      method: "POST",
      body: JSON.stringify(data)
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      setError(body.message ?? "Could not create program");
      return;
    }
    if (body.id) {
      router.push(`/programs/${body.id}/edit`);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">New program</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...register("title")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            {...register("description")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Create"}
          </Button>
          <Link href="/programs" className={cn(buttonVariants({ variant: "outline" }))}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
