"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <div className={cn(DASH_PAGE_MAX, "space-y-8")}>
      <div>
        <Link href="/programs" className={dashBackLink}>
          ← Back to programs
        </Link>
        <h1 className={cn(dashPageTitle, "mt-6")}>New program</h1>
        <p className={dashPageDescription}>Create a program to organize sessions for your audience.</p>
      </div>

      <div className={dashSectionCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={dashFormSection}>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="program-title">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="program-title"
              className={dashInputCn(Boolean(errors.title))}
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            {errors.title?.message ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="program-description">
              Description
            </label>
            <textarea
              id="program-description"
              rows={4}
              className={dashTextareaCn(Boolean(errors.description))}
              aria-invalid={Boolean(errors.description)}
              {...register("description")}
            />
            {errors.description?.message ? (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-6">
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
                "Create program"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
