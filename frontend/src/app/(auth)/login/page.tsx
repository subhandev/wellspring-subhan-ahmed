"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { apiFetch, setAccessToken } from "@/lib/api";

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
    formState: { isSubmitting }
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setError(null);
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false
    });
    const body = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      message?: string;
    };
    if (!res.ok) {
      setError(body.message ?? "Login failed");
      return;
    }
    if (body.accessToken) {
      setAccessToken(body.accessToken);
      router.push("/programs");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...register("email")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...register("password")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Continue"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/signup" className="underline underline-offset-4">
          Create account
        </Link>
        {" · "}
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot password
        </Link>
      </p>
    </div>
  );
}
