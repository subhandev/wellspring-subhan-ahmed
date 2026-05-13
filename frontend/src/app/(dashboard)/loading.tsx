import { PageLoader } from "@/components/ui/PageLoader";

/** Shown during client navigations within the dashboard until the page segment resolves. */
export default function DashboardRouteLoading() {
  return <PageLoader message="Loading this page…" />;
}
