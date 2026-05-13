"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEventHandler } from "react";
import { getAccessToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * App title link: `/programs` when a token exists, otherwise `/login`.
 * Matches product expectation that the brand is the entry point for the right surface.
 */
export function AppBrandLink({
  className,
  onClick
}: {
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const [href, setHref] = useState<"/programs" | "/login">("/login");

  useEffect(() => {
    setHref(getAccessToken() ? "/programs" : "/login");
  }, []);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "cursor-default text-[15px] font-semibold tracking-[0.18em] text-foreground uppercase no-underline hover:no-underline",
        className
      )}
    >
      Wellspring
    </Link>
  );
}
