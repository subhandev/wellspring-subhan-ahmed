"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { getAccessToken } from "@/lib/auth";

/**
 * For public auth routes: if a JWT is already in storage, send the user to the dashboard.
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/programs");
      return;
    }
    setAllow(true);
  }, [router]);

  if (!allow) {
    return <PageLoader compact className="min-h-[140px]" message="Checking your session…" />;
  }

  return <>{children}</>;
}
