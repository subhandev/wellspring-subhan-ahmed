# 03 — Prisma Schema Review: What I Accepted, What I Questioned

**Source:** Claude.ai  
**Chat URL:** https://claude.ai/chat/75663d05-fcf7-4151-8efe-5d23eeadc0e1  
**Date:** 2026-05-13  
**Why this is included:** I pasted the actual schema for critique, not just for generation. Shows I used AI to verify design decisions rather than to produce code blindly. Also shows a specific case where I questioned an AI suggestion.

---

## Schema submitted for review

I pasted the full Prisma schema and asked for a verification pass against the assessment requirements.

Key design choices I wanted validated:

1. **`tenantId` on `Session`** — I denormalized it (it could be derived via `session → program → tenantId`) but chose to put it directly on Session so every table can be filtered by tenant without joins.

2. **Two relations on `AuditLog`** — `AuditLogActor` and `AuditLogTenant` both reference `Creator.id`. Prisma requires named relations when two fields point at the same model.

3. **`@@unique([tenantId, clientImportId, clientRowId])`** on `SessionImportKey` — idempotency enforced at the DB constraint level, not in application code.

---

## What the review confirmed (accepted)

- ✅ `tenantId` denormalization on Session is correct — enables filtering without joins, matches the "tenant isolation at the data layer" requirement
- ✅ Dual-named AuditLog relations are necessary and correctly named
- ✅ DB-level unique constraint for idempotency is the right approach — upsert, not create
- ✅ `onDelete: Cascade` on owned relations, `onDelete: SetNull` on the optional `sessionId` in `SessionImportKey` — correct
- ✅ Indexes on every `tenantId` column and composite indexes for filter patterns (`tenantId, createdAt`; `tenantId, action`)

---

## One thing I questioned

The initial Cursor-generated schema used an `enum` for `action` on `AuditLog`. I removed it and used `String` with a comment:

```prisma
action     String  // enum candidate: program.created | program.updated | session.created etc.
```

**Why:** Enums in Postgres require a migration to add new values. Since audit action types will expand as the product grows, a string column with application-level validation is more flexible. I asked Claude to confirm this was reasonable:

**H:** I removed the enum for AuditLog action and used String — is that a reasonable tradeoff?

**A:** Yes — enums in Postgres are actually harder to evolve than they look. Adding a new value requires `ALTER TYPE` which can cause issues in zero-downtime deployments. String + a validation layer (zod enum in the service layer) gives you the same safety at write time without the migration friction. Good call.

**Why I accepted:** The reasoning matched what I already thought — I just wanted confirmation before committing to it. This is a case where I used AI to pressure-test my own decision, not to make it for me.

---

## Cursor prompt used to generate the initial schema

```
Design a Prisma schema for "Wellspring" — a multi-tenant content management platform.

Hard rules:
1. tenantId must be denormalized onto Session (not just Program)
2. AuditLog needs two separate Creator relations — named distinctly
3. Idempotency enforced by DB-level unique constraint, not application logic
4. Add indexes on every tenantId column and filter columns
5. onDelete explicit on every relation — Cascade for owned data, SetNull for optional refs
6. No enums — use String with comments marking enum candidates

Output: Full schema.prisma only, with JSDoc comments on each model.
```

I provided all the hard rules upfront rather than letting the AI guess at them — this is why the first-pass output required minimal correction.
