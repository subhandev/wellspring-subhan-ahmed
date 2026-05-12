"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAccessToken } from "@/lib/auth";

/**
 * `/` — token in storage → `/programs`, otherwise `/login`.
 */
export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const target = getAccessToken() ? "/programs" : "/login";
    router.replace(target);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6 text-sm text-muted-foreground">
      Redirecting…
    </div>
  );
}
