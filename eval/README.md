# Guidebook evaluation

`pnpm eval:guidebook` runs the guidebook agent on every entry in `guidebooks.json` and prints how
many judging criteria it found with the right name and page (PRD §8.1, §17). The proposal reports
that percentage.

## Add a guidebook

1. Put the PDF in the repo (for seeded competitions: `supabase/seed/guidebooks/<slug>/`).
2. Add an entry to `guidebooks.json`: `id`, `name`, `pdf` path, `category`, `source` (where the
   answer comes from), and every judging criterion with its weight.
3. `pages` are PDF page indexes as the agent sees them (`=== PAGE n ===`), not the printed page
   numbers. If a criterion's row runs over two pages, list both.

The PRD asks for 5 to 10 guidebooks. `pnpm test` checks that the file matches the schema and that
every PDF exists.

## Run

```bash
pnpm eval:guidebook                              # needs GEMINI_API_KEY or OPENROUTER_API_KEY
pnpm eval:guidebook --save eval/runs/<date>      # keep each extraction
pnpm eval:guidebook --saved eval/runs/<date>     # score kept extractions again, no LLM
```
