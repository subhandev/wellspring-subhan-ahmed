"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { apiFetch, setAccessToken } from "@/lib/api";

const schema = z
  .object({
    newPassword: z.string().min(8),
    confirm: z.string().min(8)
  })
  .refine((d) => d.newPassword === d.confirm, { message: "Passwords must match", path: ["confirm"] });

type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";
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
    const body = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      message?: string;
    };
    if (!res.ok) {
      setError(body.message ?? "Reset failed");
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
      <h1 className="text-xl font-semibold">Reset password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...register("newPassword")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="confirm">
            Confirm
          </label>
          <input
            id="confirm"
            type="password"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...register("confirm")}
          />
          {errors.confirm ? (
            <p className="text-sm text-red-600">{errors.confirm.message}</p>
          ) : null}
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Update password
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4">
          Back to login
        </Link>
      </p>
    </div>
  );
}
