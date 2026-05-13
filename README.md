# Wellspring (Breakthrough take-home)

## Loom walkthrough (required)

**_[Add your 5–7 minute Loom URL here before submission.]_**

## Live admin (Vercel)

**[https://wellspring-admin-six.vercel.app](https://wellspring-admin-six.vercel.app)** — production Next.js deploy; point Vercel **`NEXT_PUBLIC_API_URL`** at your public API (see `frontend/package.json` scripts `deploy:vercel` / `vercel:set-production-api`) and allow that origin in **`CORS_ORIGIN`** on the API.

Multi-tenant admin CMS for wellness creators: **Express + PostgreSQL (Prisma)** API and **Next.js** admin. This README covers setup, run, test, and seed. The official brief and quality bars are in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Module tour: [`docs/CODE_SUMMARY.md`](docs/CODE_SUMMARY.md). Self-review: [`docs/ARCHITECTURE_REVIEW.md`](docs/ARCHITECTURE_REVIEW.md). Raw AI exports: [`ai-history/`](ai-history/).

The repo uses **two sibling pnpm packages** (`backend/`, `frontend/`) with **no root `package.json`**. Run scripts from each package directory (equivalent to the brief’s `dev`, `test`, `db:migrate`, `db:seed` expectations).

### Tech stack

- **Backend:** Node.js, Express, TypeScript, PostgreSQL, Prisma, Zod, Pino, Jest + Supertest, JWT.
- **Frontend:** Next.js (App Router), React, TypeScript, **Tailwind CSS**, **shadcn/ui** (design tokens and shared primitives under `frontend/src/components/ui/`, Tailwind theme in `frontend/src/app/globals.css`), React Hook Form + Zod.

### What’s implemented

- **Backend:** JWT auth (**signup**, **login**, **forgot-password** / **reset-password** — reset returns a JWT in the API response for local/dev; no email transport), **programs** and **sessions** CRUD, **session reorder** within a program, **CSV bulk import** with per-row errors and **client import id** idempotency, **S3 presign** (+ optional **relay** upload), **audit log** with filters (date range, action type). **Tenant isolation** is enforced in repositories/services; integration tests include multiple cases whose names contain **`rejects cross-tenant`**. **Pino** JSON logs include **`request_id`** and **`tenant_id`** (or **`pre_auth`** before JWT).
- **Frontend:** **Responsive** admin from small screens up (below the `md` breakpoint: sticky top bar + slide-out navigation drawer, backdrop dismiss, Escape to close; from `md` up: persistent sidebar). Signup/login and password-reset flow, program list/create/edit, session list with **drag-and-drop reorder**, session create/edit with **media upload** (presign + PUT), **CSV import** with validation feedback, **audit log** viewer with filters.
- **Data:** Prisma **migrations only** under `backend/src/prisma/migrations/`. **Seed:** 2 creators, 3 programs each, 10 sessions per program.

### Package scripts

- **Backend (`backend/`)**: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm test`, `pnpm db:migrate`, `pnpm db:seed` (also `pnpm db:generate`, `pnpm db:migrate:dev`, `pnpm typecheck`, `pnpm lint`)
- **Frontend (`frontend/`)**: `pnpm dev`, `pnpm test` (also `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm lint`)

### API surface (quick reference)

| Area | Routes / notes |
|------|-----------|
| Health | `GET /health` |
| Auth | **Public:** `POST /api/auth/signup`, `login`, `forgot-password`, `reset-password` — **Bearer:** `GET /api/auth/me`, `POST /api/auth/logout` |
| Authenticated | `GET/PATCH …` under `/v1/programs`, `/v1/sessions`, `/v1/uploads`, `/v1/import`, `/v1/audit` |
| Docs (when enabled) | `GET /api-docs`, `GET /openapi.json` |

Protected routes expect **`Authorization: Bearer <jwt>`** (use **Authorize** in Swagger or a token from login).

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 9+ (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`, or install pnpm globally)
- **PostgreSQL** 14+ (local or Docker) for the API

---

## Setup

1. **Clone** the repository.

2. **Install dependencies** (once per package):

   ```bash
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```

3. **Environment files**

   - **API:** copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and set **`DATABASE_URL`**, **`JWT_SECRET`** (required for login and password-reset tokens), and optional `PORT`, `LOG_LEVEL`. For **S3 uploads**, set **`AWS_REGION`** to the bucket’s region, plus credentials and **`S3_BUCKET`**. Prisma schema: `backend/src/prisma/schema.prisma` (all `pnpm db:*` scripts pass `--schema` there). OpenAPI is controlled by **`ENABLE_API_DOCS`** (`1`/`0`; see `.env.example`).
   - **Admin UI:** copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env.local` and set **`NEXT_PUBLIC_API_URL`** to the API base URL (e.g. `http://localhost:4000`).

4. **Database & Prisma** (from `backend/`):

   ```bash
   cd backend
   pnpm db:generate
   ```

   After migration files exist in `backend/src/prisma/migrations/`, apply them:

   ```bash
   pnpm db:migrate
   ```

   For **local schema iteration** use `pnpm db:migrate:dev` (wraps `prisma migrate dev` with `--schema src/prisma/schema.prisma`). CI and production use `pnpm db:migrate` (`prisma migrate deploy`).

5. **Seed** (from `backend/`; creates rubric data; refuses `NODE_ENV=production`):

   ```bash
   pnpm db:seed
   ```

   Seed output is **one JSON object per line** (includes `request_id: "seed"`, `tenant_id` set to the creator id when relevant, or `pre_auth` for global steps) so it matches the spirit of structured logging used by the API.

   **Seeded logins (local):**

   - `creator1@wellspring.example` / `Password123!`
   - `creator2@wellspring.example` / `Password123!`

---

## Run

Use **two terminals** — API and web run separately.

```bash
# Terminal 1 — API (default port 4000)
cd backend && pnpm dev

# Terminal 2 — Admin UI (port 3000)
cd frontend && pnpm dev
```

- **API:** `http://localhost:4000` (e.g. `GET /health`)
- **Admin:** `http://localhost:3000`

When the API is running and docs are enabled (default in non-production when `ENABLE_API_DOCS` is unset or `1`):

- **API Docs:** `http://localhost:4000/api-docs`
- **OpenAPI JSON:** `http://localhost:4000/openapi.json`

### S3 session media (browser uploads)

Flow: **`POST /v1/uploads/presign`** → browser **`PUT`** to the signed URL (**`Content-Type`** must match presign; SigV4 signs `content-type`). If that **`PUT` fails**, **`POST /v1/uploads/relay`** sends the same body with header **`X-Wellspring-S3-Key`** = the presign response’s **`key`**, and matching **`Content-Type`**.

Set **`AWS_REGION`**, **`AWS_ACCESS_KEY_ID`**, **`AWS_SECRET_ACCESS_KEY`**, **`S3_BUCKET`** in `backend/.env`. **`AWS_REGION` must match the bucket’s region.** Optional: **`S3_PUBLIC_BASE_URL`**, **`S3_ENDPOINT`**.

1. **Bucket CORS** — Allow **`PUT`** (and **`GET`** / **`HEAD`** for playback) from your admin origin(s). Include both **`localhost`** and **`127.0.0.1`** in dev if you use either URL bar.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

2. **Public GET** — Session **`publicUrl`** must be readable (`s3:GetObject` or CDN); configure **`S3_PUBLIC_BASE_URL`** if you front the bucket.

3. **IAM** — **`s3:PutObject`** on `tenants/*` (and **`GetObject`** if the same principal reads objects).

---

## Test

```bash
cd backend && pnpm test
cd ../frontend && pnpm test
```

API integration tests live under `backend/tests/`. At least three tests include **`rejects cross-tenant`** in the name (reviewers grep for this).

---

## Build (production-style)

**Frontend:**

```bash
cd frontend && pnpm build && pnpm start
```

**Backend** (compiled `dist/`; `NODE_ENV=production` is typical):

```bash
cd backend && pnpm build && pnpm start
```

`pnpm build` runs Prisma client generation and `tsc`. Railway and other hosts should run **`pnpm db:migrate`** before traffic (see below).

### Deploy backend (Railway)

1. Create a Railway project, add **PostgreSQL**, and connect a **GitHub** service to this repo.
2. In the API service **Settings → Root Directory**, set **`backend`** (this repo has no root `package.json`).
3. **Variables:** reference the Postgres plugin’s **`DATABASE_URL`** on the service. Set **`NODE_ENV=production`**, a long **`JWT_SECRET`** (≥16 characters), comma-separated **`CORS_ORIGIN`** with your deployed admin origin(s) (HTTPS), and optionally **`ENABLE_API_DOCS=0`**. Without `CORS_ORIGIN` in production, localhost is not auto-allowed.
4. **Config as code:** [`backend/railway.json`](backend/railway.json) sets **`pnpm run build`**, **`pnpm run start`**, **`preDeployCommand`** (`pnpm run db:migrate`), and **`healthcheckPath`** `/health`.
5. **Seed (optional, once):** the seed script refuses `NODE_ENV=production`. From a shell with DB access, run e.g. **`NODE_ENV=development pnpm db:seed`** once after migrations, or seed from your machine using the hosted **`DATABASE_URL`**.
6. **Frontend:** set **`NEXT_PUBLIC_API_URL`** in the admin app to the Railway service **public URL** (HTTPS).

---

## Project layout

| Path | Purpose |
|------|---------|
| `backend/` | Express API, Prisma schema & migrations, seed, Jest + Supertest, Swagger / OpenAPI, [`railway.json`](backend/railway.json) for Railway |
| `frontend/` | Next.js App Router admin |
| `docs/` | Requirements copy, code summary, architecture review |
| `ai-history/` | Exported AI sessions (chronological, uncurated) |

---

## Submission checklist

- [ ] Public GitHub repo + email per [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)
- [ ] Loom URL at **top of this README**
- [x] [`docs/CODE_SUMMARY.md`](docs/CODE_SUMMARY.md) — module tour (keep updated if you add major areas)
- [ ] [`docs/ARCHITECTURE_REVIEW.md`](docs/ARCHITECTURE_REVIEW.md) — replace stub sections with your ~1000-word self-review before submission
- [x] [`ai-history/`](ai-history/) populated with raw exports
