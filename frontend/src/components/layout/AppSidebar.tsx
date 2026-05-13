"use client";

import { LayoutGrid, LogOut, ScrollText, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AppBrandLink } from "@/components/auth/AppBrandLink";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function displayNameFromEmail(email: string | null): string {
  if (!email) {
    return "—";
  }
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) {
    return email;
  }
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function initialsFromEmail(email: string | null): string {
  if (!email) {
    return "…";
  }
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  const compact = local.replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 2) {
    return compact.slice(0, 2).toUpperCase();
  }
  return (local.slice(0, 2) || "?").toUpperCase();
}

const nav = [
  { href: "/programs", label: "Programs", icon: LayoutGrid },
  { href: "/import", label: "Import Sessions", icon: Upload },
  { href: "/audit", label: "Audit Log", icon: ScrollText }
] as const;

function SidebarLogout() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Still clear the client session if the request fails (offline, etc.).
    } finally {
      setAccessToken(null);
      setPending(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void logout()}
      className={cn(
        buttonVariants({ variant: "ghost", size: "default" }),
        "h-auto min-h-9 w-full justify-start gap-3 rounded-md px-3 py-2 text-left text-foreground/75 hover:text-foreground disabled:opacity-60"
      )}
    >
      <LogOut className="size-4 shrink-0" aria-hidden />
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}

export function AppSidebar({ email }: { email: string | null }) {
  const pathname = usePathname();

  function isActive(href: (typeof nav)[number]["href"]): boolean {
    if (href === "/programs") {
      return pathname === "/programs" || pathname.startsWith("/programs/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-border bg-card">
      <div className="px-5 pb-5 pt-6">
        <AppBrandLink className="block text-[14px] font-semibold tracking-[0.18em] text-foreground uppercase" />
      </div>

      <div className="flex items-center gap-3 border-b border-border px-5 pb-5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[12px] font-medium text-accent-foreground"
          aria-hidden
        >
          {initialsFromEmail(email)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{displayNameFromEmail(email)}</div>
          <div className="text-xs text-muted-foreground">Creator</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4" aria-label="Main">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                active
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-border px-3 py-4">
        <SidebarLogout />
      </div>
    </aside>
  );
}
