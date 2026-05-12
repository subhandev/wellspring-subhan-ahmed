"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * App title link: `/programs` when a token exists, otherwise `/login`.
 * Matches product expectation that the brand is the entry point for the right surface.
 */
export function AppBrandLink({ className }: { className?: string }) {
  const [href, setHref] = useState<"/programs" | "/login">("/login");

  useEffect(() => {
    setHref(getAccessToken() ? "/programs" : "/login");
  }, []);

  return (
    <Link
      href={href}
      className={cn(
        "text-lg font-semibold tracking-tight text-foreground underline-offset-4 hover:underline",
        className
      )}
    >
      Wellspring Admin
    </Link>
  );
}
