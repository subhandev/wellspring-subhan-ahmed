# Import CSV row errors — hide Prisma internals

Date: 2026-05-13

- **Issue:** Bulk session import catch used `Error.message` for `processRow` failures, so Prisma P2002 surfaced as long `Invalid tx.session.create() invocation…` strings in the Import UI.
- **Change:** Added `backend/src/lib/sessionPositionConflict.ts` with `errorsForSessionImportCatch()` — maps `P2002` on `(programId, position)` to the same user copy as HTTP `position_conflict`, other Prisma codes to short generic row messages; `import/service.ts` uses it in the per-row catch.
- **DRY:** `sessions.service.ts` imports `SESSION_POSITION_CONFLICT_USER_MESSAGE` from that lib instead of a local string.
