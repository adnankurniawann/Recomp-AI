# Contributing to Recomp AI

Every change is judged by one question: does the core flow (sign in, team, ranking, invite,
contacts) still work without errors? Functionality and Reliability is 30% of the Final Day score.

Before you start: [CONTEXT.md](CONTEXT.md) for the words, [docs/PRD.md](docs/PRD.md) for what to
build (read only your section, the map is in [AGENTS.md](AGENTS.md)), [TODO.md](TODO.md) for what's
yours today, [docs/design-system.md](docs/design-system.md) for anything on screen.

## Setting up

You need Node.js 20+, pnpm, Docker and the Supabase CLI.

```sh
pnpm install
cp .env.example .env.local
pnpm supabase start              # prints the local URL and keys for .env.local
pnpm db:reset                    # migrations + seed.sql
pnpm seed:profiles && pnpm seed:content
pnpm dev
```

Ask Malik for the cloud Supabase and Vercel access. Never paste keys into chat groups, issues or
commits; share them through the password manager the team agreed on.

## Branches

| Branch | What it holds | Who merges |
| --- | --- | --- |
| `main` | Releases only: `v0.1.0` (Nov 24), the semifinal version, the Final Day version. Deployed to production | Malik, through a PR from `develop` |
| `develop` | Everything that's done. Deployed to staging | Anyone, through a reviewed PR |
| `feat/*`, `fix/*`, `docs/*`, `chore/*` | One issue each, branched from `develop` | |
| `hotfix/*` | An urgent fix to a release, branched from `main` | Malik, then `main` is merged back into `develop` the same day |

Name: `<type>/<feature-id>-<short-description>`, for example `feat/rnk-01-ranking-tab` or
`fix/inv-03-double-accept`. Why: [ADR 0009](docs/adr/0009-develop-branch-and-feature-slices.md).

```sh
git switch develop && git pull
git switch -c feat/rnk-01-ranking-tab
# work, commit
git push -u origin feat/rnk-01-ranking-tab
gh pr create --base develop
```

## Commits and pull requests

- Commits are short Conventional Commits in English: `feat(ranking): add score badge`,
  `fix(invite): lock role row on accept`.
- One issue, one pull request into `develop`, ideally under 400 changed lines. Squash-merged.
- Follow [the PR template](.github/pull_request_template.md): what changed, the feature ID, how to
  test it, the checklist, a screenshot for anything on screen.
- **No `Co-Authored-By`, session links or AI attribution in commits or PRs.** If an AI tool helped
  materially, add it to the AI disclosure table in the README instead (STACK rule).
- Review: the lead of the area reviews (backend: Malik or Dhanes, frontend: Alek, AI and data:
  Adnan). Your own area: anyone. CI must be green.
- After merge: tick the item in `TODO.md` and update the feature table in `README.md` once it works
  on staging.

## Working in parallel

Work is split by whole features, not by layer, so nobody waits on one person
([PRD §20.2](docs/PRD.md#202-peran)).

- **Contracts first (H0).** Before feature work starts: the first migration and generated types
  (Malik), `lib/matching/types.ts` and UI fixtures (Adnan), Zod schemas in `lib/validation`
  (Dhanes), tokens and base components (Alek).
- **Build UI on fixtures** until the server action exists, then swap the import. Don't block on a
  teammate's PR.
- **Changing a contract** (a migration, a shared type, a Zod schema, a component's props) needs a
  heads-up in the group before the PR, because other branches depend on it.
- **Pull `develop` every morning** and rebase your branch before opening a PR.

## Daily rules

- Stand-up at 09.00, 10 minutes: what you finished, what's next, what's blocking you.
- Merge into `develop` by 21.00. After that, bug fixes only.
- Stuck on a P0 issue for more than 2 hours: say so in the group and ask for help.
- If a day ends with a P0 unfinished, the next day's P1 work waits.

## Tests

- `pnpm lint && pnpm typecheck && pnpm test` must pass before you open a PR. CI runs the same.
- Unit tests are required for changes in `lib/matching`, `lib/ai/schemas` and `lib/format`.
- Touching `supabase/` or the core flow: run the database integration tests and
  `pnpm test:e2e` locally before merging (PRD §16).

## Data and privacy

- No real personal data in commits, seed files, screenshots or issues. Use simulated profiles.
- `.env*` files stay out of git, except `.env.example`.
- Guidebook PDFs are linked to their official source, not committed.
- Real mentors appear only with written permission, photo included.

## Final Day

Issues labelled `final-day` stay untouched until Final Day
([ADR 0007](docs/adr/0007-three-tasks-left-for-final-day.md)).
