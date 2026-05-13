import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <DashboardShell>
        <main className="mx-auto min-w-0 max-w-[1040px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </DashboardShell>
    </ProtectedLayout>
  );
}
