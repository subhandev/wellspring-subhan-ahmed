import { AppBrandLink } from "@/components/auth/AppBrandLink";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="mb-6 text-center">
        <AppBrandLink />
      </div>
      <main className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        {children}
      </main>
    </div>
  );
}
