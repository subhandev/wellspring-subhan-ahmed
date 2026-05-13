# Wellspring

**_[Loom walkthrough (5–7 min): add URL before submission.]_**

Multi-tenant admin CMS for wellness creators: **Express + PostgreSQL (Prisma)** API and **Next.js** admin. The repo is **two sibling pnpm packages** (`backend/`, `frontend/`) with **no root `package.json`**.

## Live

| Service | URL |
|---------|-----|
| Admin (Vercel) | https://wellspring-admin-six.vercel.app |
| API (Railway) | https://wellspring-subhan-ahmed-production.up.railway.app |

**Wiring:** Set **`NEXT_PUBLIC_API_URL`** on the frontend to the API origin (HTTPS, **no trailing slash**). On the API, set **`CORS_ORIGIN`** to a comma-separated list of allowed admin origins (must include the Vercel URL in production). Redeploy the admin after changing `NEXT_PUBLIC_API_URL`.

## Documentation

- Brief and rubric: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)
- Module tour: [`docs/CODE_SUMMARY.md`](docs/CODE_SUMMARY.md)
- Architecture self-review: [`docs/ARCHITECTURE_REVIEW.md`](docs/ARCHITECTURE_REVIEW.md)
- AI session exports: [`ai-history/`](ai-history/)

## Stack (short)

**Backend:** Node.js 20+, Express, TypeScript, PostgreSQL, Prisma, Zod, Pino (JSON logs with `request_id` and `tenant_id`, or `pre_auth` before JWT), JWT, Jest + Supertest.

**Frontend:** Next.js (App Router), React, TypeScript, Tailwind, shadcn-style UI under `frontend/src/components/ui/`, React Hook Form + Zod.

**Notable behavior:** Tenant isolation in repositories (not only routes). CSV import with row errors and client import id idempotency. S3 presigned uploads (tenant-scoped keys, time-limited). Audit log with filters. Prisma **migrations only** under `backend/src/prisma/migrations/`. Seed: 2 creators, 3 programs each, 10 sessions per program.

## Prerequisites

- Node.js **20+** and **pnpm 9+** (see `packageManager` in each `package.json`; e.g. `corepack prepare pnpm@9.15.0 --activate` after `corepack enable`)
- PostgreSQL **14+** for local API development

## Local setup

> **Monorepo:** The repo is **two sibling pnpm packages** (`backend/`, `frontend/`) with **no root `package.json`**.

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

1. **Env:** [`backend/.env.example`](backend/.env.example) → `backend/.env`. [`frontend/.env.example`](frontend/.env.example) → `frontend/.env.local` (`NEXT_PUBLIC_API_URL=http://localhost:4000` for local API).

2. **Database** (from `backend/`):

   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

   Schema iteration: `pnpm db:migrate:dev` (wraps `prisma migrate dev` with `--schema src/prisma/schema.prisma`).

3. **Seed** (refuses `NODE_ENV=production`):

   ```bash
   pnpm db:seed
   ```

   Seeded accounts (same password for both): **`nora.chen@wellspring.example`** and **`marcus.ortiz@wellspring.example`** — **`Password123!`**

## Run and test

Two terminals:

```bash
cd backend && pnpm dev    # http://localhost:4000 — GET /health
cd frontend && pnpm dev   # http://localhost:3000
```

With `ENABLE_API_DOCS=1` (default in dev): Swagger at `/api-docs`, spec at `/openapi.json`.

```bash
cd backend && pnpm test
cd frontend && pnpm test
```

Integration tests under `backend/tests/` cover cross-tenant access rejection and idempotent bulk import behaviour (several test names include `rejects cross-tenant` for rubric grep).

## Package scripts

| Package | Common |
|---------|--------|
| `backend/` | `dev`, `build`, `start`, `test`, `db:migrate`, `db:migrate:dev`, `db:seed`, `db:generate`, `typecheck`, `lint` |
| `frontend/` | `dev`, `build`, `start`, `test`, `deploy:vercel`, `typecheck`, `lint` |

## API (quick)

| Area | Notes |
|------|--------|
| Health | `GET /health` |
| Auth (public) | `POST /api/auth/signup`, `login`, `forgot-password`, `reset-password` |
| Auth (Bearer) | `GET /api/auth/me`, `POST /api/auth/logout` |
| App (Bearer) | `/v1/programs`, `/v1/sessions`, `/v1/uploads`, `/v1/import`, `/v1/audit` |
| Docs (if enabled) | `GET /api-docs`, `GET /openapi.json` |

Protected routes: **`Authorization: Bearer <jwt>`**.

## S3 session media

`POST /v1/uploads/presign` → browser `PUT` to the signed URL (`Content-Type` must match the presign).

Set `AWS_REGION` (must match bucket), credentials, `S3_BUCKET` in `backend/.env`. Optional: `S3_PUBLIC_BASE_URL`, `S3_ENDPOINT`. Bucket CORS must allow `PUT` (and `GET`/`HEAD` for playback) from your admin origins; include both `http://localhost:3000` and `http://127.0.0.1:3000` in dev if needed. IAM needs `s3:PutObject` on `tenants/*` (and `GetObject` if the same principal reads objects). Details stay in `.env.example` and [`docs/CODE_SUMMARY.md`](docs/CODE_SUMMARY.md).

## Production builds

```bash
cd backend && pnpm build && pnpm start
cd frontend && pnpm build && pnpm start
```

Run migrations before serving the API (`pnpm db:migrate` from `backend/`, or your host’s equivalent).

## Deploy

**API (Railway)**  
Service **root directory:** `backend`. Link Postgres **`DATABASE_URL`**. Set `NODE_ENV=production`, a long `JWT_SECRET` (≥16 chars), `CORS_ORIGIN` (HTTPS admin origins). Optional: `ENABLE_API_DOCS=0`. [`backend/railway.json`](backend/railway.json): build `pnpm run build`, start `node dist/index.js`, **`preDeployCommand`** runs `npx prisma migrate deploy --schema src/prisma/schema.prisma`, health check `GET /health`. Seed is blocked when `NODE_ENV=production`; to load demo data once, run seed from a shell with DB access using e.g. `NODE_ENV=development`.

**Admin (Vercel)**  
Point **`NEXT_PUBLIC_API_URL`** at the public Railway API origin, then redeploy (`pnpm -C frontend deploy:vercel` or Vercel dashboard).

## Layout

| Path | Role |
|------|------|
| `backend/` | API, Prisma, seed, Jest, OpenAPI, Railway config |
| `frontend/` | Next.js admin |
| `docs/` | `REQUIREMENTS.md`, `CODE_SUMMARY.md`, `ARCHITECTURE_REVIEW.md` |
| `ai-history/` | Raw AI session exports (Cursor, Claude) — chronological, unedited |
