# Programs end-to-end QA prompt (copy-paste)

Use this document as instructions for a human tester, API client, or AI agent. Substitute concrete values for placeholders and record pass/fail against the master checklist in §13.

**API reference:** OpenAPI is registered in [`backend/src/openapi/openapiDocument.ts`](../backend/src/openapi/openapiDocument.ts). Routes mount in [`backend/src/app.ts`](../backend/src/app.ts).

---

## Preconditions

- API base URL: `BASE_URL` (e.g. `http://localhost:4000`).
- PostgreSQL available; process env includes valid `DATABASE_URL` and `JWT_SECRET`.
- Optional: `ENABLE_API_DOCS=1` (or per [`backend/.env.example`](../backend/.env.example)) so Swagger UI is available at `{BASE_URL}/api-docs` and `GET {BASE_URL}/openapi.json` returns the spec.
- Use **unique emails per run**, e.g. `prog-e2e-{uuid}@example.com`, to avoid accidental **409** conflicts.

---

## 1. Variables

| Symbol | Meaning |
|--------|---------|
| `BASE_URL` | API origin, no trailing slash |
| `PASSWORD` | Signup/login password: **8–128 chars** ([`auth/schemas.ts`](../backend/src/modules/auth/schemas.ts)) |
| `EMAIL_A`, `EMAIL_B` | Two distinct creator emails |
| `CREATOR_A_ID`, `CREATOR_B_ID` | From signup responses (`data.creator.id`) |
| `TOKEN_A`, `TOKEN_B` | JWT strings (`data.accessToken`) |
| `PROGRAM_ID` | Primary program under creator A for CRUD |
| `PROGRAM_ID_2` | Second program if needed for ordering checks |
| `PROGRAM_CASCADE_ID` | Dedicated program for optional session cascade (§8) |
| `SESSION_ID` | Session created under `PROGRAM_CASCADE_ID` |
| `NONEXISTENT_PROGRAM_ID` | Random string unlikely to exist (e.g. `clxxxxxxxxxxxxxxxxxxxxxxxxx` style id); must not match any row |

**Headers:** authenticated calls use `Authorization: Bearer <token>` unless noted.

---

## 2. Auth — breadth beyond signup

Execute in order; capture status codes and bodies.

1. **Signup creator A** — `POST {BASE_URL}/api/auth/signup`  
   Body: `{ "email": EMAIL_A, "password": PASSWORD }`  
   Expect **201**. Body shape: `{ "success": true, "data": { "accessToken": string, "creator": { "id", "email", ... } } }`.  
   Save `TOKEN_A`, `CREATOR_A_ID`.

2. **Signup creator B** — same with `EMAIL_B`.  
   Expect **201**; save `TOKEN_B`, `CREATOR_B_ID`.

3. **Duplicate signup** — repeat step 1 with **same** `EMAIL_A`.  
   Expect **409**, body includes `error.code` **`email_taken`** and message **Email already registered** ([`auth.service.ts`](../backend/src/modules/auth/auth.service.ts)). Structured error with `success: false`, `requestId`.

4. **Login success** — `POST {BASE_URL}/api/auth/login`  
   Body: `{ "email": EMAIL_A, "password": PASSWORD }`  
   Expect **200** with same envelope pattern including `accessToken` (shape aligned with signup).

5. **Login failure** — `POST {BASE_URL}/api/auth/login`  
   Body: `{ "email": EMAIL_A, "password": "WrongPass999!" }`  
   Expect **401** structured error.

6. **GET /api/auth/me** — `Authorization: Bearer TOKEN_A`  
   Expect **200** with creator identity.

7. **GET /api/auth/me** — no `Authorization` header (or invalid token).  
   Expect **401**.

8. **Protected route, no auth** — `GET {BASE_URL}/v1/programs` with **no** Bearer header.  
   Expect **401** (`Missing bearer token` / `unauthorized`).

9. **Malformed Bearer** — `GET {BASE_URL}/v1/programs` with `Authorization: Bearer ` (empty token) or missing `Bearer ` prefix.  
   Expect **401** per [`authenticate.ts`](../backend/src/middleware/authenticate.ts).

---

## 3. Programs — happy-path CRUD (`TOKEN_A`)

Use `TOKEN_A` throughout.

| # | Method | Path | Body | Expect |
|---|--------|------|------|--------|
| 1 | GET | `/v1/programs` | — | **200** `{ "programs": [ ... ] }` |
| 2 | POST | `/v1/programs` | `{ "title": "QA Program", "description": "desc" }` | **201** single **Program** object (fields include `id`, `tenantId`, `title`, `description`, `createdAt`, `updatedAt`). Save as `PROGRAM_ID`. |
| 3 | GET | `/v1/programs/{PROGRAM_ID}` | — | **200** same program |
| 4 | PATCH | `/v1/programs/{PROGRAM_ID}` | `{ "title": "QA Program Updated" }` | **200** updated program |
| 5 | GET | `/v1/programs` | — | **200**; list contains `PROGRAM_ID`; programs are **only** for this tenant (`tenantId` equals `CREATOR_A_ID`). Order: **`createdAt` descending** ([`programs/repository.ts`](../backend/src/modules/programs/repository.ts)). |

Leave **DELETE** for §6 after validation/isolation checks if you want one continuous program id; or use a **second** program `PROGRAM_ID_2` for delete-twice semantics only.

---

## 4. Programs — validation and edge cases

Constraints from [`programs/schemas.ts`](../backend/src/modules/programs/schemas.ts):

| Case | Request | Expect |
|------|-----------|--------|
| Missing title | `POST /v1/programs` `{}` or omit `title` | **400** `validation_error` |
| Empty title | `POST /v1/programs` `{ "title": "" }` | **400** |
| Title too long | `POST /v1/programs` `{ "title": "<501 chars>" }` | **400** (max **500**) |
| Description too long | `POST /v1/programs` `{ "title": "t", "description": "<5001 chars>" }` | **400** (max **5000**) |
| PATCH empty | `PATCH /v1/programs/{PROGRAM_ID}` `{}` | **400** (refine: at least one of `title`, `description`) |
| PATCH null description | `PATCH /v1/programs/{PROGRAM_ID}` `{ "description": null }` | **200** (clears description when valid on its own); if refine requires another field in some edge build, combine with `"title": "..."`. |
| Unknown id | `GET /v1/programs/{NONEXISTENT_PROGRAM_ID}` | **404** `not_found`, message like “Program not found” |

**Error envelope** ([`errorHandler.ts`](../backend/src/middleware/errorHandler.ts)):

```json
{
  "success": false,
  "error": { "code": "not_found", "message": "Program not found" },
  "requestId": "<uuid>"
}
```

Assert **`requestId`** is present on **4xx** JSON errors.

---

## 5. Tenant isolation — strict parity

1. Ensure creator **A** owns a program `victimId` (use `PROGRAM_ID` from §3).

2. With **`TOKEN_B`**, call:
   - `GET /v1/programs/{victimId}` → **404**
   - `PATCH /v1/programs/{victimId}` with `{ "title": "stolen" }` → **404**
   - `DELETE /v1/programs/{victimId}` → **404**

3. Compare JSON body (excluding `requestId` value) to **GET** `/v1/programs/{NONEXISTENT_PROGRAM_ID}` with **`TOKEN_A`**: same **`error.code`** and same **class** of message (no wording that reveals cross-tenant vs missing).

4. `GET /v1/programs` with **`TOKEN_B`**: `programs` array **must not** contain `victimId`.

5. **Audit isolation:** After creator A has produced audit rows (`program.*`), `GET {BASE_URL}/v1/audit` with **`TOKEN_B`** must **not** return rows whose `tenantId` or program-related `targetId` belongs to creator A ([`audit/service.ts`](../backend/src/modules/audit/service.ts) scopes by JWT tenant).

---

## 6. Delete semantics

Using **`TOKEN_A`** and an existing `PROGRAM_ID` (create a fresh program if you already deleted the main one):

1. `DELETE /v1/programs/{PROGRAM_ID}` → **204** empty body.
2. Repeat `DELETE /v1/programs/{PROGRAM_ID}` → **404** `not_found`.

---

## 7. Audit log — programs and filters

Program write actions use **past-tense** strings ([`programs/service.ts`](../backend/src/modules/programs/service.ts)):

- `program.created`
- `program.updated`
- `program.deleted`

Steps:

1. Create/update/delete programs as **A** so each action fires at least once (use dedicated titles to grep mentally).

2. `GET {BASE_URL}/v1/audit` with **`TOKEN_A`** → **200** `{ "auditLogs": [ ... ] }`.

3. `GET {BASE_URL}/v1/audit?action=program.created` — every row’s `action` is **`program.created`** ([`audit/schemas.ts`](../backend/src/modules/audit/schemas.ts)).

4. **Date filters:** `GET /v1/audit?from=<ISO>&to=<ISO>` — strings must parse as dates ([`audit/service.ts`](../backend/src/modules/audit/service.ts)); invalid dates → **400** `Invalid from date` / `Invalid to date`. Narrow `from`/`to` around “now” and confirm rows fall in range (allow small clock skew).

5. Spot-check fields: `actorId`, `targetType` (`program`), `targetId`, `createdAt`.

---

## 8. Optional [P2] — Sessions cascade

Schema: `Session` → `Program` **onDelete: Cascade** ([`schema.prisma`](../backend/src/prisma/schema.prisma)).

1. `POST {BASE_URL}/v1/programs` → save **`PROGRAM_CASCADE_ID`**.

2. `POST {BASE_URL}/v1/sessions` with **`TOKEN_A`** — body per [`createSessionBodySchema`](../backend/src/modules/sessions/schemas.ts), e.g.:

   ```json
   {
     "programId": "<PROGRAM_CASCADE_ID>",
     "title": "Cascade session",
     "durationSeconds": 120,
     "instructorName": "QA Coach",
     "tags": []
   }
   ```

   Expect **201**; save **`SESSION_ID`** from response.

3. `DELETE {BASE_URL}/v1/programs/{PROGRAM_CASCADE_ID}` → **204**.

4. `GET {BASE_URL}/v1/sessions/{SESSION_ID}` with **`TOKEN_A`** → **404** (“Session not found”), proving cascade removed the session.

Skip this section for a minimal **P1** run.

---

## 9. Request tracing / error contract

For each **4xx** JSON response sampled above, verify:

- `success === false`
- `error.code` and `error.message` present
- **`requestId`** present for correlation with JSON logs (`request_id` in Pino lines).

Optional: locate the same id in server logs.

---

## 10. Swagger / OpenAPI parity (optional)

If docs enabled: open `{BASE_URL}/api-docs`, **Authorize** with `TOKEN_A`, execute **GET** `/v1/programs` and confirm it matches §3. Tags should include **Programs** as in OpenAPI.

---

## 11. Cleanup

**API-first**

- For every program id created in this run (including `PROGRAM_CASCADE_ID` if §8 ran), call **`DELETE /v1/programs/{id}`** with the **owning** creator’s Bearer token. Idempotent: second delete returns **404**.

**No HTTP delete for creators** — optional DB cleanup:

- Use Prisma Studio from `backend/`:  
  `pnpm exec prisma studio --schema src/prisma/schema.prisma`  
  Or SQL against your DB.

**Cascade note:** `Creator` deletion cascades to `Program`, `AuditLog`, and related rows per [`schema.prisma`](../backend/src/prisma/schema.prisma). Deleting test **Creator** rows for `EMAIL_A` / `EMAIL_B` removes leftover programs and audit logs if API cleanup missed something. Order for manual SQL (if not deleting creators): delete tenant-owned **sessions** only if needed; usually deleting **programs** first is enough before removing creators.

Mirror integration teardown spirit: [`programs-cross-tenant.test.ts`](../backend/tests/programs-cross-tenant.test.ts) deletes the fixture program then creators.

---

## 12. Optional — forged `tenantId` in JSON body

`POST /v1/programs` with body:

```json
{
  "title": "Forged tenant test",
  "tenantId": "<CREATOR_B_ID>"
}
```

Zod strips unknown keys; **`tenantId` in body must not override JWT.** Assert response program’s `tenantId` equals **`CREATOR_A_ID`** (owner of `TOKEN_A`), not B.

---

## 13. Master pass/fail checklist

| # | Scenario | Pass criteria |
|---|-----------|-----------------|
| A1 | Signup A/B | **201**, tokens + creator ids stored |
| A2 | Duplicate signup | **409** |
| A3 | Login ok / bad password | **200** / **401** |
| A4 | GET `/api/auth/me` ok / no auth | **200** / **401** |
| A5 | GET `/v1/programs` no Bearer | **401** |
| P1 | List programs | **200** `{ programs }`, tenant-scoped, `createdAt` desc |
| P2 | Create / Get / Patch program | **201** / **200** / **200** |
| P3 | Validation matrix (§4) | Expected **400**/**404** |
| P4 | Tenant B GET/PATCH/DELETE A’s id | All **404**, parity with unknown id |
| P5 | B’s list lacks A’s program | Pass |
| P6 | Audit isolation B vs A | B cannot see A’s audit rows |
| P7 | Delete then delete again | **204** then **404** |
| P8 | Audit rows actions | `program.created`, `program.updated`, `program.deleted` |
| P9 | Audit `?action=` & `from`/`to` | Filters behave; invalid dates **400** |
| P10 | Error envelope | `requestId` on sampled errors |
| O1 | [P2] Session cascade | Session **404** after program delete |
| O2 | Swagger (optional) | Authorized GET works |
| O3 | Forged `tenantId` (optional) | Response `tenantId` is JWT tenant |
| C1 | Cleanup | Programs deleted via API; optional creator DB cleanup |

---

*Generated from the Programs QA plan; align with code when schemas change.*
