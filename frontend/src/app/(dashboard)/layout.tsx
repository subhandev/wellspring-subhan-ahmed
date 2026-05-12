import { DashboardNav } from "@/components/layout/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
