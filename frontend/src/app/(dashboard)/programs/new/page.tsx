"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { newProgramFormSchema, type NewProgramForm } from "@/lib/programs";
import { cn } from "@/lib/utils";

export default function NewProgramPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
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
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Could not create program"));
      return;
    }
    router.push("/programs?created=1");
  }

  return (
    <div className="max-w-lg space-y-4">
      <Link
        href="/programs"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Programs
      </Link>
      <h1 className="text-2xl font-semibold">Create Program</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="program-title">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="program-title"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm aria-invalid:border-destructive"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title?.message ? (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="program-description">
            Description
          </label>
          <textarea
            id="program-description"
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm aria-invalid:border-destructive"
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          {errors.description?.message ? (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/programs" className={cn(buttonVariants({ variant: "outline" }))}>
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
                  aria-hidden
                />
                Creating…
              </span>
            ) : (
              "Create Program"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
