import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Login</h1>
      <p className="text-sm text-muted-foreground">Scaffold — wire to POST /v1/auth/login.</p>
      <Button disabled>Continue</Button>
    </div>
  );
}
