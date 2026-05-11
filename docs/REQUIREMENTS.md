# Breakthrough — Full-Stack Engineer Take-Home Assessment

**Product codename:** Wellspring  

This document captures the official take-home requirements (moved from the assessment brief for easier reading and validation in-repo).

---

## Welcome

Thanks for your interest in joining Breakthrough. This take-home is the first stage of our process. It should take around **48 hours** to complete. Candidates should scope thoughtfully and ship a polished version of what they can within that window. **Clarity, execution, and decision-making** matter more than completeness.

The exercise is designed around how engineering works in 2026 — **with AI as a core part of your toolkit**. The goal is not to test whether you can type code; it is to test how you **think**, **direct AI**, and **ship production-grade software**.

---

## AI-Driven Development (Mandatory)

You **must** use AI tools (Cursor, Claude Code, GitHub Copilot, Claude.ai, ChatGPT, Windsurf — your choice) throughout this assessment. **Submissions without AI usage evidence will not be reviewed.**

Evaluators look for:

- How well you **direct AI** — prompts, context-setting, decomposition of problems, and the systems you use to ship production code.
- How critically you **review AI output** — what you accepted, rejected, and fixed.
- How **coherent your architecture** is across many AI-generated pieces.
- How **honest your self-review** is about what you do not fully understand or are not proud of.

The senior skill being hired for is **judgment over an AI-augmented codebase**, not raw coding speed. A candidate who ships **70% of the scope with deep understanding** will beat one who ships **100% of generated slop**.

Reviewers will read chat logs, spot copy-paste code that does not fit, and may ask about it in the next round. **Be intentional.**

---

## What You’ll Build — Wellspring

A **multi-tenant content management platform** for wellness creators. This mirrors what Breakthrough runs in production.

### Domain

- **Creators are tenants.** Each creator has their own branded space and **their own admin login**.
- **Programs** belong to creators (e.g. “30-Day Sleep Reset”, “Beginner Yoga Foundations”) — a structured course of **sessions**.
- **Sessions** belong to programs. Audio or video. Fields include **title**, **duration**, **ordered position**, **instructor name**, **tags**, and a **media file URL**.
- **Audit log** — every **admin write** action by a creator is logged with **actor**, **action**, **target entity**, and **timestamp**.

### Backend (Node.js + Express + TypeScript + PostgreSQL)

Admin-facing API (**auth via JWT** — creators logging into the Admin Panel):

- **Auth:** signup, login, password reset  
- **CRUD** for programs and sessions  
- **Drag-reorder** sessions within a program  
- **Bulk CSV import** of sessions with **row-level validation feedback**  
- **Idempotent bulk import** — a retried import with the same **client-provided ID** must **not** duplicate rows  
- Request a **pre-signed S3 upload URL** for session media (audio/video)  
- **Audit log** with filters by **date range** and **action type**

### Admin Panel (Next.js)

**Functional UI** — pixel-perfect design is not graded. Tailwind or plain HTML is fine.

**Required screens:**

- Creator **signup** and **login**  
- **Program** list, create, edit  
- **Session** list with **drag-reorder**  
- **Session** create/edit, including **media upload** via the **S3 pre-signed URL** flow  
- **Bulk CSV upload** with validation feedback (**which rows failed and why**)  
- **Audit log** viewer with filters by **date** and **action type**

---

## Non-Negotiable Quality Bars

| Requirement | Detail |
|-------------|--------|
| **Tenant isolation** | Enforced at the **data layer**, not only in controllers. Reviewers will try to **forge `tenant_id`** to read another creator’s data. |
| **Idempotent bulk imports** | Duplicate requests with the same **client-side ID** must **not** double-write. |
| **Tenant isolation tests** | At least **three** tests whose names resemble **`rejects cross-tenant program access`**. Reviewers **grep** for these. |
| **Structured JSON logs** | **`tenant_id`** and **`request_id`** on **every** log line. |
| **Migrations** | Schema changes go through **migration files**, not ad-hoc SQL at startup. |
| **Secure S3 upload** | Pre-signed URLs **scoped**, **time-limited**, and tied to the **requesting tenant**. |

---

## Required Deliverables

Missing any item below **disqualifies** the submission.

### 1. Code (Public GitHub Repo)

Create a **public** GitHub repo and email the link to **rutul@breakthroughapps.io**. Include:

- **`README.md`** — setup, run, test, and seed instructions  
- **`.env.example`**  
- **Scripts:** the brief asks for **`dev`**, **`test`**, **`db:migrate`**, **`db:seed`** (commonly via **`npm`** at the repo root; **this repo** uses **pnpm** with **separate `backend/` and `frontend/` packages** — document the equivalent commands in the README).  
- **Seed** — **2 creators**, **3 programs** each, **~10 sessions** per program (enough to demonstrate functionality).

### 2. AI Fluency (`/ai-history` in the repo)

Export **complete** AI sessions from the tools you used. **Do not curate or clean.**

- Cursor / Windsurf: export chat threads as markdown  
- Claude.ai / ChatGPT: share links or export to PDF/MD  
- Claude Code / agentic tools: include session transcripts  

If you used **multiple** tools, include them all. Organize **chronologically** with brief filenames (e.g. `01-initial-schema-design.md`, `02-tenant-isolation-debugging.md`).

Reviewers look for: prompt quality, where you **pushed back**, task decomposition, handling AI mistakes, what you accepted as-is (and why), and what you **rejected or rewrote** (and why).

**Do not** edit chats to look polished. Real iteration is preferred; an overly polished submission may get deeper scrutiny.

### 3. `docs/CODE_SUMMARY.md`

Module-by-module summary. For each major module (e.g. `auth/`, `tenants/`, `programs/`, `sessions/`, `uploads/`, `audit/`), write **3–6 sentences** on:

- What it does  
- Key design choice  
- Anything non-obvious for use or extension  

Write it for a **new hire on day 1**.

### 4. `docs/ARCHITECTURE_REVIEW.md`

**~1000 words.** Honest self-review is high-signal; performative confidence is easy to spot.

Suggested structure:

- What you built and what you skipped — and why  
- **Tenant isolation** strategy (row-level filter, schema-per-tenant, etc.) and why; what changes at **100** creators? **10,000**?  
- **Bulk import** design — idempotency model, failure modes handled  
- **S3 upload** flow — security, tenant scoping, evolving for very large files  
- Parts of the code you are **not** fully confident in  
- What you would change with **two more days**

### 5. Loom Walkthrough (5–7 minutes)

Recorded video covering:

- Quick **demo** of the running app (~1 min)  
- **Schema** walk-through and **tenant isolation** in code (~2 min)  
- How you **used AI** to build this (~1–2 min)  
- **One thing** you’d do differently (~1 min)  

**Submissions without a Loom will not be reviewed.** Put the **Loom URL at the top of `README.md`**.

---

## Submission

Email the **public GitHub repo** link to **rutul@breakthroughapps.io** with subject:

`Take-home submission — [Your Name]`

If anything is unclear, email **rutul@breakthroughapps.io** before you start. Clarifying questions are welcome and do not count against you.

---

*— The Breakthrough Engineering Team*
