import { PageLoader } from "@/components/ui/PageLoader";

/** Shown when moving between auth routes until the segment is ready. */
export default function AuthRouteLoading() {
  return <PageLoader compact className="min-h-[160px]" message="Loading…" />;
}
