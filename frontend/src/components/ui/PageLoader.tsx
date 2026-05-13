import { Loader2 } from "lucide-react";
import { dashSectionCard } from "@/lib/dashboardUi";
import { cn } from "@/lib/utils";

export type PageLoaderProps = {
  message: string;
  /** Full viewport — root redirect, session gate, public auth redirect. */
  fullScreen?: boolean;
  /** Dashboard-style bordered card (form pages while fetching). */
  inCard?: boolean;
  /** Two pulse bars under the message (edit/detail placeholders). */
  withFormSkeleton?: boolean;
  /** Tighter layout for Suspense fallbacks inside smaller regions. */
  compact?: boolean;
  className?: string;
};

/**
 * Shared loading UI for redirects, auth checks, Suspense fallbacks, and data fetches.
 * Uses live region semantics so screen readers announce the loading state.
 */
export function PageLoader({
  message,
  fullScreen = false,
  inCard = false,
  withFormSkeleton = false,
  compact = false,
  className
}: PageLoaderProps) {
  /** Thin circular frame — no tinted fill, keeps the focus on the icon. */
  const iconWrap = cn(
    "flex shrink-0 items-center justify-center rounded-full border border-border bg-background",
    compact ? "size-10" : "size-[3.25rem]"
  );
  const icon = cn("animate-spin text-primary", compact ? "size-[1.125rem]" : "size-5");

  const usePanel = inCard || withFormSkeleton;

  const body = (
    <div
      className={cn(
        "flex w-full flex-col items-center text-center",
        compact ? "gap-3" : "gap-4",
        usePanel && "px-6 pt-8",
        usePanel && withFormSkeleton && "pb-2"
      )}
    >
      <div className={iconWrap} aria-hidden>
        <Loader2 className={icon} />
      </div>
      <p
        className={cn(
          "text-pretty text-muted-foreground",
          compact ? "max-w-xs text-xs leading-snug" : "max-w-md text-sm leading-relaxed"
        )}
      >
        {message}
      </p>
    </div>
  );

  const skeleton = withFormSkeleton ? (
    <div className="space-y-3 border-t border-border/70 px-6 pb-8 pt-6" aria-hidden>
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted/80" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-muted/80" />
    </div>
  ) : null;

  const inner = usePanel ? (
    <div className={cn(dashSectionCard, "w-full overflow-hidden shadow-card")}>
      {body}
      {skeleton}
    </div>
  ) : (
    body
  );

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        fullScreen &&
          "flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/25 px-6 py-16",
        !fullScreen && "flex w-full flex-col justify-center",
        !fullScreen && !usePanel && "items-center",
        !fullScreen && usePanel && "items-stretch",
        !fullScreen &&
          !usePanel &&
          (compact ? "min-h-[100px] py-10" : "min-h-[calc(100dvh-6rem)]"),
        !fullScreen && usePanel && "min-h-[200px] py-10 md:min-h-[240px] md:py-12",
        className
      )}
    >
      {inner}
    </div>
  );
}
