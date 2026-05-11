# Code summary

This file is a **module-by-module** tour of the codebase for a new hire on day 1. Replace each section as features land; until then it reflects the scaffold only.

---

## `backend/` (Express API)

**What it does today:** Hosts a minimal HTTP server (health check), Prisma client wiring, and placeholder seed. Feature modules live under `src/modules/` (empty until domains are added).

**Design choices:** Express + TypeScript; **Prisma** for PostgreSQL; **Zod** for request validation; **Pino** for structured JSON logs. Routes will stay thin and call module services/repositories.

**Extend:** Add a folder per domain under `src/modules/<name>/` (routes, service, repository, Zod schemas). Mount routers from a single composition root (e.g. `src/app.ts` or `src/server.ts`).

---

## `backend/prisma/`

**What it does:** Defines the database schema and migration history. Seed script stub will grow to satisfy the rubric counts (2 creators × 3 programs × ~10 sessions each).

**Design choices:** Schema changes **only** through Prisma Migrate.

**Extend:** Run migrations locally with `pnpm db:migrate` from `backend/` after models exist; keep `tenant_id` on all tenant-owned tables and enforce it in repositories.

---

## `backend/tests/`

**What it does:** Jest + Supertest for API/integration tests. A smoke test exists to verify the runner; add tests whose names include **`rejects cross-tenant`** per requirements.

**Design choices:** Tests live next to the backend package under `tests/`, not co-located with `src/`, per repo convention.

**Extend:** Import the HTTP app without listening on a real port where possible; use a test database or transactions strategy documented in the README.

---

## `frontend/` (Next.js Admin)

**What it does today:** App Router shell with a placeholder home page.

**Design choices:** Next.js 15 App Router; **React Hook Form** + **Zod** for forms; API base URL from env (`NEXT_PUBLIC_*` for browser).

**Extend:** Add route segments under `src/app/` for auth, programs, sessions, CSV import, and audit log; keep server-only secrets out of the client bundle.

---

## Cross-cutting (planned)

Document here when implemented: **auth/JWT**, **tenant context**, **audit writer**, **S3 presign**, **CSV import pipeline**, and any shared **logging/request ID** middleware.
