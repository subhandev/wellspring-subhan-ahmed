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
  return fetch(apiUrl(path), { ...rest, headers });
}
