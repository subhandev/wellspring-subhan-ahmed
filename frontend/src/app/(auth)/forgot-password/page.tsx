"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFieldError } from "@/components/auth/AuthFieldError";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage, readForgotPasswordResetToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({ email: z.string().email("Enter a valid email address.") });
type Form = z.infer<typeof schema>;

const GENERIC_DONE =
  "If this email is registered you'll receive reset instructions.";

const isDev = process.env.NODE_ENV === "development";

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setError(null);
    setDevResetToken(null);
    const res = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Request failed"));
      return;
    }
    setDone(true);
    if (isDev) {
      const t = readForgotPasswordResetToken(body);
      if (t) {
        setDevResetToken(t);
      }
    }
  }

  const devResetHref =
    devResetToken != null
      ? `/reset-password?token=${encodeURIComponent(devResetToken)}`
      : null;

  return (
    <RedirectIfAuthed>
      <section className="space-y-4" aria-labelledby="forgot-heading">
        <AuthPageHeader
          titleId="forgot-heading"
          title="Forgot password?"
          description="Enter your account email. We'll send reset instructions when email delivery is enabled."
        />
        {!done ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <AuthTextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <AuthFieldError message={errors.email?.message} />
            {error ? <AuthFieldError message={error} /> : null}
            <div className="pt-2">
              <Button
                type="submit"
                className="h-11 w-full rounded-lg text-[15px] font-medium tracking-tight disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{GENERIC_DONE}</p>
            {isDev && devResetHref ? (
              <div
                className="rounded-md border border-dashed border-amber-600/50 bg-amber-50 p-3 text-xs dark:bg-amber-950/30"
                data-testid="fp-dev-helper"
              >
                <p className="mb-2 font-medium text-amber-950 dark:text-amber-100">
                  Development only — reset token (do not ship to production users)
                </p>
                <p className="mb-2 break-all font-mono text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-100/90">
                  {devResetToken}
                </p>
                <Link
                  href={devResetHref}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full justify-center")}
                >
                  Open reset password
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </RedirectIfAuthed>
  );
}
