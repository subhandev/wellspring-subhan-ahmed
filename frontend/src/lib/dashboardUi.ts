import { cn } from "@/lib/utils";

/** Max width for form-heavy dashboard subpages (wider than old max-w-lg). */
export const DASH_PAGE_MAX = "max-w-2xl";

export const dashBackLink = cn(
  "inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
);

/** Page titles below the main Programs home hero. */
export const dashPageTitle = "text-[22px] font-semibold tracking-tight text-foreground";

export const dashPageDescription = "mt-1.5 text-sm text-muted-foreground";

export const dashSectionCard = "rounded-xl border border-border bg-card";

export const dashFormSection = "space-y-5 p-6 md:p-8";

export const dashLabel = "block text-sm font-medium text-foreground";

export function dashInputCn(invalid?: boolean) {
  return cn(
    "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-[color,box-shadow,border-color] outline-none",
    "border-border placeholder:text-muted-foreground",
    "hover:border-muted-foreground/35 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25",
    invalid && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25 aria-invalid:border-destructive"
  );
}

export function dashTextareaCn(invalid?: boolean) {
  return cn(dashInputCn(invalid), "min-h-[5.5rem] resize-y py-3");
}

export const dashSelectCn = cn(
  "flex h-10 w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow,border-color]",
  "hover:border-muted-foreground/35 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
);

export const dashInsetCard = "rounded-lg border border-border bg-muted/20 p-4 md:p-5";

export const dashPrimaryLink =
  "text-sm font-medium text-primary transition-opacity hover:opacity-80";
