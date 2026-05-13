"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppBrandLink } from "@/components/auth/AppBrandLink";
import { apiFetch } from "@/lib/api";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CreatorProvider } from "@/components/layout/creatorContext";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await apiFetch("/auth/me");
      const body = await res.json().catch(() => ({}));
      if (cancelled || !res.ok) {
        return;
      }
      const data = body as { data?: { email?: string } };
      const em = typeof data.data?.email === "string" ? data.data.email : null;
      if (!cancelled) {
        setEmail(em);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CreatorProvider email={email}>
      <div className="flex min-h-screen bg-background text-foreground">
        <AppSidebar email={email} mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "shrink-0")}
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-nav"
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? (
                <X className="size-5" aria-hidden />
              ) : (
                <Menu className="size-5" aria-hidden />
              )}
              <span className="sr-only">{mobileNavOpen ? "Close menu" : "Open menu"}</span>
            </button>
            <AppBrandLink className="min-w-0 truncate text-[13px] font-semibold tracking-[0.16em] text-foreground uppercase" />
          </header>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </div>
    </CreatorProvider>
  );
}
