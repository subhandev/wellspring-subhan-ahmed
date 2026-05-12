import { Navbar } from "@/components/layout/Navbar";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </div>
    </ProtectedLayout>
  );
}
