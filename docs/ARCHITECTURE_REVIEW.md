# Architecture review

This document is the **highest-signal self-review** requested in the **Breakthrough Full-Stack Engineer take-home** (Wellspring). It is written against the official brief—same content as in-repo [`REQUIREMENTS.md`](REQUIREMENTS.md)—and targets about **one thousand words**: honest trade-offs, not a marketing sheet. Reviewers asked for judgment on AI-assisted work; evidence of prompts, pushback, and iteration lives under [`../ai-history/`](../ai-history/) as required.

---

## What I built and what I skipped — and why

**Shipped to match the product spec:** A **multi-tenant** admin CMS where **each creator is a tenant** with their own programs and sessions (title, duration, ordered position, instructor, tags, media URL). The **Node.js + Express + TypeScript + PostgreSQL** API exposes **JWT auth** (signup, login, password reset flow), **full CRUD** for programs and sessions, **drag-reorder** of sessions within a program, **CSV bulk import** with **row-level validation feedback**, **idempotent import** via a **client-provided import id** plus per-row ids, **pre-signed S3** upload (and GET for private objects) with **tenant-scoped keys** and bounded expiry, **audit log** listing with **date range** and **action type** filters, and **structured JSON logs** with **`request_id`** and **`tenant_id`** (or **`pre_auth`** on public routes). The **Next.js** admin implements the **required screens**: auth, programs, sessions with reorder and media upload, CSV import with errors per row, and audit filters.

**Intentionally out of scope for a ~48h window:** Real **email delivery** for reset links, **rate limiting**, **refresh tokens**, **multipart S3** for huge files, **async import workers**, **virus scanning**, and **RLS** in Postgres. The implementation prioritizes **tenant isolation in the data layer**, **migration-only schema**, **grep-friendly cross-tenant tests**, and **reviewable** service boundaries over SaaS completeness. Password reset **returns a token in the API response** in dev so evaluators can exercise the flow without SMTP; shipping that verbatim to production would be unsafe.

---

## Tenant isolation strategy

**Model:** **`Creator.id`** is the tenant identifier. **`Program.tenantId`** and **`Session.tenantId`** scope tenant-owned rows; **`Session.tenantId`** is **denormalized** so session lists and updates filter by tenant without always joining **`Program`**. **`AuditLog`** and **`SessionImportKey`** also carry **`tenantId`** so reporting and idempotency stay tenant-local.

**Enforcement:** Authorization never trusts a **`tenant_id`** from the request body. **`createAuthenticateMiddleware`** verifies the JWT, loads the creator row, and sets **`req.tenantId`** from that database identity. Repositories take **`tenantId`** explicitly and include it in **Prisma `where`** clauses (**`findFirst`**, **`updateMany`**, **`deleteMany`**) so forged ids from another tenant return **empty / 404**, not silent cross-tenant writes—the bar the brief describes when reviewers try to forge access. CSV **`program_id`** cells are validated against **`findProgramIdsOwnedByTenant`**. **`mediaUrl`** must fall under **`/tenants/{tenantId}/media/`** so session media cannot point at another tenant’s object path.

**At ~100 vs ~10,000 creators:** Today is a **single Postgres** deployment with btree indexes on **`tenantId`**. At higher scale I would tune **composite indexes** for hot paths, consider **read replicas** for analytics, **queue CSV imports** (idempotency keys already fit that move), and revisit **pool size** and **transaction duration** on reorder. **Postgres RLS** would be optional defense-in-depth if untrusted SQL ever entered the system; here **Prisma** remains the sole query layer.

---

## Bulk import design

Each import sends a **`clientImportId`** (job-level idempotency) and each CSV row a **`client_row_id`**. **`SessionImportKey`** enforces uniqueness on **`(tenantId, clientImportId, clientRowId)`**. On retry, existing keys return the prior **`sessionId`** and mark the row **idempotent** in the API payload. **Validation errors** (missing columns, bad numbers, program not owned by tenant) are returned **per row** without failing the entire batch. **Transactions** wrap individual successful inserts so concurrent retries race on the unique key and converge safely.

**Failure modes handled:** Malformed CSV, unknown program for tenant, position conflicts surfaced from the session layer, and duplicate concurrent creates for the same logical row.

---

## S3 upload flow

**Security:** Pre-signed **PUT** URLs are minted only after authentication; **object keys** are server-generated under **`tenants/{tenantId}/media/`** with a random prefix—clients cannot pick arbitrary keys into another tenant’s namespace. **Expiry** is enforced via env vars with **min/max** clamps. **Pre-signed GET** reuses the same key parsing rules. **Relay** uploads require **`Content-Length`** and validate **`X-Wellspring-S3-Key`** against the tenant prefix so relay cannot become a confused-deputy write into someone else’s prefix. **Audit** rows record presign and relay for traceability.

**Evolution for very large files:** Move to **S3 multipart upload** with a small server-orchestrated state machine (or presigned part URLs), **lifecycle policies** for abandoned uploads, and **bucket policies** mirroring the **`tenants/*`** prefix as defense in depth beyond application checks.

---

## Parts of my code I'm not fully confident in

**Session reorder:** The **`FOR UPDATE`** scan plus two-phase position offsets is correct but **complex**; under very large programs or slow disks, **transaction timeouts** (`P2028` / contention) remain a risk. Mitigations are tuned **`maxWait` / `timeout`**, monitoring, and eventually **lighter reorder strategies** if Postgres proves the bottleneck.

**JWT surface area:** The token carries a **`tenantId`** claim for debugging, but **authorization must keep using the DB-backed `req.tenantId`**; any future shortcut that trusts the claim would be a regression.

**Frontend token storage:** **`localStorage`** is acceptable for a take-home; **XSS** would steal tokens. Production would favor **httpOnly cookies** and a **CSRF** strategy or a **BFF**.

---

## What I would change with two more days

1. **Playwright (or Cypress)** smoke tests for signup → program → session → import.  
2. **Contract tests** that assert stable **`4xx`** JSON envelopes against OpenAPI.  
3. **Operational hardening:** rate limits on auth/import, **CSP** on Next, **email-only** reset delivery.  
4. **Observability:** histograms for reorder/import latency and a **correlation id** propagated to audit metadata for bulk jobs.

---

## How I used AI (brief alignment)

The assessment mandates **AI tools** and evidence. I used assistants for **scaffolding, tests, and refactors**, then **manually verified** tenant rules, migrations, and audit semantics—precisely what the brief evaluates: **directing AI**, **rejecting unsafe shortcuts**, and keeping **architecture coherent** across generated chunks. Raw threads are under **`/ai-history`** without sanitization, as requested.

---

## Deliverables checklist (submission)

Per the brief: **public repo** with **README** (setup, run, test, seed), **`.env.example`**, scripts equivalent to **`dev` / `test` / `db:migrate` / `db:seed`**, **`/ai-history`**, **`docs/CODE_SUMMARY.md`**, **`docs/ARCHITECTURE_REVIEW.md`**, and a **Loom** URL at the **top of the README** before submit. This review and [`CODE_SUMMARY.md`](CODE_SUMMARY.md) exist for items (3)–(4); item (5) is on the author to record and paste the link.

---

## Closing

The codebase is deliberately **boring where it matters**: **Prisma migrations only**, **tenant id in repository predicates**, **JSON logs** with correlation fields, and **explicit cross-tenant tests** reviewers can grep. The remaining risk is mostly **operational** (email, object lifecycle, abuse) rather than the **core isolation story** the take-home emphasizes.
