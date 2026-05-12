import { Button } from "@/components/ui/button";

export default async function ResetPasswordPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Reset password</h1>
      <p className="text-xs text-muted-foreground">Token: {token}</p>
      <p className="text-sm text-muted-foreground">Scaffold — submit new password.</p>
      <Button disabled>Update password</Button>
    </div>
  );
}
