# Wellspring implementation backlog

Living checklist aligned with [`REQUIREMENTS.md`](REQUIREMENTS.md), [`.cursor/rules/wellspring-rubric.mdc`](../.cursor/rules/wellspring-rubric.mdc), and [`.cursor/rules/backend.mdc`](../.cursor/rules/backend.mdc). Tick items as you ship.

---

## UI stack (frontend)

- [x] **Tailwind CSS** — configure for Next.js App Router under `frontend/` (PostCSS, `globals.css`, content paths).
- [x] **shadcn/ui** — `npx shadcn@latest init` in `frontend/` (`components.json`, `src/components/ui/*`).
- [ ] Keep **React Hook Form + Zod** for forms; prefer shadcn `Form`, `Input`, `Button`, `Table`, `Dialog`, and date/filter primitives as needed (audit filters, CSV feedback tables).

---

## Data / Prisma

- [x] **Models + migrations only** — no ad-hoc DDL at startup. Initial entities (names may vary; keep `tenant_id` on tenant-owned rows):
  - Creator (tenant): admin identity, password hash, etc.
  - Program: belongs to creator/tenant.
  - Session: belongs to program; **title**, **duration**, **ordered position**, **instructor name**, **tags**, **media file URL** (and any indexes you need).
  - AuditLog: actor, action, target entity, timestamp, `tenant_id`.
  - **Bulk import idempotency** — e.g. table keyed by `client_import_id` (and optionally per-row client id or hash) so retries do not duplicate sessions; document chosen upsert/skip rules in `ARCHITECTURE_REVIEW.md`.
- [ ] **Seed** — [`backend/src/prisma/seed.ts`](../backend/src/prisma/seed.ts): **2 creators**, **3 programs** each, **~10 sessions** per program.

---

## Cross-cutting backend

- [x] **`request_id`** on every request; propagate to Pino child loggers.
- [x] **Structured JSON logs** — every line includes `request_id`; include **`tenant_id`** once auth resolves it; use a documented sentinel (e.g. `null` or `"pre_auth"`) for routes before JWT verification.
- [ ] **JWT middleware** — verify token, attach **tenant context** (and actor) to `req`; never authorize using client-supplied `tenant_id` from body/query.
- [x] **App composition** — mount domain routers from a single root (e.g. `src/app.ts` / `src/server.ts`); keep route handlers thin.

---

## Domain modules (`backend/src/modules/<domain>/`)

Per domain: `routes` (+ optional `service`, `repository`, `schemas`). Repositories **always** scope Prisma queries by `tenantId` from context.

- [x] **`auth/`** — signup, login, password reset; issue JWT with stable tenant/creator id. _(Scaffold: 501 stubs.)_
- [x] **`programs/`** — tenant-scoped CRUD. _(Scaffold: 501 stubs.)_
- [x] **`sessions/`** — tenant-scoped CRUD; **reorder** endpoint (batch position updates) for drag-reorder. _(Scaffold: 501 stubs.)_
- [x] **`uploads/`** (or `media/`) — **S3 presigned URLs**: short TTL, key prefix or policy scoped to tenant; only for authenticated tenant. _(Scaffold: 501 stubs.)_
- [x] **`import/`** — CSV bulk upload: **row-level validation errors** returned to client; **idempotent** using **client-provided import id** (no duplicate rows on retry). _(Scaffold: 501 stubs.)_
- [x] **`audit/`** — append audit rows on **admin write** actions; **list** with filters: **date range** and **action type**. _(Scaffold: 501 stubs.)_

---

## Frontend routes / screens (Next.js App Router)

- [x] Auth: signup, login, password reset. _(Scaffold pages.)_
- [x] Programs: list, create, edit. _(Scaffold routes.)_
- [x] Sessions: list per program with **drag-reorder**; create/edit with all required fields. _(Scaffold routes.)_
- [x] Session **media upload** via presigned URL flow (request URL → PUT to S3 → persist URL). _(Scaffold copy on edit page.)_
- [x] **Bulk CSV upload** — show which rows failed and why. _(Scaffold page.)_
- [x] **Audit log** viewer — filters by date and action type (shadcn-friendly controls). _(Scaffold page.)_

---

## Quality / deliverables

- [ ] At least **three** integration/API tests in `backend/tests/` whose names include **`rejects cross-tenant`** (reviewers grep for this).
- [ ] **`backend/.env.example`** and **`frontend/.env.example`** kept accurate.
- [ ] **README** — setup, run, test, seed; **Loom URL** at top before submission.
- [x] **`/ai-history`** — chronological raw AI exports.
- [ ] **`docs/CODE_SUMMARY.md`** — update as modules land.
- [ ] **`docs/ARCHITECTURE_REVIEW.md`** — update for tenant isolation, import idempotency, S3 flow.

---

## Suggested build order

1. Prisma models + migrations + seed counts.  
2. Logging + `request_id`; then auth + JWT + tenant context.  
3. Programs + sessions + reorder.  
4. Audit writes + audit list API.  
5. S3 presign + session media in UI.  
6. CSV import + idempotency + UI.  
7. Cross-tenant tests, then README / env examples / architecture docs polish.
