"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setAccessToken } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        setAccessToken(null);
        router.push("/login");
        router.refresh();
      }}
    >
      Log out
    </Button>
  );
}
