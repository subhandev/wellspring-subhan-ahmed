# AI history (Wellspring / Breakthrough take-home)

This folder satisfies [`docs/REQUIREMENTS.md`](../docs/REQUIREMENTS.md) **§2 AI Fluency**: **complete**, minimally edited AI session evidence, ordered for review.

## Tools used

**Cursor only** (Agent / Composer sessions for this repo). No Claude.ai, ChatGPT, or other vendors were used for this submission.

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

## Raw vs Markdown

- **`.jsonl`** — Copied from `~/.cursor/projects/Users-subhan-Work-wellspring-subhan-ahmed/agent-transcripts/<id>/<id>.jsonl`. One JSON object per line; authoritative **raw** export for agentic sessions.
- **`*-chat-export-*.md`** — Same turns rendered for readability (user/assistant text + tool JSON). Regenerate after syncing JSONL:

  ```bash
  cd ai-history && python3 render_jsonl_to_md.py
  ```

## Redaction / privacy

Some assistant lines contain a literal `[REDACTED]` placeholder where internal/system content was stripped by the export pipeline (not post-edited reasoning). No credentials are stored in this folder.

## Keeping this folder current

When you finish new Agent work in this workspace, copy any new `*.jsonl` from the `agent-transcripts` directory above, assign the next `NN-` prefix, run `render_jsonl_to_md.py`, and extend this table.

Do not rewrite chats to sound polished; the brief asks for **honest iteration**.
