# AI history (Wellspring / Breakthrough take-home)

This folder satisfies [`docs/REQUIREMENTS.md`](../docs/REQUIREMENTS.md) **§2 AI Fluency**: **complete**, minimally edited AI session evidence, ordered for review.

## Tools used

**Cursor** — Agent / Composer sessions for this repo (raw `.jsonl` under `~/.cursor/.../agent-transcripts`, synced here).

**Claude.ai** — A small set of planning, debugging, and review threads **outside** the IDE, exported to markdown and added here as **`100`–`104`** (see table). No ChatGPT or other vendors.

## Files (chronological prefix `NN-`)

| NN | File(s) | Approx. focus |
|----|---------|----------------|
| 01 | [`01-cursor-agent-transcript-3899ec73.jsonl`](./01-cursor-agent-transcript-3899ec73.jsonl), [`01-cursor-agent-chat-export-3899ec73.md`](./01-cursor-agent-chat-export-3899ec73.md) | Take-home brief intake, initial requirements alignment |
| 02 | [`02-breakthrough-wellspring-plan.md`](./02-breakthrough-wellspring-plan.md) | Exported Cursor **plan** artifact (scope, phases, rubric) |
| 03 | [`03-e2e-implementation-2026-05-12.md`](./03-e2e-implementation-2026-05-12.md) | Short human index note for the implementation push (see also `05`–`08` transcripts) |
| 04 | [`04-cursor-agent-transcript-a29f67f8.jsonl`](./04-cursor-agent-transcript-a29f67f8.jsonl), [`04-cursor-agent-chat-export-a29f67f8.md`](./04-cursor-agent-chat-export-a29f67f8.md) | Monorepo layout, stack, architecture discussion |
| 05 | [`05-cursor-agent-transcript-ff98f02e.jsonl`](./05-cursor-agent-transcript-ff98f02e.jsonl), [`05-cursor-agent-chat-export-ff98f02e.md`](./05-cursor-agent-chat-export-ff98f02e.md) | Plan all modules and features |
| 06 | [`06-cursor-agent-transcript-8ff536db.jsonl`](./06-cursor-agent-transcript-8ff536db.jsonl), [`06-cursor-agent-chat-export-8ff536db.md`](./06-cursor-agent-chat-export-8ff536db.md) | Auth module planning |
| 07 | [`07-cursor-agent-transcript-28d7767b.jsonl`](./07-cursor-agent-transcript-28d7767b.jsonl), [`07-cursor-agent-chat-export-28d7767b.md`](./07-cursor-agent-chat-export-28d7767b.md) | Schema design + Prisma |
| 08 | [`08-cursor-agent-transcript-60848efb.jsonl`](./08-cursor-agent-transcript-60848efb.jsonl), [`08-cursor-agent-chat-export-60848efb.md`](./08-cursor-agent-chat-export-60848efb.md) | Swagger / API docs + Bruno testing plan |
| 09 | [`09-cursor-agent-transcript-8cf676c5.jsonl`](./09-cursor-agent-transcript-8cf676c5.jsonl), [`09-cursor-agent-chat-export-8cf676c5.md`](./09-cursor-agent-chat-export-8cf676c5.md) | `ai-history` completeness vs requirements (this batch) |
| 10 | [`10-cursor-agent-transcript-463e5d90.jsonl`](./10-cursor-agent-transcript-463e5d90.jsonl), [`10-cursor-agent-chat-export-463e5d90.md`](./10-cursor-agent-chat-export-463e5d90.md) | Programs module planning |
| 11 | [`11-cursor-agent-transcript-ec65e396.jsonl`](./11-cursor-agent-transcript-ec65e396.jsonl), [`11-cursor-agent-chat-export-ec65e396.md`](./11-cursor-agent-chat-export-ec65e396.md); subagents: [`11-1-cursor-agent-subagent-transcript-ecaf8a38.jsonl`](./11-1-cursor-agent-subagent-transcript-ecaf8a38.jsonl), [`11-2-cursor-agent-subagent-transcript-73d03d99.jsonl`](./11-2-cursor-agent-subagent-transcript-73d03d99.jsonl), [`11-3-cursor-agent-subagent-transcript-058e0566.jsonl`](./11-3-cursor-agent-subagent-transcript-058e0566.jsonl) (and matching `*-chat-export-*.md`) | Build out Auth module |
| 12 | [`12-cursor-agent-transcript-81ccc327.jsonl`](./12-cursor-agent-transcript-81ccc327.jsonl), [`12-cursor-agent-chat-export-81ccc327.md`](./12-cursor-agent-chat-export-81ccc327.md); subagent: [`12-1-cursor-agent-subagent-transcript-f8db9767.jsonl`](./12-1-cursor-agent-subagent-transcript-f8db9767.jsonl) (and matching `*-chat-export-*.md`) | Programs module verification pass |
| 13 | [`13-cursor-agent-transcript-75041a1f.jsonl`](./13-cursor-agent-transcript-75041a1f.jsonl), [`13-cursor-agent-chat-export-75041a1f.md`](./13-cursor-agent-chat-export-75041a1f.md); subagents: [`13-1-cursor-agent-subagent-transcript-3b5d1df7.jsonl`](./13-1-cursor-agent-subagent-transcript-3b5d1df7.jsonl), [`13-2-cursor-agent-subagent-transcript-8c483707.jsonl`](./13-2-cursor-agent-subagent-transcript-8c483707.jsonl) (and matching `*-chat-export-*.md`) | Larger backend work session (multi-module) |
| 14 | [`14-cursor-agent-transcript-37a0e50f.jsonl`](./14-cursor-agent-transcript-37a0e50f.jsonl), [`14-cursor-agent-chat-export-37a0e50f.md`](./14-cursor-agent-chat-export-37a0e50f.md) | Cursor backend conventions/rules work |
| 15 | [`15-cursor-agent-transcript-4e36a5a5.jsonl`](./15-cursor-agent-transcript-4e36a5a5.jsonl), [`15-cursor-agent-chat-export-4e36a5a5.md`](./15-cursor-agent-chat-export-4e36a5a5.md) | Follow-up session (short) |
| 16 | [`16-cursor-agent-transcript-1a88e3bb.jsonl`](./16-cursor-agent-transcript-1a88e3bb.jsonl), [`16-cursor-agent-chat-export-1a88e3bb.md`](./16-cursor-agent-chat-export-1a88e3bb.md) | Seed script status check |
| 17 | [`17-cursor-agent-transcript-6bf0688e.jsonl`](./17-cursor-agent-transcript-6bf0688e.jsonl), [`17-cursor-agent-chat-export-6bf0688e.md`](./17-cursor-agent-chat-export-6bf0688e.md) | README + `.env.example` review |
| 18 | [`18-cursor-agent-transcript-4475439c.jsonl`](./18-cursor-agent-transcript-4475439c.jsonl), [`18-cursor-agent-chat-export-4475439c.md`](./18-cursor-agent-chat-export-4475439c.md) | Frontend Cursor rules (`frontend.mdc`) |
| 19 | [`19-cursor-agent-transcript-68cf74da.jsonl`](./19-cursor-agent-transcript-68cf74da.jsonl), [`19-cursor-agent-chat-export-68cf74da.md`](./19-cursor-agent-chat-export-68cf74da.md) | Frontend coverage inventory |
| 20 | [`20-cursor-agent-transcript-241ddb3c.jsonl`](./20-cursor-agent-transcript-241ddb3c.jsonl), [`20-cursor-agent-chat-export-241ddb3c.md`](./20-cursor-agent-chat-export-241ddb3c.md) | Frontend layered architecture alignment |
| 21 | [`21-cursor-agent-transcript-dc37ad1e.jsonl`](./21-cursor-agent-transcript-dc37ad1e.jsonl), [`21-cursor-agent-chat-export-dc37ad1e.md`](./21-cursor-agent-chat-export-dc37ad1e.md) | Auth frontend pages/screens |
| 22 | [`22-cursor-agent-transcript-838e9474.jsonl`](./22-cursor-agent-transcript-838e9474.jsonl), [`22-cursor-agent-chat-export-838e9474.md`](./22-cursor-agent-chat-export-838e9474.md) | Programs UI — end-to-end plan (post-login landing) |
| 39 | [`39-cursor-agent-transcript-b86c6515.jsonl`](./39-cursor-agent-transcript-b86c6515.jsonl), [`39-cursor-agent-chat-export-b86c6515.md`](./39-cursor-agent-chat-export-b86c6515.md) | Product walkthrough (non-technical refresher) |
| 40 | [`40-cursor-agent-transcript-bd829b4f.jsonl`](./40-cursor-agent-transcript-bd829b4f.jsonl), [`40-cursor-agent-chat-export-bd829b4f.md`](./40-cursor-agent-chat-export-bd829b4f.md); subagent: [`40-1-cursor-agent-subagent-transcript-b6f98d30.jsonl`](./40-1-cursor-agent-subagent-transcript-b6f98d30.jsonl) (and matching `*-chat-export-*.md`) | S3 integration plan for session media (+ implementation thread) |
| 41 | [`41-cursor-agent-transcript-650fc905.jsonl`](./41-cursor-agent-transcript-650fc905.jsonl), [`41-cursor-agent-chat-export-650fc905.md`](./41-cursor-agent-chat-export-650fc905.md) | Programs / sessions lifecycle flow — verify and fix |
| 42 | [`42-cursor-agent-transcript-1e5e414a.jsonl`](./42-cursor-agent-transcript-1e5e414a.jsonl), [`42-cursor-agent-chat-export-1e5e414a.md`](./42-cursor-agent-chat-export-1e5e414a.md) | Design tokens / design system extraction |
| 43 | [`43-cursor-agent-transcript-94f879b7.jsonl`](./43-cursor-agent-transcript-94f879b7.jsonl), [`43-cursor-agent-chat-export-94f879b7.md`](./43-cursor-agent-chat-export-94f879b7.md) | Debug: `Failed to fetch` / `apiFetch` runtime error |
| 44 | [`44-cursor-agent-transcript-ab114584.jsonl`](./44-cursor-agent-transcript-ab114584.jsonl), [`44-cursor-agent-chat-export-ab114584.md`](./44-cursor-agent-chat-export-ab114584.md) | Edit session navigation flow (return to list on success) |
| 45 | [`45-cursor-agent-transcript-afe90745.jsonl`](./45-cursor-agent-transcript-afe90745.jsonl), [`45-cursor-agent-chat-export-afe90745.md`](./45-cursor-agent-chat-export-afe90745.md) | Verify media upload flow (S3 presigned URL spec) |
| 46 | [`46-cursor-agent-transcript-1ae0001f.jsonl`](./46-cursor-agent-transcript-1ae0001f.jsonl), [`46-cursor-agent-chat-export-1ae0001f.md`](./46-cursor-agent-chat-export-1ae0001f.md) | UI reference images / layout discussion |
| 47 | [`47-cursor-agent-transcript-0a41a87a.jsonl`](./47-cursor-agent-transcript-0a41a87a.jsonl), [`47-cursor-agent-chat-export-0a41a87a.md`](./47-cursor-agent-chat-export-0a41a87a.md) | Bulk import: CSV template download link |
| 48 | [`48-cursor-agent-transcript-433db138.jsonl`](./48-cursor-agent-transcript-433db138.jsonl), [`48-cursor-agent-chat-export-433db138.md`](./48-cursor-agent-chat-export-433db138.md) | Button styles aligned to theme / tokens |
| 49 | [`49-cursor-agent-transcript-54756b4d.jsonl`](./49-cursor-agent-transcript-54756b4d.jsonl), [`49-cursor-agent-chat-export-54756b4d.md`](./49-cursor-agent-chat-export-54756b4d.md) | Session ordering / drag-reorder issue |
| 50 | [`50-cursor-agent-transcript-86cebca4.jsonl`](./50-cursor-agent-transcript-86cebca4.jsonl), [`50-cursor-agent-chat-export-86cebca4.md`](./50-cursor-agent-chat-export-86cebca4.md) | Page / redirect loading UX |
| 51 | [`51-cursor-agent-transcript-202cedcd.jsonl`](./51-cursor-agent-transcript-202cedcd.jsonl), [`51-cursor-agent-chat-export-202cedcd.md`](./51-cursor-agent-chat-export-202cedcd.md) | Audit log UI polish (layout, inputs, date labels) |
| 52 | [`52-cursor-agent-transcript-db3ab4dc.jsonl`](./52-cursor-agent-transcript-db3ab4dc.jsonl), [`52-cursor-agent-chat-export-db3ab4dc.md`](./52-cursor-agent-chat-export-db3ab4dc.md) | Remove Bruno from project |
| 53 | [`53-cursor-agent-transcript-38ac19ad.jsonl`](./53-cursor-agent-transcript-38ac19ad.jsonl), [`53-cursor-agent-chat-export-38ac19ad.md`](./53-cursor-agent-chat-export-38ac19ad.md) | Bulk CSV: real file upload vs requirements |
| 54 | [`54-cursor-agent-transcript-7a58e36a.jsonl`](./54-cursor-agent-transcript-7a58e36a.jsonl), [`54-cursor-agent-chat-export-7a58e36a.md`](./54-cursor-agent-chat-export-7a58e36a.md) | Session list: serial numbers vs drag UX |
| 58 | [`58-cursor-agent-transcript-37d982de.jsonl`](./58-cursor-agent-transcript-37d982de.jsonl), [`58-cursor-agent-chat-export-37d982de.md`](./58-cursor-agent-chat-export-37d982de.md) | Bulk CSV: required columns + rich sample data |
| 59 | [`59-cursor-agent-transcript-2048b769.jsonl`](./59-cursor-agent-transcript-2048b769.jsonl), [`59-cursor-agent-chat-export-2048b769.md`](./59-cursor-agent-chat-export-2048b769.md) | Remove Bruno from docs and Cursor rules |
| 60 | [`60-cursor-agent-transcript-8f6130bc.jsonl`](./60-cursor-agent-transcript-8f6130bc.jsonl), [`60-cursor-agent-chat-export-8f6130bc.md`](./60-cursor-agent-chat-export-8f6130bc.md) | Import UI: clearer labels, form reset |
| 61 | [`61-cursor-agent-transcript-b60b57ba.jsonl`](./61-cursor-agent-transcript-b60b57ba.jsonl), [`61-cursor-agent-chat-export-b60b57ba.md`](./61-cursor-agent-chat-export-b60b57ba.md) | Import results: header styling (no background) |
| 62 | [`62-cursor-agent-transcript-30307d99.jsonl`](./62-cursor-agent-transcript-30307d99.jsonl), [`62-cursor-agent-chat-export-30307d99.md`](./62-cursor-agent-chat-export-30307d99.md) | Audit log: remove “open” column |
| 63 | [`63-cursor-agent-transcript-c75e3f13.jsonl`](./63-cursor-agent-transcript-c75e3f13.jsonl), [`63-cursor-agent-chat-export-c75e3f13.md`](./63-cursor-agent-chat-export-c75e3f13.md) | Import results header / table styling follow-up |
| 64 | [`64-cursor-agent-transcript-234eaf76.jsonl`](./64-cursor-agent-transcript-234eaf76.jsonl), [`64-cursor-agent-chat-export-234eaf76.md`](./64-cursor-agent-chat-export-234eaf76.md) | Explain import columns, client import id, client row id |
| 65 | [`65-cursor-agent-transcript-f6a91f3f.jsonl`](./65-cursor-agent-transcript-f6a91f3f.jsonl), [`65-cursor-agent-chat-export-f6a91f3f.md`](./65-cursor-agent-chat-export-f6a91f3f.md) | Prisma schema / generator verification |
| 66 | [`66-cursor-agent-transcript-64ce8323.jsonl`](./66-cursor-agent-transcript-64ce8323.jsonl), [`66-cursor-agent-chat-export-64ce8323.md`](./66-cursor-agent-chat-export-64ce8323.md) | Import CSV test fixtures — simplify layout |
| 67 | [`67-cursor-agent-transcript-26739c32.jsonl`](./67-cursor-agent-transcript-26739c32.jsonl), [`67-cursor-agent-chat-export-26739c32.md`](./67-cursor-agent-chat-export-26739c32.md) | Clear DB data only (keep schema) |
| 68 | [`68-cursor-agent-transcript-0037d2c4.jsonl`](./68-cursor-agent-transcript-0037d2c4.jsonl), [`68-cursor-agent-chat-export-0037d2c4.md`](./68-cursor-agent-chat-export-0037d2c4.md) | Page load / redirect loader vertical alignment |
| 69 | [`69-cursor-agent-transcript-b192cb52.jsonl`](./69-cursor-agent-transcript-b192cb52.jsonl), [`69-cursor-agent-chat-export-b192cb52.md`](./69-cursor-agent-chat-export-b192cb52.md) | Seed script vs tightened schema verification |
| 70 | [`70-cursor-agent-transcript-31f2bcd2.jsonl`](./70-cursor-agent-transcript-31f2bcd2.jsonl), [`70-cursor-agent-chat-export-31f2bcd2.md`](./70-cursor-agent-chat-export-31f2bcd2.md) | Import session screen form improvements |
| 71 | [`71-cursor-agent-transcript-f5467281.jsonl`](./71-cursor-agent-transcript-f5467281.jsonl), [`71-cursor-agent-chat-export-f5467281.md`](./71-cursor-agent-chat-export-f5467281.md) | Bulk import results: error detail display |
| 72 | [`72-cursor-agent-transcript-cce2d7dd.jsonl`](./72-cursor-agent-transcript-cce2d7dd.jsonl), [`72-cursor-agent-chat-export-cce2d7dd.md`](./72-cursor-agent-chat-export-cce2d7dd.md) | Audit log: Actor column — show or hide |
| 73 | [`73-cursor-agent-transcript-253244d7.jsonl`](./73-cursor-agent-transcript-253244d7.jsonl), [`73-cursor-agent-chat-export-253244d7.md`](./73-cursor-agent-chat-export-253244d7.md) | Session ordering: rapid reorder / server errors |
| 74 | [`74-cursor-agent-transcript-753c7b31.jsonl`](./74-cursor-agent-transcript-753c7b31.jsonl), [`74-cursor-agent-chat-export-753c7b31.md`](./74-cursor-agent-chat-export-753c7b31.md) | Session detail 404, media link, list drag polish |
| 79 | [`79-cursor-agent-transcript-b1163fe5.jsonl`](./79-cursor-agent-transcript-b1163fe5.jsonl), [`79-cursor-agent-chat-export-b1163fe5.md`](./79-cursor-agent-chat-export-b1163fe5.md) | README update near feature-complete |
| 80 | [`80-cursor-agent-transcript-7fa0ba25.jsonl`](./80-cursor-agent-transcript-7fa0ba25.jsonl), [`80-cursor-agent-chat-export-7fa0ba25.md`](./80-cursor-agent-chat-export-7fa0ba25.md) | Simplify `.env` / `.env.example` comments |
| 81 | [`81-cursor-agent-transcript-ce2c0cce.jsonl`](./81-cursor-agent-transcript-ce2c0cce.jsonl), [`81-cursor-agent-chat-export-ce2c0cce.md`](./81-cursor-agent-chat-export-ce2c0cce.md) | Session CSV import performance review |
| 82 | [`82-cursor-agent-transcript-d85032b4.jsonl`](./82-cursor-agent-transcript-d85032b4.jsonl), [`82-cursor-agent-chat-export-d85032b4.md`](./82-cursor-agent-chat-export-d85032b4.md) | Session list spacing / reorder hint copy |
| 83 | [`83-cursor-agent-transcript-8e43e2fc.jsonl`](./83-cursor-agent-transcript-8e43e2fc.jsonl), [`83-cursor-agent-chat-export-8e43e2fc.md`](./83-cursor-agent-chat-export-8e43e2fc.md) | Session delete: React “update while rendering” error |
| 84 | [`84-cursor-agent-transcript-474a952c.jsonl`](./84-cursor-agent-transcript-474a952c.jsonl), [`84-cursor-agent-chat-export-474a952c.md`](./84-cursor-agent-chat-export-474a952c.md) | Session edit: replace control when no media |
| 85 | [`85-cursor-agent-transcript-a6655c1d.jsonl`](./85-cursor-agent-transcript-a6655c1d.jsonl), [`85-cursor-agent-chat-export-a6655c1d.md`](./85-cursor-agent-chat-export-a6655c1d.md) | S3 object URL access / presigned GET |
| 86 | [`86-cursor-agent-transcript-4a5a4b86.jsonl`](./86-cursor-agent-transcript-4a5a4b86.jsonl), [`86-cursor-agent-chat-export-4a5a4b86.md`](./86-cursor-agent-chat-export-4a5a4b86.md) | New session: position conflict + duplicate error UI |
| 87 | [`87-cursor-agent-transcript-1ff76e2c.jsonl`](./87-cursor-agent-transcript-1ff76e2c.jsonl), [`87-cursor-agent-chat-export-1ff76e2c.md`](./87-cursor-agent-chat-export-1ff76e2c.md) | README completeness review |
| 88 | [`88-cursor-agent-transcript-ee67ca65.jsonl`](./88-cursor-agent-transcript-ee67ca65.jsonl), [`88-cursor-agent-chat-export-ee67ca65.md`](./88-cursor-agent-chat-export-ee67ca65.md) | Frontend `.mdc` glob pattern warning |
| 89 | [`89-cursor-agent-transcript-f19d6b89.jsonl`](./89-cursor-agent-transcript-f19d6b89.jsonl), [`89-cursor-agent-chat-export-f19d6b89.md`](./89-cursor-agent-chat-export-f19d6b89.md) | Codebase vs architecture / rules compliance check |
| 91 | [`91-cursor-agent-transcript-8d698a08.jsonl`](./91-cursor-agent-transcript-8d698a08.jsonl), [`91-cursor-agent-chat-export-8d698a08.md`](./91-cursor-agent-chat-export-8d698a08.md) | Create develop → main PR and merge |
| 92 | [`92-cursor-agent-transcript-39ee7fa1.jsonl`](./92-cursor-agent-transcript-39ee7fa1.jsonl), [`92-cursor-agent-chat-export-39ee7fa1.md`](./92-cursor-agent-chat-export-39ee7fa1.md) | Plan backend deploy to Railway |
| 93 | [`93-cursor-agent-transcript-33f1a5f0.jsonl`](./93-cursor-agent-transcript-33f1a5f0.jsonl), [`93-cursor-agent-chat-export-33f1a5f0.md`](./93-cursor-agent-chat-export-33f1a5f0.md) | Railway build / healthcheck failure; `PASSWORD_RESET_DEBUG_LOG` enum vs `false` |
| 94 | [`94-cursor-agent-transcript-95e60330.jsonl`](./94-cursor-agent-transcript-95e60330.jsonl), [`94-cursor-agent-chat-export-95e60330.md`](./94-cursor-agent-chat-export-95e60330.md) | Admin UI responsiveness audit and fixes |
| 95 | [`95-cursor-agent-transcript-50ea0c98.jsonl`](./95-cursor-agent-transcript-50ea0c98.jsonl), [`95-cursor-agent-chat-export-50ea0c98.md`](./95-cursor-agent-chat-export-50ea0c98.md) | Vercel deployment wiring, env vars, public URLs in README |
| 96 | [`96-cursor-agent-transcript-5c521f1d.jsonl`](./96-cursor-agent-transcript-5c521f1d.jsonl), [`96-cursor-agent-chat-export-5c521f1d.md`](./96-cursor-agent-chat-export-5c521f1d.md) | Seed data: drop broken media, more realistic demo copy |
| 97 | [`97-cursor-agent-transcript-1f32fc2d.jsonl`](./97-cursor-agent-transcript-1f32fc2d.jsonl), [`97-cursor-agent-chat-export-1f32fc2d.md`](./97-cursor-agent-chat-export-1f32fc2d.md) | Post-deploy README pass; demo credentials question |
| 98 | [`98-cursor-agent-transcript-c2a78989.jsonl`](./98-cursor-agent-transcript-c2a78989.jsonl), [`98-cursor-agent-chat-export-c2a78989.md`](./98-cursor-agent-chat-export-c2a78989.md) | Organize `.env` / `.env.example`, credential-rotation follow-up |
| 99 | [`99-cursor-agent-transcript-66bad203.jsonl`](./99-cursor-agent-transcript-66bad203.jsonl), [`99-cursor-agent-chat-export-66bad203.md`](./99-cursor-agent-chat-export-66bad203.md) | Sync new/updated agent transcripts into `ai-history` |
| 100 | [`100-claude-architecture-decisions-and-tradeoffs.md`](./100-claude-architecture-decisions-and-tradeoffs.md) | Claude.ai — architecture tradeoffs (Turborepo, shared packages, test scope) |
| 101 | [`101-claude-s3-region-bug-debugging.md`](./101-claude-s3-region-bug-debugging.md) | Claude.ai — S3 region / presign upload debugging |
| 102 | [`102-claude-schema-review-accepted-and-questioned.md`](./102-claude-schema-review-accepted-and-questioned.md) | Claude.ai — Prisma schema review (accepted vs pushed back) |
| 103 | [`103-claude-import-flow-and-requirements-crosscheck.md`](./103-claude-import-flow-and-requirements-crosscheck.md) | Claude.ai — CSV import flow vs requirements cross-check |
| 104 | [`104-claude-ui-reviews-and-product-judgment.md`](./104-claude-ui-reviews-and-product-judgment.md) | Claude.ai — UI review, product judgment, presigned GET follow-up |

_Numbers like `23`–`26`, **`55`–`57`**, **`75`–`78`**, and **`90`** may be used by **ad-hoc** markdown exports in this folder; **`100`+** is reserved for **non-Cursor** exports (e.g. Claude.ai markdown). New Cursor agent JSONL transcripts use the **next free** prefix (e.g. **`39`+**, **`58`+**, **`79`+**, **`91`+**) so filenames never collide. Run `python3 ai-history/sync_agent_transcripts.py` to pull from Cursor._

## Raw vs Markdown

- **`.jsonl`** — Copied from `~/.cursor/projects/Users-subhan-Work-wellspring-subhan-ahmed/agent-transcripts/<id>/<id>.jsonl`. One JSON object per line; authoritative **raw** export for agentic sessions.
- **`NN-*-subagent-*.jsonl`** — Additional raw transcripts emitted by Cursor subagents invoked during a parent run.
- **`*-chat-export-*.md`** — Same turns rendered for readability (user/assistant text + tool JSON). Regenerate after syncing JSONL:

  ```bash
  cd ai-history && python3 render_jsonl_to_md.py
  ```

To **pull new or updated** JSONL from Cursor’s local store and regenerate Markdown in one step:

  ```bash
  python3 ai-history/sync_agent_transcripts.py
  ```

## Redaction / privacy

Some assistant lines contain a literal `[REDACTED]` placeholder where internal/system content was stripped by the export pipeline (not post-edited reasoning). No credentials are stored in this folder.

## Keeping this folder current

When you finish new Agent work in this workspace, run `python3 ai-history/sync_agent_transcripts.py` (or manually copy new `*.jsonl`, run `render_jsonl_to_md.py`, and extend this table).

Do not rewrite chats to sound polished; the brief asks for **honest iteration**.
