import { getAccessToken, setAccessToken } from "./auth";

const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export function getApiBase(): string {
  return base;
}

/**
 * Resolves a path for `fetch`: `/auth/*` and `/auth/me` → `/api/auth/*` (Express mount);
 * all other paths → `/v1/...`.
 */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p === "/auth/me" || p.startsWith("/auth/")) {
    return `${getApiBase()}/api/auth${p.slice("/auth".length)}`;
  }
  return `${getApiBase()}/v1${p}`;
}

export { getAccessToken, setAccessToken };

export type ApiFetchOpts = RequestInit & { auth?: boolean };

export async function apiFetch(path: string, init?: ApiFetchOpts): Promise<Response> {
  const { auth = true, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  if (rest.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getAccessToken();
    if (t) {
      headers.set("Authorization", `Bearer ${t}`);
    }
  }
  const res = await fetch(apiUrl(path), { ...rest, headers });
  if (auth && res.status === 401 && typeof window !== "undefined") {
    setAccessToken(null);
    window.location.replace("/login");
  }
  return res;
}

/** Express API: success auth payloads use `{ success, data: { accessToken } }`. */
export function readAuthAccessToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const data = (body as { data?: { accessToken?: string } }).data;
  return typeof data?.accessToken === "string" ? data.accessToken : null;
}

/** Express API: errors use `{ success: false, error: { message } }`. */
export function readApiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const err = (body as { error?: { message?: string } }).error;
  return typeof err?.message === "string" ? err.message : fallback;
}

/** `POST /api/auth/forgot-password` success body: `{ data: { resetToken } }` (null if email unknown). */
export function readForgotPasswordResetToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const t = (body as { data?: { resetToken?: string | null } }).data?.resetToken;
  return typeof t === "string" && t.length > 0 ? t : null;
}
