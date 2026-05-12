import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";

const links = [
  { href: "/programs", label: "Programs" },
  { href: "/programs/new", label: "New program" },
  { href: "/import", label: "CSV import" },
  { href: "/audit", label: "Audit log" }
] as const;

export function DashboardNav() {
  return (
    <nav className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3">
      <span className="mr-4 font-semibold text-foreground">Wellspring</span>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {l.label}
        </Link>
      ))}
      <div className="ml-auto">
        <LogoutButton />
      </div>
    </nav>
  );
}
