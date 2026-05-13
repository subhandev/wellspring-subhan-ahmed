"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthFieldError } from "@/components/auth/AuthFieldError";
import { AuthPageHeader } from "@/components/auth/AuthPageHeader";
import { AuthTextField } from "@/components/auth/AuthTextField";
import { RedirectIfAuthed } from "@/components/auth/RedirectIfAuthed";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage, readAuthAccessToken, setAccessToken } from "@/lib/api";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string().min(8)
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords must match", path: ["confirm"] });

type Form = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setError(null);
    const res = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password }),
      auth: false
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Could not sign up"));
      return;
    }
    const token = readAuthAccessToken(body);
    if (token) {
      setAccessToken(token);
      router.push("/programs");
      router.refresh();
    } else {
      setError("Sign up succeeded but no token was returned");
    }
  }

  return (
    <RedirectIfAuthed>
      <section className="space-y-4" aria-labelledby="signup-heading">
        <AuthPageHeader
          titleId="signup-heading"
          title="Create your account"
          description="Join as a creator to manage your wellness content."
        />
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
          <AuthTextField
            id="password"
            label="Password (min 8 characters)"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <AuthFieldError message={errors.password?.message} />
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
              {isSubmitting ? "Creating…" : "Create account"}
            </Button>
          </div>
        </form>
      </section>
    </RedirectIfAuthed>
  );
}
