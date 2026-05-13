# New session: empty position + duplicate error text

Date: 2026-05-13

- **Cause:** Optional position used `z.coerce.number()`; empty `<input type="number">` yields `""`, which coerces to **0**, so POST always sent `position: 0` and collided with the first seeded session.
- **Fix:** `z.preprocess` maps `""` / null / undefined to undefined before coerce; omit `position` in JSON → backend `nextPosition()`.
- **Duplicate message:** Top-level `setError(message)` plus `applyServerFieldErrors` + loop over `formState.errors` showed the same string twice. Skip the banner when at least one API `fieldError` maps onto a form field (new + edit session pages).
- **Follow-up:** Removed optional Position from the new-session form entirely; brief requires ordered sessions + drag-reorder, not a create-time position control. API still accepts optional `position` (CSV / integrations); UI relies on append + reorder.
