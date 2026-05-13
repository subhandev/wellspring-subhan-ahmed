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
    "block h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-[color,box-shadow,border-color] outline-none",
    "border-border placeholder:text-muted-foreground",
    "hover:border-muted-foreground/35 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25",
    invalid && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25 aria-invalid:border-destructive"
  );
}

export function dashTextareaCn(invalid?: boolean) {
  return cn(dashInputCn(invalid), "min-h-[5.5rem] resize-y py-3");
}

/** Chevron via data URLs (literals only — Tailwind must not see `${}` inside `url()`). */
export const dashSelectCn = cn(
  "block h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-10 text-sm outline-none transition-[color,box-shadow,border-color]",
  "bg-[length:1rem_1rem] bg-[position:right_0.65rem_center] bg-no-repeat",
  'bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")]',
  'dark:bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a1a1aa%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")]',
  "hover:border-muted-foreground/35 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
);

/** `type="date"`: reserve space for the calendar control; `block` avoids flex/WebKit glitches. */
export function dashDateInputCn(invalid?: boolean) {
  return cn(
    dashInputCn(invalid),
    "pr-10",
    "[color-scheme:light] dark:[color-scheme:dark]",
    "[&::-webkit-calendar-picker-indicator]:size-[1.125rem]",
    "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
    "[&::-webkit-calendar-picker-indicator]:opacity-100"
  );
}

export const dashInsetCard = "rounded-lg border border-border bg-muted/20 p-4 md:p-5";

/** Primary form footer: aligns with `dashSectionCard` + `dashFormSection` rhythm. */
export const dashFormActions =
  "flex flex-wrap items-center justify-end gap-2 border-t border-border pt-6 sm:gap-3";

/** Tight horizontal groups inside inset cards (upload, media). */
export const dashInsetButtonRow = "flex flex-wrap items-center gap-2";

/** Clickable list rows (programs home, session list): subtle hover vs. body. */
export const dashListRowSurface =
  "relative transition-colors hover:bg-muted/10 active:bg-muted/[0.12]";

/** Full-cell hit target for list rows (inside `dashListRowSurface`). */
export const dashListRowLinkLayer = "absolute inset-0 z-0 cursor-pointer rounded-none";

/** Row actions in program/session lists (Edit / Delete). */
export const dashListActions = "flex shrink-0 flex-wrap items-center justify-end gap-2";

export const dashPrimaryLink =
  "text-sm font-medium text-primary transition-opacity hover:opacity-80";
