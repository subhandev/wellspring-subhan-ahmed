# 04 — Import Flow Design & Requirements Cross-Check

**Source:** Claude.ai  
**Chat URL:** https://claude.ai/chat/91df8f17-aa33-4c62-a82e-db0eb29e2e76  
**Date:** 2026-05-13  
**Why this is included:** Shows I actively verified requirement coverage rather than assuming I'd built everything. Also captures a specific correction on what "bulk CSV upload" means (file upload, not textarea).

---

## Import flow design (confirming idempotency model)

**H:** how does import flow work end to end

**A:** [Full end-to-end breakdown]

The idempotency mechanism:
1. Client provides a `clientImportId` (UUID they generate)
2. Before processing, backend checks `SessionImportKey` table for `(tenantId, clientImportId)` match
3. If found → return cached result, no re-processing
4. If not → process, write rows, save outcome to `SessionImportKey`
5. Retry with same ID → hits step 3, gets back original result

**The guarantee in plain terms:** if the network drops after the server writes but before the client gets the response, the creator retries with the same client ID → gets back the original result → no duplicate sessions.

The `@@unique([tenantId, clientImportId, clientRowId])` constraint on `SessionImportKey` is the DB-level enforcement. Application code uses `upsert`, not `create`, so a race condition on simultaneous retries still can't produce duplicates.

**Why I accepted this model:** The DB constraint is the real guarantee — application-level idempotency checks are vulnerable to race conditions. Having the constraint means even if two requests arrive simultaneously, one will get a unique violation and fail gracefully rather than double-writing.

---

## Requirement cross-check

After the import flow discussion, I asked Claude to cross-check all requirements against what I'd built.

**H:** can you cross the requirements that this is what required?

**A:** [Generated a full interactive checklist across all backend API, frontend screens, non-negotiable quality bars, and 5 deliverables]

Key gaps surfaced from this check:

1. **Structured JSON logs** — I had logging set up but hadn't confirmed `request_id` was on every line. Fixed: added `requestId` to the Winston middleware so it's injected on every log entry for a request lifecycle.

2. **Migration files** — confirmed migrations were in place and not ad-hoc SQL. ✅

3. **Tenant isolation tests named exactly right** — confirmed test names matched the grep pattern. ✅

**Why this step mattered:** Without explicitly running through the checklist, I'd likely have shipped without `request_id` in logs. That's the kind of detail that's easy to miss when you're in building mode.

---

## Correction: bulk import requires actual file upload, not textarea

**H:** One question — it should be upload bulk csv import not just csv content to add to a textarea, this page requires actual upload?

**A:** Yes, **actual file upload** — not a textarea where you paste CSV text.

- `<input type="file" accept=".csv">` on the frontend
- User selects a `.csv` file from their machine
- Frontend sends it as `multipart/form-data` using `FormData`
- Backend parses with `multer` + `csv-parse`

**What happened here:** An earlier version of the import UI used a textarea for pasting CSV content. It technically parsed fine, but it's not what "CSV upload" means in a real product. I caught this by re-reading the spec carefully. The UI was updated to a proper file input.

**Why this matters for the assessment:** The assessment says they built this to mirror what they actually run at Breakthrough. A textarea is a prototype shortcut — a file input is the production pattern. The distinction matters.
