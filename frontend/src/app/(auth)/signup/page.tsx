import { Button } from "@/components/ui/button";

export default function SignupPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Sign up</h1>
      <p className="text-sm text-muted-foreground">Scaffold — wire to POST /v1/auth/signup.</p>
      <Button disabled>Create account</Button>
    </div>
  );
}
