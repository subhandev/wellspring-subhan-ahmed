"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CreatorProvider } from "@/components/layout/creatorContext";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await apiFetch("/auth/me");
      const body = await res.json().catch(() => ({}));
      if (cancelled || !res.ok) {
        return;
      }
      const data = body as { data?: { email?: string } };
      const em = typeof data.data?.email === "string" ? data.data.email : null;
      if (!cancelled) {
        setEmail(em);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CreatorProvider email={email}>
      <div className="flex min-h-screen bg-background text-foreground">
        <AppSidebar email={email} />
        <div className="min-w-0 flex-1 overflow-auto">{children}</div>
      </div>
    </CreatorProvider>
  );
}
