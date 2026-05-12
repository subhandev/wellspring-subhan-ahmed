"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";

type AuthStatus = "checking" | "authed" | "unauthed";

/**
 * Client-only auth snapshot after mount. Use for gating dashboard UI;
 * first paint is `checking` until `useEffect` runs.
 */
export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    setStatus(getAccessToken() ? "authed" : "unauthed");
  }, []);

  return {
    status,
    isAuthenticated: status === "authed",
    isUnauthenticated: status === "unauthed",
    isChecking: status === "checking"
  };
}
