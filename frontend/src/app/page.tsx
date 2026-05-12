import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-10">
      <h1 className="text-3xl font-semibold">Wellspring Admin</h1>
      <p className="text-muted-foreground">Scaffold home — choose a section to explore.</p>
      <div className="flex flex-col gap-3">
        <Link href="/login" className={cn(buttonVariants())}>
          Login
        </Link>
        <Link href="/programs" className={cn(buttonVariants({ variant: "secondary" }))}>
          Programs (dashboard)
        </Link>
      </div>
    </div>
  );
}
