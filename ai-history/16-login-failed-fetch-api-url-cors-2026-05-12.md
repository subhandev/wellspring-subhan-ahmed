# Session note — login `Failed to fetch`

## Cause

1. **Wrong URL**: `apiFetch("/auth/login")` was resolved to `{API}/v1/auth/login` but Express mounts auth at **`/api/auth/*`**, so the browser never hit a valid login route (404 would still be a Response; combined with CORS the client often surfaced `TypeError: Failed to fetch`).
2. **No CORS**: Next.js (e.g. `http://localhost:3000`) calling the API on `:4000` is cross-origin; without `Access-Control-Allow-Origin`, the browser blocks the response and `fetch` rejects.

## Fix

- `frontend/src/lib/api.ts`: `apiUrl()` sends `/auth/*` and `/auth/me` → `/api/auth/...`, everything else → `/v1/...`.
- `backend/src/middleware/cors.ts` + `app.ts`: CORS middleware; dev/test allows `localhost` / `127.0.0.1` any port; production uses optional `CORS_ORIGIN` (comma-separated).
- `backend/.env.example`: documented `CORS_ORIGIN`.

## Still fails?

If `Failed to fetch` persists, confirm the API is running on `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`) and Postgres/`JWT_SECRET` are set.
