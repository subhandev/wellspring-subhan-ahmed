# Code summary

Module-by-module tour for a new hire on day 1. This aligns with the **Breakthrough Full-Stack Engineer take-home** (Wellspring): multi-tenant CMS for wellness creators, JWT admin API, Next.js admin UI, and the quality bars in [`REQUIREMENTS.md`](REQUIREMENTS.md). The monorepo uses **pnpm** in sibling packages **`backend/`** and **`frontend/`** (no root `package.json`); the brief’s **`npm` scripts** map to `pnpm dev`, `pnpm test`, `pnpm db:migrate`, and `pnpm db:seed` **from each package directory** as documented in the root [`README.md`](../README.md).

---

## App shell and cross-cutting (`backend/src/`)

**What it does:** [`app.ts`](../backend/src/app.ts) composes Express: CORS, [`requestId`](../backend/src/middleware/requestId.ts) middleware, **pino-http** so every request line is JSON with `request_id` and `tenant_id` (`pre_auth` until JWT middleware runs), JSON body parser, `GET /health`, optional OpenAPI (`/openapi.json`, `/api-docs` when enabled), [`createAuthenticateMiddleware`](../backend/src/middleware/authenticate.ts), domain routers, and [`createErrorHandler`](../backend/src/middleware/errorHandler.ts).

**Design choice:** Auth is split **`/api/auth/*`** (resource-oriented auth endpoints) vs **`/v1/*`** (programs, sessions, uploads, import, audit). Public routes are an explicit allowlist inside the auth middleware; everything else requires **`Authorization: Bearer`**, including **`GET /api/auth/me`** and **`POST /api/auth/logout`**.

**Non-obvious:** `app.set("env", env)` passes typed config into handlers (e.g. uploads read S3 settings). Feature routers under `src/modules/<domain>/` typically use **`routes.ts`** (not `programs.routes.ts`); keep new domains consistent.

---

## `backend/src/modules/auth/`

**What it does:** Signup, login, forgot-password, reset-password, optional **me** and **logout**. [`auth.service.ts`](../backend/src/modules/auth/auth.service.ts) hashes passwords, issues access JWTs, issues password-reset JWTs bound to the current password hash, and writes **audit** rows for signup, password reset, and logout.

**Design choice:** After JWT verification, **`authenticate`** loads the `Creator` from the DB and sets `req.tenantId` from that row—not from a client-supplied tenant id—so even a tampered token claim cannot authorize another tenant’s data elsewhere.

**Non-obvious:** Password reset returns a **reset token in the JSON response** for local/dev (no SMTP). Production would replace this with email links only.

---

## `backend/src/modules/programs/`

**What it does:** List, create, read, update, delete programs for the authenticated tenant. [`repository.ts`](../backend/src/modules/programs/repository.ts) is the only Prisma surface for programs; [`service.ts`](../backend/src/modules/programs/service.ts) appends audit rows on mutations.

**Design choice:** Every query uses **`tenantId` in `where`** (including `updateMany` / `deleteMany`) so a forged id from another tenant yields **404**, not a leak.

**Non-obvious:** HTTP list shape is **`{ programs }`**; OpenAPI and [`schemas.ts`](../backend/src/modules/programs/schemas.ts) define field length limits the frontend mirrors.

---

## `backend/src/modules/sessions/`

**What it does:** Sessions scoped by program; list by program, get by id, create, patch, delete, and **reorder** within a program. [`sessions.repository.ts`](../backend/src/modules/sessions/sessions.repository.ts) asserts program ownership by tenant before writes; [`sessionMediaUrl.ts`](../backend/src/lib/sessionMediaUrl.ts) enforces that stored **`mediaUrl`** paths belong to the tenant’s media prefix.

**Design choice:** **`Session.tenantId`** is denormalized from the program so tenant-scoped reads do not require joining `Program` on every list.

**Non-obvious:** Reorder uses a transaction with **`SELECT … FOR UPDATE`** and a two-phase position bump to satisfy **`@@unique([programId, position])`** under concurrency; timeouts scale with session count.

---

## `backend/src/modules/uploads/`

**What it does:** **Presigned PUT** for uploads and **presigned GET** for playback. Object keys are always under **`tenants/{tenantId}/media/`**; the server generates keys (clients cannot choose arbitrary prefixes).

**Design choice:** Upload URLs are **time-limited** (`PRESIGN_EXPIRES_SECONDS`, capped in env validation) and **never accept a client-chosen bucket key** for PUT; the server generates the object key.

**Non-obvious:** Presign calls **`appendAuditLog`** with **`media.presigned`**. Image MIME types are allowed in addition to audio/video for flexibility.

---

## `backend/src/modules/import/`

**What it does:** Accepts CSV (JSON body or multipart file), validates headers and each row, and returns **per-row** success/failure with messages. [`service.ts`](../backend/src/modules/import/service.ts) resolves `program_id` values against **`findProgramIdsOwnedByTenant`** so another tenant’s program id is rejected as a row error, not a server crash.

**Design choice:** **Idempotency** uses **`clientImportId`** (per import job) plus **`client_row_id`** per row, stored in **`SessionImportKey`** with a composite unique key `(tenantId, clientImportId, clientRowId)`; retries return the existing `sessionId`.

**Non-obvious:** Successful rows run in **per-row transactions** so partial imports are visible and races on the same key converge on the unique constraint.

---

## `backend/src/modules/audit/`

**What it does:** **`GET /v1/audit`** returns recent rows for the tenant with optional **`from`**, **`to`**, and **`action`** filters (dotted action strings in JSON, enum in Postgres).

**Design choice:** Writers use **`appendAuditLog`** with **`AuditLogAction`** enum members; wire format is centralized in [`auditActionWire.ts`](../backend/src/lib/auditActionWire.ts) so OpenAPI and Zod query validation stay in sync.

**Non-obvious:** Login is intentionally **not** audited (noise / PII); signup, password reset, logout, and CMS mutations are.

---

## `backend/src/prisma/` and config

**What it does:** [`schema.prisma`](../backend/src/prisma/schema.prisma) defines `Creator`, `Program`, `Session`, `AuditLog`, `SessionImportKey`. All schema changes ship as SQL under [`migrations/`](../backend/src/prisma/migrations/). [`seed.ts`](../backend/src/prisma/seed.ts) creates **2 creators × 3 programs × 10 sessions** and emits **one JSON log line per message** (`request_id: "seed"`, `tenant_id` when in a tenant context).

**Design choice:** Prisma CLI is always invoked with **`--schema src/prisma/schema.prisma`**.

**Non-obvious:** `DATABASE_URL` can be absent for some smoke tests; JWT-protected routes need **`JWT_SECRET`** at runtime.

---

## `backend/tests/`

**What it does:** Jest + Supertest against **`createApp()`**; [`setup.ts`](../backend/tests/setup.ts) loads env defaults. Multiple tests include **`rejects cross-tenant`** in the name (programs, sessions, import, uploads presign-get, media URL) to match reviewer greps.

**Design choice:** DB-backed suites skip when **`DATABASE_URL`** is unset; keep local `.env` populated for full runs.

**Non-obvious:** Cross-tenant cases expect **404** (not 403) to avoid existence leaks.

---

## `frontend/` (Next.js admin)

**What it does:** App Router: **`(auth)/`** signup, login, forgot/reset password; **`(dashboard)/`** program list/create/edit, session list with **@dnd-kit** reorder, session create/edit with **presigned S3 upload**, CSV import with row feedback, audit viewer with date/action filters. [`DashboardGate`](../frontend/src/components/DashboardGate.tsx) holds the JWT (currently **`localStorage`**); [`lib/api.ts`](../frontend/src/lib/api.ts) attaches Bearer tokens.

**Design choice:** **React Hook Form + Zod** on all major forms; Tailwind + shared UI primitives.

**Non-obvious:** **`NEXT_PUBLIC_API_URL`** must point at the API origin (e.g. `http://localhost:4000`); the client calls both **`/api/auth`** and **`/v1`** paths via that base.

---

## Cross-check with the assessment brief

| Brief area | Where it lives |
|------------|----------------|
| AI evidence, chronological | [`../ai-history/`](../ai-history/) |
| README, env examples, scripts, seed | [`../README.md`](../README.md), [`../backend/.env.example`](../backend/.env.example), [`../frontend/.env.example`](../frontend/.env.example) |
| Self-review ~1000 words | [`ARCHITECTURE_REVIEW.md`](ARCHITECTURE_REVIEW.md) |
| Loom URL at top of README | Placeholder in root README — **record before submit** |
