"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
    return (
      <div className="flex min-h-[140px] items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
