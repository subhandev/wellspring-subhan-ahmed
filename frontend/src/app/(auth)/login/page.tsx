"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFieldError } from "@/components/auth/AuthFieldError";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { Button } from "@/components/ui/button";
import { apiFetch, readApiErrorMessage, readAuthAccessToken, setAccessToken } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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
    <RedirectIfAuthed>
      <section className="space-y-4" aria-labelledby="login-heading">
        <AuthPageHeader
          titleId="login-heading"
          title="Sign in"
          description="Use your creator account. You will land on Programs after a successful sign-in."
        />
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
            Forgot password
          </Link>
        </nav>
      </section>
    </RedirectIfAuthed>
  );
}
