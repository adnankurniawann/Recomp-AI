# 6. AI features degrade without a key

Status: accepted (2026-11-19)

## Context

Gemini quotas and model names change, and a demo can't depend on a live LLM call (risk table,
PRD §23). The core flow must run without errors on Final Day.

## Decision

- With `GEMINI_API_KEY` empty, extraction opens the manual role form with the category template,
  the recruiter agent uses the F-INV-01 message template, and case studies show "Feedback AI belum
  aktif".
- With `DEMO_MODE=true`, extraction uses the saved result for each competition and never calls the
  LLM. Playwright runs in this mode.
- Extraction results are cached per competition; the same guidebook is never processed twice.
- AI calls are rate-limited to 10 per user per hour, counted from `agent_actions`.

## Consequences

- The app always works, with or without AI.
- Someone must keep a reviewed extraction for every seeded competition, so demo mode has data.
