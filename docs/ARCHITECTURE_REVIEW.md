# Architecture review

**Target length:** ~1000 words once the implementation is complete. This stub outlines the sections required by the take-home so you can replace placeholders with an honest assessment before submission.

---

## What I built and what I skipped — and why

*(After implementation: summarize shipped scope vs deferred items. Be explicit about trade-offs and timeboxing.)*

---

## Tenant isolation strategy

*(Describe your approach — e.g. row-level `tenant_id` on every tenant-owned table, enforced in Prisma repositories with explicit `tenantId` arguments, never trusting client-supplied tenant identifiers. Explain what would change at **100** vs **10,000** creators: indexing, connection pooling, read replicas, background jobs, etc.)*

---

## Bulk import design

*(How client-provided import IDs map to the database; upsert vs insert; per-row error reporting; retry/idempotency behavior.)*

---

## S3 upload flow

*(Pre-signed URL issuance only after verifying program/session ownership for the authenticated tenant; expiry; key prefix or bucket policy; Content-Type/size limits; how you would handle very large uploads — multipart, direct-to-S3 patterns, virus scanning hooks, etc.)*

---

## Parts of the code I am not fully confident in

*(Name specific modules or decisions. Link to risks and mitigations.)*

---

## What I would change with two more days

*(Prioritized list: tests, UX, observability, performance, security hardening.)*

---

## How I used AI

*(Optional short add-on for the Loom overlap: tools used, what you delegated vs reviewed strictly. The `/ai-history` folder carries the primary evidence.)*
