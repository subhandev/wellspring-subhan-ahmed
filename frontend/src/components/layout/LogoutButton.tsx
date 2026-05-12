"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Still clear the client session if the request fails (offline, etc.).
    } finally {
      setAccessToken(null);
      setPending(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={logout}>
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
