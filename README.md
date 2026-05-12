# Wellspring (Breakthrough take-home)

## Loom walkthrough (required)

**_[Add your 5–7 minute Loom URL here before submission.]_**

Multi-tenant admin CMS for wellness creators: **Express + PostgreSQL (Prisma)** API and **Next.js** admin. Full brief and quality bars live in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Module tour: [`docs/CODE_SUMMARY.md`](docs/CODE_SUMMARY.md). Self-review: [`docs/ARCHITECTURE_REVIEW.md`](docs/ARCHITECTURE_REVIEW.md). Raw AI exports: [`ai-history/`](ai-history/).

This repo uses **two sibling pnpm packages** (`backend/`, `frontend/`) with **no root `package.json`**. Run scripts from each directory as below (equivalent to the brief’s `dev`, `test`, `db:migrate`, `db:seed` expectations).

### Package scripts

- **Backend (`backend/`)**: `pnpm dev`, `pnpm test`, `pnpm db:migrate`, `pnpm db:seed` (also `pnpm db:generate`, `pnpm db:migrate:dev`)
- **Frontend (`frontend/`)**: `pnpm dev`, `pnpm test` (also `pnpm build`, `pnpm start`)

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

   - API: copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` (and optional `PORT`, `LOG_LEVEL`). Prisma schema lives at `backend/src/prisma/schema.prisma` (all `pnpm db:*` scripts pass `--schema` there). OpenAPI endpoints are gated by **`ENABLE_API_DOCS`** (`1`/`0`; see [.env.example](backend/.env.example)). If you want to test **presigned S3 uploads**, also set `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET` (plus optional `S3_ENDPOINT`, `S3_PUBLIC_BASE_URL`).
   - Admin UI: copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` to your API base URL (e.g. `http://localhost:4000`).

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

5. **Seed** (from `backend/`; implements rubric counts when finished):

   ```bash
   pnpm db:seed
   ```

   Seeded credentials (Local):
   - `creator1@wellspring-seed.example` / `Password123!`
   - `creator2@wellspring-seed.example` / `Password123!`

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

When the API is running and docs are enabled (default in non-production environments):

- **API Docs:** `http://localhost:4000/api-docs` (when `ENABLE_API_DOCS=1`)
- **OpenAPI JSON:** `http://localhost:4000/openapi.json`

Protected operations use **`Authorization: Bearer <jwt>`** (use **Authorize** in Swagger or capture a token from login).

---

## Bruno (API testing)

1. Install [Bruno](https://www.usebruno.com/).
2. **Open Collection** → choose [`backend/bruno/wellspring-api`](backend/bruno/wellspring-api).
3. Select environment **Local**, run **`pnpm dev`** for the backend, **`pnpm db:seed`** for seed users (`creator1@wellspring-seed.example` / `Password123!` matches the Local env vars).
4. Run **Auth → Login** first; the response script saves **`token`** to the environment for bearer-authenticated requests.
5. Prefer **Programs → List programs** (or Create) before **Sessions**, **Import**, and similar calls so **`programId`** / **`sessionId`** are populated where applicable.

You can regenerate or reconcile requests anytime by importing **`/openapi.json`** into Bruno if you prefer that workflow.

---

## Test

```bash
cd backend && pnpm test
cd ../frontend && pnpm test
```

API integration tests (including names containing **`rejects cross-tenant`**) live under `backend/tests/`.

---

## Build (production-style)

```bash
cd frontend && pnpm build && pnpm start
```

The API can be run with `tsx` in development; add a production start command (e.g. `node dist/...`) when you compile the server to `dist/`.

For production you’ll typically add `backend` scripts like:

```bash
pnpm -C backend add -D tsup
```

and then:

```json
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs --dts false --minify false --sourcemap",
    "start": "node dist/index.js"
  }
}
```

---

## Project layout

| Path | Purpose |
|------|---------|
| `backend/` | Express API, Prisma schema & migrations, seed, Jest + Supertest, Swagger + Bruno collection (`bruno/wellspring-api`) |
| `frontend/` | Next.js App Router admin |
| `docs/` | Requirements copy, code summary, architecture review |
| `ai-history/` | Exported AI sessions (chronological, uncurated) |

---

## Submission checklist

- [ ] Public GitHub repo + email per [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)
- [ ] Loom URL at **top of this README**
- [ ] `docs/CODE_SUMMARY.md` and `docs/ARCHITECTURE_REVIEW.md` completed
- [x] `/ai-history` populated
