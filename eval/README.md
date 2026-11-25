# Guidebook evaluation

`pnpm eval:guidebook` runs the guidebook agent on every entry in `guidebooks.json` and prints how
many judging criteria it found with the right name and page (PRD §8.1, §17). The proposal reports
that percentage.

## Add a guidebook

1. Pick a guidebook for **university students** with a judging criteria section, from the
   organiser's own site. Check that it is a text PDF.
2. Add an entry to `guidebooks.json`: `id`, `name`, `category`, `source` (where the answer comes
   from) and every judging criterion with its weight (`null` when the guidebook gives none).
   - Seeded competitions keep the PDF in the repo: `pdf` points at
     `supabase/seed/guidebooks/<slug>/`.
   - Every other guidebook stays out of the repo (third-party files, often with committee phone
     numbers): set `url` to the organiser's link, `sha256` to the file's hash
     (`shasum -a 256 file.pdf`) and `pdf` to `eval/pdfs/<id>.pdf`. The script downloads it there
     once; `eval/pdfs/` is gitignored. If the organiser replaces the file, the hash check stops the
     run so the answers can be checked again.
3. `pages` are PDF page indexes as the agent sees them (`=== PAGE n ===`), not the printed page
   numbers. If a criterion's row runs over two pages, list both. Write names as printed, typos
   included, and note anything odd (weights that don't add up to 100%) in `source`.

The PRD asks for 5 to 10 guidebooks. `pnpm test` checks the schema, the count and that every
repo PDF exists.

## Run

```bash
pnpm eval:guidebook                              # needs GEMINI_API_KEY or OPENROUTER_API_KEY
pnpm eval:guidebook --only unsika-nic-2026       # one guidebook
pnpm eval:guidebook --save eval/runs/<date>      # keep each extraction
pnpm eval:guidebook --saved eval/runs/<date>     # score kept extractions again, no LLM
```

## Results

| Date | Model | Guidebooks | Criteria correct |
| --- | --- | --- | --- |
| 2026-11-25 | `google/gemini-3.8-flash` through OpenRouter | 6 | 54/65 (83.1%) |

Per guidebook on 2026-11-25 (`eval/runs/2026-11-25`): STACK 2026 17/17, Generative AI Hackathon
4/4, NDAC EPSILON 2025 9/9, ITC 2021 11/12, IBTSC BPC 2025 4/4, NIC Pekan IT 2026 9/19.

What it missed:

- **NIC Pekan IT 2026:** found both preliminary tables (UI/UX and Software Development) but
  neither final table, so 10 criteria are missing. STACK's semifinal and final were found, so the
  agent doesn't always skip later rounds.
- **ITC 2021:** returned "Pengimplemetasian produk" for the printed "Pengimplemetasi produk". The
  scorer counts that as not found; it doesn't stem words.

No criterion was found on the wrong page.
