"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppBrandLink } from "@/components/auth/AppBrandLink";

function FooterForPath(pathname: string) {
  if (pathname === "/login" || pathname === "/login/") {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New creator?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Create your account →
        </Link>
      </p>
    );
  }
  if (pathname === "/signup" || pathname === "/signup/") {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Sign in →
        </Link>
      </p>
    );
  }
  if (pathname === "/forgot-password" || pathname === "/forgot-password/") {
    return (
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-foreground transition-colors hover:text-primary"
        >
          Back to sign in →
        </Link>
      </p>
    );
  }
  if (pathname === "/reset-password" || pathname === "/reset-password/") {
    return (
      <nav
        aria-label="Account recovery"
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        <Link
          href="/forgot-password"
          className="transition-colors hover:text-foreground hover:underline"
        >
          Request a new reset link
        </Link>
        <span className="mx-2 text-border" aria-hidden>
          ·
        </span>
        <Link href="/login" className="transition-colors hover:text-foreground hover:underline">
          Back to sign in
        </Link>
      </nav>
    );
  }
  return null;
}

export function AuthChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const footer = FooterForPath(pathname);

  return (
    <div className="auth-shell">
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
        <AppBrandLink className="mb-8 text-[15px] font-semibold tracking-[0.18em] uppercase" />
        <div
          className="w-full max-w-[420px] rounded-xl border border-border bg-card p-8 sm:p-10"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          {children}
        </div>
        {footer}
        <p className="mt-10 text-center text-xs text-muted-foreground">© 2026 Wellspring</p>
      </main>
    </div>
  );
}
