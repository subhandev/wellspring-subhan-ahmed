import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cn } from "@/lib/utils";

const links = [
  { href: "/programs", label: "Programs" },
  { href: "/programs/new", label: "New program" },
  { href: "/import", label: "Import Sessions" },
  { href: "/audit", label: "Audit" }
] as const;

export function Navbar() {
  return (
    <nav className="flex flex-wrap items-center gap-2 border-b bg-card px-4 py-3">
      <Link
        href="/programs"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mr-2 cursor-default px-2 font-semibold no-underline hover:no-underline"
        )}
      >
        Wellspring
      </Link>
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
