# Code summary

This file is a **module-by-module** tour of the codebase for a new hire on day 1. Replace each section as features land; until then it reflects the scaffold only.

---

## `backend/` (Express API)

**What it does today:** [`src/app.ts`](../backend/src/app.ts) builds the Express app (`createApp`) with **request ID** + **pino-http** JSON logs (`request_id`, `tenant_id: "pre_auth"` until JWT exists), mounts versioned routes under **`/v1`**, and exposes **`GET /health`**. [`src/index.ts`](../backend/src/index.ts) listens on `PORT`. Domain code lives under [`src/modules/<domain>/`](../backend/src/modules/) with **`routes.ts` → `controller.ts` → `service.ts`** (stubs return **501** `not_implemented`). Shared pieces: [`src/config/`](../backend/src/config/) (env, logger, Prisma singleton), [`src/middleware/`](../backend/src/middleware/), [`src/types/`](../backend/src/types/) (Express augmentation).

**Design choices:** Express + TypeScript; **Prisma** for PostgreSQL; **Zod** for env parsing; **Pino** for structured JSON logs. Repositories (tenant-scoped Prisma queries) are not scaffolded yet—add `repository.ts` per module when implementing writes.

**Extend:** Implement real handlers in services/controllers; enforce **`tenantId`** from JWT in repositories, never from the client body.

---

## `backend/src/prisma/`

**What it does:** [`schema.prisma`](../backend/src/prisma/schema.prisma) defines `Creator`, `Program`, `Session`, `AuditLog`, and `SessionImportKey` (CSV idempotency). Migrations live under [`migrations/`](../backend/src/prisma/migrations/); [`seed.ts`](../backend/src/prisma/seed.ts) is a stub until rubric seed counts are implemented.

**Design choices:** Schema changes **only** through Prisma Migrate. All CLI scripts use **`--schema src/prisma/schema.prisma`**.

**Extend:** Run `pnpm db:generate` and `pnpm db:migrate:dev` from `backend/`; keep `tenantId` on tenant-owned rows and enforce in repositories.

---

## `backend/tests/`

**What it does:** Jest + Supertest smoke tests import **`createApp`** and hit **`/health`** and a stub **`/v1/*`** route. [`jest.config.cjs`](../backend/jest.config.cjs) maps `*.js` imports to TypeScript sources for **NodeNext** compatibility.

**Design choices:** Tests live under `tests/`, not inside `src/`.

**Extend:** Add integration tests whose names include **`rejects cross-tenant`** per requirements.

---

## `frontend/` (Next.js Admin)

**What it does today:** Next.js 15 App Router with **Tailwind CSS v4** + **shadcn/ui** (base-nova). Route groups [`(auth)/`](../frontend/src/app/(auth)/) and [`(dashboard)/`](../frontend/src/app/(dashboard)/) hold scaffold pages (login, programs, sessions, import, audit). [`components/ui/button.tsx`](../frontend/src/components/ui/button.tsx) and [`lib/utils.ts`](../frontend/src/lib/utils.ts) come from shadcn; [`lib/api.ts`](../frontend/src/lib/api.ts) exposes `getApiBase()` / `apiFetch()` for the versioned API.

**Design choices:** **React Hook Form** + **Zod** are dependencies for upcoming forms; API base URL from **`NEXT_PUBLIC_API_URL`**.

**Extend:** Wire forms to `/v1` endpoints; keep server-only secrets out of the client bundle.

---

## Cross-cutting (next)

**Still to implement:** **auth/JWT**, **tenant context** on `req`, **audit writer**, **S3 presign**, **CSV import pipeline**, and row-level **tenant isolation** in Prisma repositories.
