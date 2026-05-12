import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6">
      <div className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
