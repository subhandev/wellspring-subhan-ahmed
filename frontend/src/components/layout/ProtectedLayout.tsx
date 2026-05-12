"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking session…
      </div>
    );
  }

  return <>{children}</>;
}
