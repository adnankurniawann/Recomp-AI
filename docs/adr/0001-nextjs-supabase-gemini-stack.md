# 1. Next.js, Supabase and Gemini

Status: proposed (2026-11-19). Becomes accepted when the whole team agrees in the H0 meeting
(PRD §24, first open question).

## Context

Four students build the product in five days and must keep a deployment judges can open (STACK
rule 7). Data needs row-level privacy for contacts, file storage for guidebooks and posters, and
Google sign-in. The AI part needs structured JSON output on a free tier.

## Decision

- **Next.js 15 App Router, React 19, TypeScript strict** in one repo: UI, server actions and route
  handlers together, deployed on Vercel.
- **Supabase** for Postgres, Auth (Google and email), Storage, RLS and `pg_cron`. Multi-table writes
  are `security definer` SQL functions.
- **Gemini through `@google/genai`**, model set by `GEMINI_MODEL`, JSON through `responseSchema`.
  `unpdf` for PDF text per page.
- **Tailwind v4, shadcn/ui, Lucide** for the UI; **Vitest** and **Playwright** for tests; **pnpm**.

## Consequences

- The team can swap a piece of the stack, but two things stay: the score function stays separate
  from any LLM ([ADR 2](0002-scores-come-from-an-algorithm.md)), and contacts stay protected at the
  database level ([ADR 3](0003-contacts-open-only-through-rls.md)).
- Supabase local needs Docker on every laptop.
- Vercel functions time out, so AI routes set `maxDuration = 60` and the guidebook limit is 60 pages.
