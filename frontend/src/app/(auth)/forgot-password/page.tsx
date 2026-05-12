import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Forgot password</h1>
      <p className="text-sm text-muted-foreground">Scaffold — password reset flow.</p>
      <Button disabled>Send reset link</Button>
    </div>
  );
}
