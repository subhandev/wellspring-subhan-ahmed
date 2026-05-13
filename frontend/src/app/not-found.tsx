import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Error 404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This path does not exist in Wellspring, or you followed a broken link. Check the URL or return to your
          programs.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/programs" className={cn(buttonVariants({ size: "md" }))}>
            Programs
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "md" }))}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
