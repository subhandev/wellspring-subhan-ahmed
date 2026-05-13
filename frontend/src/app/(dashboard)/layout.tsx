import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <DashboardShell>
        <main className="mx-auto min-w-0 max-w-[1040px] px-10 py-12">{children}</main>
      </DashboardShell>
    </ProtectedLayout>
  );
}
