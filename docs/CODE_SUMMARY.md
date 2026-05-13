# Code summary

Module-by-module tour for a new hire on day 1.

---

## `backend/` (Express API)

**What it does:** [`src/app.ts`](../backend/src/app.ts) builds the app with **request ID**, **pino-http** (`request_id`, `tenant_id` with `"pre_auth"` until JWT runs), **`app.set("env")`**, JSON body, **`GET /health`**, **`createJwtAuthMiddleware`** (public auth routes + Bearer JWT for other `/v1/*`), and domain routers under **`/v1`**. Feature modules: **`auth`**, **`programs`**, **`sessions`**, **`uploads`**, **`import`**, **`audit`**. Shared: [`lib/httpError.ts`](../backend/src/lib/httpError.ts), [`lib/auditWriter.ts`](../backend/src/lib/auditWriter.ts).

**Design choices:** **Zod** on inputs; **tenant isolation** in services/repositories via `tenantId` from `req` (never from client-supplied tenant fields). Programs/sessions use explicit Prisma `where` with `tenantId`; sessions verify `programId` ownership before writes.

**Extend:** Add repository files if you want thinner services; keep all tenant scopes in data layer.

### Programs API contract (`/v1/programs`)

**Stable shapes** live in [`modules/programs/schemas.ts`](../backend/src/modules/programs/schemas.ts) and mirrored in [`openapi/openapiDocument.ts`](../backend/src/openapi/openapiDocument.ts) under tag **Programs**.

| Method | Path | Body | Success |
|--------|------|------|---------|
| `GET` | `/v1/programs` | — | `{ programs: Program[] }` (`createdAt` desc) |
| `POST` | `/v1/programs` | `{ title: string (1–500), description?: string (≤5000) }` | `201` + `Program` |
| `GET` | `/v1/programs/:id` | — | `Program` |
| `PATCH` | `/v1/programs/:id` | At least one of `title`, `description` (`description` nullable) | `Program` |
| `DELETE` | `/v1/programs/:id` | — | `204` |

**`Program`** JSON: `id`, `tenantId`, `title`, `description` (nullable), `createdAt`, `updatedAt` (ISO strings). Wrong-tenant `:id` → **`404`** (no existence leak). Frontend should mirror string length limits above.

---

## `backend/src/prisma/`

**What it does:** [`schema.prisma`](../backend/src/prisma/schema.prisma) — `Creator` (incl. password reset fields), `Program`, `Session`, `AuditLog`, `SessionImportKey`. Migrations under [`migrations/`](../backend/src/prisma/migrations/). [`seed.ts`](../backend/src/prisma/seed.ts) — 2 creators × 3 programs × 10 sessions.

**Design choices:** All CLI uses **`--schema src/prisma/schema.prisma`**. **`Session.tenantId`** is denormalized (no FK to `Creator`) so tenant-owned rows can be filtered without joining `Program`; writers always copy the program’s tenant when inserting/updating. **`Session.mediaType`** is the Postgres enum **`AUDIO` | `VIDEO`** (MIME from upload is client-only). **`AuditLog.action`** is a Postgres enum at rest; **`GET /v1/audit`** still returns dotted strings (e.g. `program.created`) for stable clients. **`SessionImportKey.status`** is enum **`pending` | `success`**. **`AuditLog`** has **`@@index([actorId])`** for actor-scoped queries.

---

## `backend/tests/`

**What it does:** Jest + Supertest against **`createApp()`**; [`tests/setup.ts`](../backend/tests/setup.ts) loads `.env` and default `JWT_SECRET`. Programs tenant suite ([`programs-cross-tenant.test.ts`](../backend/tests/programs-cross-tenant.test.ts)) covers **GET / PATCH / DELETE** across tenants (404). Also **`rejects cross-tenant session access`**, **`rejects cross-tenant import into another program`**.

---

## `frontend/` (Next.js Admin)

**What it does:** App Router with **`(auth)/`** (login, signup, forgot/reset password) and **`(dashboard)/`** gated by [`DashboardGate`](../frontend/src/components/DashboardGate.tsx) (JWT in `localStorage`). [`lib/api.ts`](../frontend/src/lib/api.ts) — **`apiFetch`** to `/v1` with Bearer token; program forms share limits/types via [`lib/programs.ts`](../frontend/src/lib/programs.ts). Programs CRUD, sessions list with **@dnd-kit** reorder calling **`POST /v1/sessions/reorder`**, session edit with **presigned S3 upload** flow, CSV import UI, audit log filters.

**Design choices:** **RHF + Zod** on forms; **Tailwind** + shadcn-style **`Button`**; `NEXT_PUBLIC_API_URL` for API origin only.

---

## Cross-cutting

**Implemented:** JWT auth, audit append on mutating operations and import, S3 presign (`tenant/...` key prefix + `publicUrl`), CSV import with **`SessionImportKey`** idempotency and per-row results, structured JSON logs with **`tenant_id`** after auth.
