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
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";

const schema = z.object({ email: z.string().email() });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setError(null);
    const res = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(readApiErrorMessage(body, "Request failed"));
      return;
    }
    setDone(true);
  }

  return (
    <RedirectIfAuthed>
      <section className="space-y-4" aria-labelledby="forgot-heading">
        <AuthPageHeader
          titleId="forgot-heading"
          title="Forgot password"
          description="We will email reset steps when outbound mail is configured. In development, use the reset token from API logs."
        />
        {done ? (
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, you can continue with the reset link. In development,
            check API logs for the reset token and open the reset URL from your app.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <nav aria-label="Account access" className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </nav>
      </section>
    </RedirectIfAuthed>
  );
}
