import { getAccessToken, setAccessToken } from "./auth";

const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export function getApiBase(): string {
  return base;
}

/** Path under `/v1`, e.g. `/programs` or `programs`. */
export function v1(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
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
  return fetch(v1(path), { ...rest, headers });
}
