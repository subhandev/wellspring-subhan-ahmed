"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFieldError } from "@/components/auth/AuthFieldError";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage, readAuthAccessToken, setAccessToken } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type Form = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const showPasswordResetNotice = searchParams.get("passwordReset") === "1";
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setError(null);
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Login failed"));
      return;
    }
    const token = readAuthAccessToken(body);
    if (token) {
      setAccessToken(token);
      router.push("/programs");
      router.refresh();
    } else {
      setError("Login succeeded but no token was returned");
    }
  }

  return (
    <section className="space-y-4" aria-labelledby="login-heading">
      <AuthPageHeader
        titleId="login-heading"
        title="Sign in"
        description="Use your creator account. You will land on Programs after a successful sign-in."
      />
      {showPasswordResetNotice ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-50"
        >
          <p>Password reset successfully. Please login.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start border-emerald-300 bg-transparent dark:border-emerald-800"
            onClick={() => router.replace("/login")}
          >
            Dismiss
          </Button>
        </div>
      ) : null}
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
        <AuthTextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <AuthFieldError message={errors.password?.message} />
        {error ? <AuthFieldError message={error} /> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Continue"}
        </Button>
      </form>
      <nav aria-label="Other sign-in options" className="text-center text-sm text-muted-foreground">
        <Link href="/signup" className="underline underline-offset-4">
          Create account
        </Link>
        <span aria-hidden> · </span>
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot password?
        </Link>
      </nav>
    </section>
  );
}

export default function LoginPage() {
  return (
    <RedirectIfAuthed>
      <Suspense
        fallback={
          <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </RedirectIfAuthed>
  );
}
