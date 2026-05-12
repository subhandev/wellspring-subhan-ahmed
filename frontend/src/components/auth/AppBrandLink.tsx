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
        "cursor-default text-lg font-semibold tracking-tight text-foreground no-underline hover:no-underline",
        className
      )}
    >
      Wellspring Admin
    </Link>
  );
}
