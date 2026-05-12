# Cursor agent session (Markdown export)

**Source:** `11-2-cursor-agent-subagent-transcript-73d03d99.jsonl` · **conversation id:** `73d03d99`

_This file is rendered from the JSONL transcript next to it: same turns, formatted for reading. The `.jsonl` is the authoritative raw export._

---

## Exchange 1

### User

<user_query>
Read `/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/app.ts`, `/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/schemas.ts`, `/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/auth.controller.ts`, `/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/openapi/openapiDocument.ts`, and other route modules as needed (programs, sessions, uploads, import, audit) plus `/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/middleware/authenticate.ts` public routes.

Produce a single markdown reference for the user covering EVERY mounted HTTP endpoint:
- Method + full path (base URL is arbitrary; use paths like `/api/auth/signup`, `/v1/programs`, etc.)
- Whether Bearer JWT required
- Request body JSON schema / fields (from Zod), query params
- Success response JSON shape with example structure (success wrappers where applicable — auth uses `{ success: true, data }`; errors use `{ success: false, error: { code, message }, requestId }`)
- Typical HTTP status codes per endpoint

Focus on accuracy from current code. Include GET /health, OpenAPI routes, all auth endpoints including forgot/reset with stateless JWT behavior described briefly.

Return the full markdown in your completion message so it can be pasted to the user.
</user_query>

---

## Exchange 2

### Assistant

Gathering mounted routes and auth/public behavior from the codebase.

[REDACTED]

**Tool:** `updateCurrentStep`

```json
{
  "current_step": "Scanning backend routes and schemas",
  "completed_subtitle": "",
  "final_summary": ""
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/app.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/middleware/authenticate.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/auth.controller.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/schemas.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/openapi/openapiDocument.ts"
}
```

### Assistant

Reading route files and controllers to confirm response shapes and status codes.

[REDACTED]

**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/auth.routes.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/programs/routes.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/sessions/routes.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/uploads/routes.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/import/routes.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/audit/routes.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/middleware/errorHandler.ts"
}
```

### Assistant

[REDACTED]

**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/programs/controller.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/programs/schemas.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/sessions/controller.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/sessions/schemas.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/uploads/controller.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/uploads/schemas.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/import/controller.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/import/schemas.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/audit/controller.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/audit/schemas.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/auth.service.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/auth/jwt.ts"
}
```

### Assistant

[REDACTED]

**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/programs/service.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/sessions/service.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/uploads/service.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/import/service.ts",
  "limit": 120
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/audit/service.ts"
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/config/env.ts",
  "limit": 80
}
```

### Assistant

[REDACTED]

**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/modules/import/service.ts",
  "offset": 120
}
```


**Tool:** `Read`

```json
{
  "path": "/Users/subhan/Work/wellspring-subhan-ahmed/backend/src/prisma/schema.prisma",
  "limit": 120
}
```

### Assistant

[REDACTED]

**Tool:** `updateCurrentStep`

```json
{
  "completed_subtitle": "Compiled HTTP endpoint reference",
  "current_step": "",
  "final_summary": "Delivered a paste-ready markdown API reference from `app.ts`, `authenticate.ts`, auth Zod/controllers/services/jwt, and all `/v1/*` route controllers/services, including health/OpenAPI/Swagger, success vs raw JSON bodies, and error envelope behavior."
}
```

### Assistant

Below is a single markdown reference derived from the current backend code (notably `app.ts`, `authenticate.ts`, feature controllers/services, Zod schemas, `errorHandler.ts`, and `jwt.ts` / `auth.service.ts`).

---

# Wellspring backend — HTTP endpoint reference

## Global behavior

**Mount order (Express):** `requestId` → `pino-http` → `express.json()` → **`GET /health`** and **OpenAPI/Swagger or their 404 handlers** → **`createAuthenticateMiddleware`** → domain routers → **`createErrorHandler`**.

**Bearer JWT:** Required for every request that is **not** listed under [Public routes (no Bearer)](#public-routes-no-bearer). The middleware expects `Authorization: Bearer <token>` and verifies an HS256 access JWT, then loads the creator from the DB and sets `req.creatorId`, `req.tenantId` (same as creator id), and `req.creator`.

**Structured errors (via `createErrorHandler`):** On failures that reach the error handler (including `HttpError`), responses are JSON:

```json
{
  "success": false,
  "error": { "code": "<string>", "message": "<string>" },
  "requestId": "<string>"
}
```

**Auth success envelope:** Routes under `/api/auth` that succeed return `{ "success": true, "data": ... }` (see each auth endpoint).

**`/v1/*` resources:** Programs, sessions, uploads, import, and audit return **raw JSON bodies** (no `{ success, data }` wrapper) on success, except where noted.

**Prisma `DateTime` fields** serialize as **ISO 8601 strings** in JSON responses.

**`503` on protected routes:** If `JWT_SECRET` is unset, `authenticate` responds with `auth_misconfigured` before route handlers run.

---

## Public routes (no Bearer)

From `isPublicRoute` in `authenticate.ts` (plus routes registered **before** the middleware in `app.ts`):

| Condition | Paths |
|-----------|--------|
| Always before auth middleware | `GET /health` |
| When `apiDocsEnabled(env)` | `GET /openapi.json`, `GET /api-docs` and any `GET` path starting with `/api-docs` (Swagger UI static/HTML) |
| When docs disabled | `GET /openapi.json` and `GET /api-docs*` return **404** JSON (see below) — still **no Bearer** (handlers are before `authenticate`) |
| Public auth | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` |

All other documented API paths require a valid Bearer access JWT.

---

## System & documentation

### `GET /health`

| | |
|--|--|
| **Bearer** | No |
| **Query / body** | None |
| **Success (200)** | `{ "ok": true }` |
| **Typical errors** | None in code path |

---

### `GET /openapi.json`

| | |
|--|--|
| **Bearer** | No |
| **Query / body** | None |
| **Success (200)** | Full OpenAPI 3.0 document (JSON) when `apiDocsEnabled(env)` is true (`ENABLE_API_DOCS=1` **or** `NODE_ENV !== "production"` by default). |
| **Typical errors** | **404** when docs disabled: `{ "success": false, "error": { "code": "not_found", "message": "API documentation is disabled" }, "requestId": "..." }` |

---

### `GET /api-docs` and `GET /api-docs/*`

| | |
|--|--|
| **Bearer** | No (any `GET` whose path starts with `/api-docs` skips JWT in `authenticate`) |
| **Query / body** | N/A (Swagger UI HTML / assets) |
| **Success** | **200** HTML / static when docs enabled via `swagger-ui-express`. |
| **Typical errors** | **404** JSON (same shape as `/openapi.json` disabled) when docs disabled. |

---

## Auth (`/api/auth`)

Access tokens are HS256 JWTs; payload claims include `sub`, `tenantId` (both the creator id), and `email` (`jwt.ts`).

### Stateless password reset (forgot / reset)

- **`forgot-password`:** If the email exists, returns a **short-lived reset JWT** signed with a secret **derived from `JWT_SECRET` and the user’s current `passwordHash`** (`signPasswordResetToken` / `derivePasswordResetSecret`). **No email is sent.** If the email is unknown, `resetToken` is **`null`** (still **200**). Expiry comes from env **`JWT_RESET_EXPIRES_IN`** (default **`15m`**).
- **`reset-password`:** Verifies the token with the **current** password hash; on success the password is updated (hash rotates), so **old reset tokens become invalid**. Returns a **new access token** like login/signup.

---

### `POST /api/auth/signup`

| | |
|--|--|
| **Bearer** | No |
| **Body (Zod `signupBodySchema`)** | `email`: string, valid email, max 320 · `password`: string, min 8, max 128 |
| **Success (201)** | `{ "success": true, "data": { "accessToken": "<jwt>", "creator": { "id": "<cuid>", "email": "<email>" } } }` |
| **Typical statuses** | **400** `validation_error` (Zod / first field message) · **409** `email_taken` (unique email) · **503** `auth_misconfigured` (no `JWT_SECRET`) |

---

### `POST /api/auth/login`

| | |
|--|--|
| **Bearer** | No |
| **Body (`loginBodySchema`)** | `email` (email, max 320) · `password` (min 1, max 128) |
| **Success (200)** | Same `data` shape as signup: `{ "success": true, "data": { "accessToken", "creator" } }` |
| **Typical statuses** | **400** validation · **401** `invalid_credentials` · **503** `auth_misconfigured` |

---

### `POST /api/auth/forgot-password`

| | |
|--|--|
| **Bearer** | No |
| **Body (`forgotPasswordBodySchema`)** | `email` (email, max 320) |
| **Success (200)** | `{ "success": true, "data": { "resetToken": "<jwt>" | null } }` — `null` if email not found |
| **Typical statuses** | **400** validation · **503** `auth_misconfigured` |

---

### `POST /api/auth/reset-password`

| | |
|--|--|
| **Bearer** | No |
| **Body (`resetPasswordBodySchema`)** | `token`: string, 1–512 · `newPassword`: string, min 8, max 128 |
| **Success (200)** | `{ "success": true, "data": { "accessToken", "creator" } }` (same as login) |
| **Typical statuses** | **400** validation · **401** `invalid_reset_token` (malformed JWT payload, unknown user, bad signature/expiry, or hash mismatch after password change) · **503** `auth_misconfigured` |

---

### `GET /api/auth/me`

| | |
|--|--|
| **Bearer** | **Yes** |
| **Query / body** | None |
| **Success (200)** | `{ "success": true, "data": { "id": "<cuid>", "email": "<email>" } }` |
| **Typical statuses** | **401** `unauthorized` (missing/invalid token from middleware, or handler guard) · **401** `user_not_found` if creator row missing after token verified (implemented as 401, not 404) · **503** `auth_misconfigured` from middleware if `JWT_SECRET` unset |

---

## Programs (`/v1/programs`)

All endpoints: **Bearer required.** Responses are **program object(s)** as stored (Prisma `Program`): `id`, `tenantId`, `title`, `description` (string or `null`), `createdAt`, `updatedAt`.

### `GET /v1/programs`

| | |
|--|--|
| **Query / body** | None |
| **Success (200)** | `{ "programs": [ { ...Program }, ... ] }` |
| **Typical statuses** | **401** / **503** from auth middleware |

---

### `POST /v1/programs`

| | |
|--|--|
| **Body (`createProgramBodySchema`)** | `title`: string, 1–500 · `description`: optional string, max 5000 |
| **Success (201)** | Single `Program` object (not wrapped) |
| **Typical statuses** | **400** `validation_error` · **401** / **503** |

---

### `GET /v1/programs/:id`

| | |
|--|--|
| **Path** | `id`: program id |
| **Success (200)** | One `Program` object |
| **Typical statuses** | **404** `not_found` · **401** / **503** |

---

### `PATCH /v1/programs/:id`

| | |
|--|--|
| **Path** | `id` |
| **Body (`updateProgramBodySchema`)** | At least one of: `title` (1–500, optional) · `description` (max 5000, **nullable**, optional). Zod refine: at least one field present. |
| **Success (200)** | Updated `Program` object |
| **Typical statuses** | **400** validation · **404** `not_found` · **401** / **503** |

---

### `DELETE /v1/programs/:id`

| | |
|--|--|
| **Path** | `id` |
| **Success (204)** | Empty body |
| **Typical statuses** | **404** `not_found` · **401** / **503** |

---

## Sessions (`/v1/sessions`)

Bearer required. Session shape (Prisma): `id`, `tenantId`, `programId`, `title`, `durationSeconds`, `position`, `instructorName`, `tags` (string array), `mediaUrl`, `mediaType`, `createdAt`, `updatedAt`.

### `GET /v1/sessions`

| | |
|--|--|
| **Query** | **`programId`** (required, non-empty string) — must be a program owned by the tenant |
| **Success (200)** | `{ "sessions": [ { ...Session }, ... ] }` (ordered for that program) |
| **Typical statuses** | **400** `validation_error` if `programId` missing · **404** `not_found` if program not in tenant · **401** / **503** |

---

### `POST /v1/sessions/reorder`

| | |
|--|--|
| **Body (`reorderSessionsBodySchema`)** | `programId`: string, min 1 · `orderedSessionIds`: array of strings (min 1), each min length 1 |
| **Success (200)** | `{ "sessions": [ ... ] }` after reorder |
| **Typical statuses** | **400** `validation_error` (Zod, duplicates, wrong count, unknown id) · **404** program · **401** / **503** |

---

### `POST /v1/sessions`

| | |
|--|--|
| **Body (`createSessionBodySchema`)** | `programId` · `title` (1–500) · `durationSeconds` (int, positive, max `86400 * 365`) · `position` (int ≥ 0, optional) · `instructorName` (1–200) · `tags` (array of strings max 100 each, max 50 tags, default `[]`) · `mediaUrl`, `mediaType` (optional, nullable, length caps) |
| **Success (201)** | Created `Session` object |
| **Typical statuses** | **400** validation · **404** program · **401** / **503** |

---

### `GET /v1/sessions/:id`

| | |
|--|--|
| **Path** | `id` |
| **Success (200)** | One `Session` |
| **Typical statuses** | **404** `not_found` · **401** / **503** |

---

### `PATCH /v1/sessions/:id`

| | |
|--|--|
| **Path** | `id` |
| **Body (`updateSessionBodySchema`)** | Any non-empty subset of: `title`, `durationSeconds`, `position`, `instructorName`, `tags`, `mediaUrl`, `mediaType` (refine: at least one key) |
| **Success (200)** | Updated `Session` |
| **Typical statuses** | **400** validation · **404** `not_found` · **401** / **503** |

---

### `DELETE /v1/sessions/:id`

| | |
|--|--|
| **Path** | `id` |
| **Success (204)** | Empty body |
| **Typical statuses** | **404** `not_found` · **401** / **503** |

---

## Uploads (`/v1/uploads`)

### `POST /v1/uploads/presign`

| | |
|--|--|
| **Bearer** | Yes |
| **Body (`presignBodySchema`)** | `fileName`: 1–255 · `contentType`: 1–200 |
| **Success (201)** | `{ "uploadUrl": "<presigned PUT>", "key": "tenants/<tenantId>/media/<uuid>-<safeName>", "bucket": "<string>", "expiresIn": <seconds>, "contentType": "<string>", "publicUrl": "<string>" }` (`PRESIGN_EXPIRES_SECONDS`, default 900) |
| **Typical statuses** | **400** `validation_error` (Zod or content type not `audio/*`, `video/*`, or `image/*`) · **503** `uploads_unconfigured` if S3 env incomplete · **401** / **503** `auth_misconfigured` |

---

## Import (`/v1/import`)

### `POST /v1/import/sessions`

| | |
|--|--|
| **Bearer** | Yes |
| **Body (`importSessionsBodySchema`)** | `clientImportId`: string, 1–200 · `csv`: string, 1–2_000_000 chars (raw CSV text **including header row**) |
| **CSV expectations** | Header row (case-insensitive keys after trim) must include: `client_row_id`, `program_id`, `title`, `duration_seconds`, `instructor_name`. Optional columns used if present: `tags` (pipe/comma-separated), `position`. |
| **Success (200)** | `{ "clientImportId": "<same as request>", "results": [ ... ] }` where each result is either `{ "clientRowId", "ok": true, "sessionId", "idempotent"?: true }` or `{ "clientRowId", "ok": false, "errors": ["...", ...] }`. Per-row failures (e.g. unknown program) stay **200** with `ok: false` rows. |
| **Typical statuses** | **400** `csv_parse_error`, `validation_error` (empty CSV, bad headers, etc.) · **401** / **503** |

---

## Audit (`/v1/audit`)

### `GET /v1/audit`

| | |
|--|--|
| **Bearer** | Yes |
| **Query (Zod `auditQuerySchema`)** | All optional: `from`, `to` (strings, min length 1 if present — parsed as `Date` in service; invalid dates → **400**) · `action` (optional, 1–200) |
| **Success (200)** | `{ "auditLogs": [ { "id", "tenantId", "actorId", "action", "targetType", "targetId", "metadata", "createdAt" }, ... ] }` (max **500**, `createdAt` descending) |
| **Typical statuses** | **400** `validation_error` (bad query / invalid dates) · **401** / **503** |

---

## Quick reference table

| Method | Path | Bearer |
|--------|------|--------|
| GET | `/health` | No |
| GET | `/openapi.json` | No |
| GET | `/api-docs` (+ prefix) | No |
| POST | `/api/auth/signup` | No |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/forgot-password` | No |
| POST | `/api/auth/reset-password` | No |
| GET | `/api/auth/me` | Yes |
| GET | `/v1/programs` | Yes |
| POST | `/v1/programs` | Yes |
| GET | `/v1/programs/:id` | Yes |
| PATCH | `/v1/programs/:id` | Yes |
| DELETE | `/v1/programs/:id` | Yes |
| GET | `/v1/sessions` | Yes |
| POST | `/v1/sessions/reorder` | Yes |
| POST | `/v1/sessions` | Yes |
| GET | `/v1/sessions/:id` | Yes |
| PATCH | `/v1/sessions/:id` | Yes |
| DELETE | `/v1/sessions/:id` | Yes |
| POST | `/v1/uploads/presign` | Yes |
| POST | `/v1/import/sessions` | Yes |
| GET | `/v1/audit` | Yes |

---

**Note:** The machine-readable spec from `GET /openapi.json` is built in `openapi/openapiDocument.ts`. For **`/v1/*` success bodies**, that document sometimes describes the **resource schema alone** while the actual HTTP response may be a **wrapper** (e.g. `{ "programs": [...] }`) or a **raw object**—the tables above follow **the controllers’ real `res.json` shapes**.

[REDACTED]

