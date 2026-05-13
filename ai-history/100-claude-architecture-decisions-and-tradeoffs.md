# 01 — Architecture Decisions & Deliberate Tradeoffs

**Source:** Claude.ai  
**Chat URL:** https://claude.ai/chat/06e6d3c8-1174-4b51-85ed-987f5e3291bc  
**Date:** 2026-05-12  
**Why this is included:** Shows how I decomposed the problem, made deliberate tradeoffs (Turborepo, shared packages, test scope), and pushed back on suggestions that weren't right for the context.

---

## Deciding against Turborepo

**H:** so using turborepo here is not right a choice

**A:** Correct. For this assessment, Turborepo would be overkill because:
- No shared packages — backend and frontend don't share code that needs to be built together
- No CI optimization needed — it's a take-home, not a production pipeline
- Setup cost — you'd burn an hour configuring workspaces for zero practical benefit

**Why I accepted this:** I had initially considered Turborepo because I've used it in monorepos before. But when I actually thought about the dependency graph here — frontend just calls the backend over HTTP, there's nothing to link at build time — Turborepo solved a problem I didn't have. This was a case where AI confirmed my second thought was right.

---

## Deciding against `packages/shared`

**H:** packages/shared? or what

**A:** For this assessment — skip it. The only thing you could share is TypeScript types, but:
- Frontend will use its own API response types anyway
- Not worth the setup time
- Adds complexity to explain in your Loom

**Why I accepted this:** Same logic — I asked because it felt like "the right thing to do," but when pressed, there was no actual shared artifact that needed it. A new hire reading the code shouldn't have to understand a build pipeline to understand the app.

---

## Testing scope decision

**H:** for testing what do we plan

**A:** For this assessment, keep it focused. The assessment explicitly says they grep for tenant isolation test names. So these are non-negotiable:

```
'rejects cross-tenant program access'
'rejects cross-tenant session access'
'rejects cross-tenant audit log access'
'does not duplicate rows on retried import with same client ID'
```

**What to skip:** Frontend tests, unit tests for every function, 100% coverage.

**Why I accepted this and the judgment behind it:** The assessment explicitly says "at least three tests with names like X — we grep for these." That's a signal they want intentional, named tests that prove you understood the requirement — not coverage for its own sake. I wrote exactly those tests and no more. A candidate who writes 50 tests but doesn't name them correctly would fail this check.

---

## Final project structure decided

```
wellspring/
├── backend/
│   ├── src/
│   └── tests/      ← tests live here, not at root
├── frontend/
│   └── src/
├── docs/
├── ai-history/
├── README.md
└── .env.example
```

pnpm chosen over npm — faster installs, stricter about phantom dependencies, no good reason to use npm for a new project in 2026.
