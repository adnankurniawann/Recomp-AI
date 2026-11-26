## Project map

Recomp AI is a Next.js + Supabase web app that helps university students form competition teams
by the roles a competition needs, then prepare through courses and mentors. Built for STACK 2026
by Team Cumlaude. Human docs: `README.md`. What to build: `docs/PRD.md` (Indonesian, the single
source of truth). Setup and rules: `CONTRIBUTING.md`. Words: `CONTEXT.md`.

**Status: planning.** No app code exists yet. `TODO.md` says what is done; don't describe anything
as working until it runs.

Commands (once scaffolded):

- `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`
- `pnpm supabase start`, `pnpm db:reset`, `pnpm seed:profiles`, `pnpm seed:content`
- `pnpm supabase gen types typescript --local > lib/supabase/types.ts` after any migration change
- `pnpm eval:guidebook`

Layout (PRD §11.3): `app/` routes and server actions, `components/ui` base components,
`components/<domain>` product components, `lib/` pure logic (`matching`, `ai`, `pdf`,
`validation`, `format`), `supabase/` migrations and seed, `scripts/`, `content/`, `tests/e2e/`.

### Read only the PRD section you need

The PRD is long. Find your area here and read that section, plus §0 and §1 once.

| Working on | PRD |
| --- | --- |
| Rules from the STACK handbook | §2 |
| Feature IDs and acceptance criteria | §6 (by epic: FND, PRF, CMP, GBA, TEM, RNK, INV, RCR, LRN, MNT, NTF, ADM) |
| Statuses (team, invite, extraction) | §5 |
| Ranking formula and its tests | §7 |
| Gemini prompts and schemas | §8 |
| Design tokens and components | §9, then `docs/design-system.md` |
| Page wireframes | §10 |
| Stack, architecture, routes | §11 |
| Tables, RLS, SQL functions | §12 |
| Server action and API contracts | §13 |
| Security and performance checks | §14 |
| Seed data | §15 |
| Tests | §16 |
| Who does what, day by day | §20, `TODO.md` |
| Git flow, labels, backlog | §21 |

## Domain rules (never break these)

1. Candidate scores are computed in `lib/matching` as pure functions. Never use an LLM to score or
   order candidates ([ADR 0002](docs/adr/0002-scores-come-from-an-algorithm.md)).
2. The score function never reads gender, religion, ethnicity, campus, photo, age or entry year.
3. Contacts (`profile_contacts`, `mentor_contacts`) are readable only through RLS. Never join
   contacts into a public profile query and never use the service role key in code that serves a
   user ([ADR 0003](docs/adr/0003-contacts-open-only-through-rls.md)).
4. `questions.answer_key` never reaches the client. The client reads `questions_public`; answers are
   checked by `submit_mcq`.
5. AI never sends an invite, creates a booking or pays without the user's click
   ([ADR 0004](docs/adr/0004-ai-never-acts-without-a-click.md)).
6. Simulated data and payments carry `is_simulated` and a "Simulasi" badge in the UI
   ([ADR 0005](docs/adr/0005-simulated-data-is-always-labelled.md)).
7. Anything touching several tables at once (accept invite, submit answer, simulated payment) is a
   `security definer` SQL function in `supabase/migrations`.
8. With `GEMINI_API_KEY` empty or `DEMO_MODE=true`, AI features fall back and the app still works
   ([ADR 0006](docs/adr/0006-ai-features-degrade-without-a-key.md)).

## UI rules

- Light theme only. Use the tokens in `app/globals.css` (`docs/design-system.md`); never hardcode a
  colour, radius or shadow.
- Inter for text (400, 500, 600 only), JetBrains Mono for numbers. One filled primary button per
  page. Buttons are 10 px rounded rectangles; chips and badges are pills.
- Logged-in pages use `AppShell` with the sidebar; public pages use `PublicNavbar` (PRD §10.0).
- Every data page has loading (skeleton), empty, error and success (toast) states.
- **Words on screen are Indonesian**, casual but polite. Code, table names, commits and docs are
  English. Use the terms and UI labels in `CONTEXT.md`.
- Never use logos, photos or copy from GDGoC ITB, Google, Skilvul or any reference product. One
  exception the team agreed: STACK 2026's official poster as its competition cover.
- Judge a screen change with `docs/agents/ui-review.md`.

## Code rules

- Server Components read data; Server Actions in `actions.ts` write it, validated with Zod on the
  server.
- A server action returns `{ ok: true, data } | { ok: false, error: { code, message } }`, with an
  Indonesian `message` safe to show.
- AI route handlers live in `app/api/ai/*` with `export const maxDuration = 60`.
- Write unit tests for every change in `lib/matching`, `lib/ai/schemas` and `lib/format`.
- Never write table types by hand; use the generated Supabase types.
- Never change matching weights in code; change the `matching_config` table.

## Git and pull requests

- One long-lived branch, `main`, protected and always deployable. Branch from `main`:
  `<type>/<feature-id>-<short-description>`, for example `feat/rnk-01-ranking-tab`
  ([ADR 0009](docs/adr/0009-main-only-branches-and-feature-slices.md)).
- One issue, one branch, one pull request into `main`, ideally under 400 changed lines,
  squash-merged.
- Commits and PR titles are short Conventional Commits in English: `feat(ranking): add score badge`.
- **No `Co-Authored-By`, session links or other AI attribution in commits or pull requests.** AI use
  is disclosed only in the README's AI disclosure table (PRD §2 rule 4, §21.2).
- Never commit `.env*` other than `.env.example`.
- The PR body follows `.github/pull_request_template.md`. After a feature lands, update the feature
  table in `README.md` and tick `TODO.md`.

## Don't

- Don't work on issues labelled `final-day` before Final Day.
- Don't add features outside `docs/PRD.md` without the team agreeing.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Labels

Priority, area and type labels from PRD §21.3. See `docs/agents/labels.md`.

### Domain docs

Single context: `CONTEXT.md` and `docs/adr/` at the root. See `docs/agents/domain.md`.
