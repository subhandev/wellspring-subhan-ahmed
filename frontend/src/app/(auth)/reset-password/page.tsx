"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFieldError } from "@/components/auth/AuthFieldError";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage, setAccessToken } from "@/lib/api";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string().min(8, "Use at least 8 characters.")
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "Passwords must match",
    path: ["confirm"]
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const RESET_FAIL_USER =
  "Reset token is invalid or expired. Please request a new one.";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = (searchParams.get("token") ?? "").trim();
  const [pastedToken, setPastedToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tokenFieldError, setTokenFieldError] = useState<string | null>(null);

  const resolvedToken = urlToken || pastedToken.trim();
  const showTokenPaste = !urlToken;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(data: PasswordForm) {
    setError(null);
    setTokenFieldError(null);
    if (!resolvedToken) {
      setTokenFieldError("Paste your reset token to continue.");
      return;
    }
    const res = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: resolvedToken, newPassword: data.newPassword }),
      auth: false
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = (body as { error?: { code?: string } }).error?.code;
      if (code === "invalid_reset_token" || res.status === 401) {
        setError(RESET_FAIL_USER);
      } else {
        setError(readApiErrorMessage(body, RESET_FAIL_USER));
      }
      return;
    }
    setAccessToken(null);
    router.push("/login?passwordReset=1");
    router.refresh();
  }

  return (
    <section className="space-y-4" aria-labelledby="reset-heading">
      <AuthPageHeader
        titleId="reset-heading"
        title="Reset password"
        description="Set a new password for your account. You will sign in on the next step."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {showTokenPaste ? (
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none" htmlFor="reset-token">
              Reset token
            </label>
            <textarea
              id="reset-token"
              rows={4}
              value={pastedToken}
              onChange={(e) => setPastedToken(e.target.value)}
              placeholder="Paste the token from your reset link or developer tools"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs leading-relaxed shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(tokenFieldError)}
            />
            <AuthFieldError message={tokenFieldError ?? undefined} />
          </div>
        ) : null}
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
        <div className="pt-2">
          <Button
            type="submit"
            className="h-11 w-full rounded-lg text-[15px] font-medium tracking-tight disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
