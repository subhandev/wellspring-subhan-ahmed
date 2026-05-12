# Code summary

Module-by-module tour for a new hire on day 1.

---

## `backend/` (Express API)

**What it does:** [`src/app.ts`](../backend/src/app.ts) builds the app with **request ID**, **pino-http** (`request_id`, `tenant_id` with `"pre_auth"` until JWT runs), **`app.set("env")`**, JSON body, **`GET /health`**, **`createJwtAuthMiddleware`** (public auth routes + Bearer JWT for other `/v1/*`), and domain routers under **`/v1`**. Feature modules: **`auth`**, **`programs`**, **`sessions`**, **`uploads`**, **`import`**, **`audit`**. Shared: [`lib/httpError.ts`](../backend/src/lib/httpError.ts), [`lib/auditWriter.ts`](../backend/src/lib/auditWriter.ts).

**Design choices:** **Zod** on inputs; **tenant isolation** in services/repositories via `tenantId` from `req` (never from client-supplied tenant fields). Programs/sessions use explicit Prisma `where` with `tenantId`; sessions verify `programId` ownership before writes.

**Extend:** Add repository files if you want thinner services; keep all tenant scopes in data layer.

---

## `backend/src/prisma/`

**What it does:** [`schema.prisma`](../backend/src/prisma/schema.prisma) — `Creator` (incl. password reset fields), `Program`, `Session`, `AuditLog`, `SessionImportKey`. Migrations under [`migrations/`](../backend/src/prisma/migrations/). [`seed.ts`](../backend/src/prisma/seed.ts) — 2 creators × 3 programs × 10 sessions.

**Design choices:** All CLI uses **`--schema src/prisma/schema.prisma`**.

---

## `backend/tests/`

**What it does:** Jest + Supertest against **`createApp()`**; [`tests/setup.ts`](../backend/tests/setup.ts) loads `.env` and default `JWT_SECRET`. Includes **`rejects cross-tenant program access`**, **`rejects cross-tenant session access`**, **`rejects cross-tenant import into another program`**.

---

## `frontend/` (Next.js Admin)

**What it does:** App Router with **`(auth)/`** (login, signup, forgot/reset password) and **`(dashboard)/`** gated by [`DashboardGate`](../frontend/src/components/DashboardGate.tsx) (JWT in `localStorage`). [`lib/api.ts`](../frontend/src/lib/api.ts) — **`apiFetch`** to `/v1` with Bearer token. Programs CRUD, sessions list with **@dnd-kit** reorder calling **`POST /v1/sessions/reorder`**, session edit with **presigned S3 upload** flow, CSV import UI, audit log filters.

**Design choices:** **RHF + Zod** on forms; **Tailwind** + shadcn-style **`Button`**; `NEXT_PUBLIC_API_URL` for API origin only.

---

## Cross-cutting

**Implemented:** JWT auth, audit append on mutating operations and import, S3 presign (`tenant/...` key prefix + `publicUrl`), CSV import with **`SessionImportKey`** idempotency and per-row results, structured JSON logs with **`tenant_id`** after auth.
