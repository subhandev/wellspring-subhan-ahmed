"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
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

  return <PageLoader fullScreen message="Taking you to the right place…" />;
}
