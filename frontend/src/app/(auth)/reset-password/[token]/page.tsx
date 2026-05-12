"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFieldError } from "@/components/auth/AuthFieldError";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage, readAuthAccessToken, setAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    newPassword: z.string().min(8),
    confirm: z.string().min(8)
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords must match",
    path: ["confirm"]
  });

type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token.trim() : "";
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setError(null);
    const res = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword: data.newPassword }),
      auth: false
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Reset failed"));
      return;
    }
    const tokenOut = readAuthAccessToken(body);
    if (tokenOut) {
      setAccessToken(tokenOut);
      router.push("/programs");
      router.refresh();
    } else {
      setError("Password updated but no token was returned");
    }
  }

  if (!token) {
    return (
      <section className="space-y-4" aria-labelledby="reset-invalid-heading">
        <AuthPageHeader
          titleId="reset-invalid-heading"
          title="Invalid reset link"
          description="This URL is missing a reset token. Request a new link from the forgot password page."
        />
        <nav aria-label="Account access">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "secondary" }), "inline-flex w-full justify-center")}
          >
            Request a new link
          </Link>
        </nav>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="reset-heading">
      <AuthPageHeader
        titleId="reset-heading"
        title="Set a new password"
        description="Choose a new password for your account. You will be signed in on Programs afterward."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <AuthTextField
          id="newPassword"
          label="New password (min 8 characters)"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.newPassword)}
          {...register("newPassword")}
        />
        <AuthFieldError message={errors.newPassword?.message} />
        <AuthTextField
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirm)}
          {...register("confirm")}
        />
        <AuthFieldError message={errors.confirm?.message} />
        {error ? <AuthFieldError message={error} /> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password and sign in"}
        </Button>
      </form>
      <nav aria-label="Account access" className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4">
          Back to sign in
        </Link>
      </nav>
    </section>
  );
}
