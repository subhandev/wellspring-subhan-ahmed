"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/PageLoader";
import { useAuth } from "@/hooks/useAuth";

/** Wrap dashboard routes: require stored access token, else redirect to login. */
export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isChecking, isUnauthenticated } = useAuth();

  useEffect(() => {
    if (!isChecking && isUnauthenticated) {
      router.replace("/login");
    }
  }, [isChecking, isUnauthenticated, router]);

  if (isChecking || isUnauthenticated) {
    return <PageLoader fullScreen message="Checking your session…" />;
  }

  return <>{children}</>;
}
