# Recomp AI

**One AI platform for competition teams, from matching to mentoring.** Built for STACK 2026
(Case 1: Smarter Campus and Learning) by Team Cumlaude.

A team leader picks a competition. An AI agent reads the official guidebook and proposes the roles
the team needs, each with the page it came from. For every empty role, Recomp AI ranks the
students who marked that competition as interesting, with a score an algorithm computes (not an
AI) and the reasons behind it. The leader invites; contacts open only after both sides agree.
Teams then prepare through short courses and paid mentor sessions (simulated).

> **Status: semifinal build.** The core flow runs end to end on `main` with seed data
> (`tests/e2e/core-flow.spec.ts`). Recomp AI runs on a local setup, not a public deployment: the
> STACK handbook accepts "a reachable deployment or reliable local setup", and [Setup](#setup)
> below is ours. "Done" means it works on that setup. The specification is
> [docs/PRD.md](docs/PRD.md) and the work plan is [TODO.md](TODO.md).

## Demo

- Live: no public deployment. Run it locally with [Setup](#setup), about 10 minutes the first time
- Demo accounts: sign up with any email and password on `/masuk`. Local Supabase skips email
  confirmation, so the account works at once. To open `/admin`, see
  [Make yourself an admin](#make-yourself-an-admin)
- Simulated data: profiles, mentors and payments marked "Simulasi" are fictional

## Features

| Feature | PRD | Status |
| --- | --- | --- |
| Google sign-in and profile onboarding | F-FND-02, F-PRF-01..07 | Done: `/masuk`, four-step onboarding, `/profil` with portfolio covers, public profile `/u/[username]` without contacts, with the match panel when opened from a team |
| Competition list, detail and "Tertarik" | F-CMP-01..03 | Done: `/lomba`, `/lomba/[slug]` with the guidebook summary tab, "Tertarik" |
| Competition admin and guidebook upload | F-CMP-04 | Done: `/admin/lomba` (add and edit competitions, guidebook PDF upload, "Jalankan ekstraksi", review and approve the extraction) |
| Guidebook extraction and suggested roles | F-GBA-01..04 | Done: the guidebook agent with skill mapping and a cache per competition, "Jalankan ekstraksi" and the review in `/admin/lomba`, suggested roles with their page in the `/tim/baru` wizard, templates when there is no extraction |
| Team creation, role editor and team dashboard | F-TEM-01..04 | Done: `/tim/baru` wizard, role editor, `/tim/[id]` dashboard with gap summary and member role moves |
| Explainable candidate ranking per role | F-RNK-01..04 | Done: scoring, reasons, the ranking UI with the profile sheet on the team page, and `GET /api/ranking/[teamRoleId]` with the filters in SQL, "Cocok" / "Kurang cocok" feedback |
| Invitations and contacts that open on accept | F-INV-01..04 | Done: invite dialog, `/undangan` (accept, decline, cancel), atomic accept, and teammates' WhatsApp and email on the team page |
| Recruiter agent drafts (sent only on click) | F-RCR-01..03 | Done: `POST /api/ai/recruit`, editable draft cards with "Kirim" and "Lewati", template fallback, the decline hint and the log in `agent_actions` |
| Course player, quizzes and case-study feedback | F-LRN-01..06 | Done: catalog, course page, lesson player, quizzes with points and progress, promo code and simulated purchase, all 9 lessons of "Persiapan Hackathon", and AI feedback on case studies (`POST /api/ai/case-feedback`, up to 3 tries) |
| Mentors and simulated booking | F-MNT-01..04 | Done: `/mentor` grid with filters, `/mentor/[id]`, simulated booking and checkout, the "Sesi mentor" card with the mentor's contact after payment, and 10 simulated mentors in the seed |
| Notifications and admin | F-NTF-01, F-ADM-01 | Done: the bell with unread count; `/admin/lomba`, `/admin/mentor` (mentors and their services) and `/admin/metrik` with the PRD §17 trial metrics, real and simulated data apart |

### Planned for Final Day

Left on purpose, as the STACK handbook asks ([ADR 0007](docs/adr/0007-three-tasks-left-for-final-day.md)):

1. Applying to a team that is still looking (F-INV-05)
2. Suggesting the next competition for a complete team
3. Mentor ratings and reviews (F-MNT-06)

## Tech stack

Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui, Lucide,
React Hook Form and Zod, TanStack Query, Supabase (Postgres, Auth, Storage, RLS), Gemini through
`@google/genai`, `unpdf`, Vitest, Playwright, pnpm. Supabase runs locally in Docker.
Why: [ADR 0001](docs/adr/0001-nextjs-supabase-gemini-stack.md).

## Setup

### What you need

- Node.js 20 or newer
- pnpm 10 (`corepack enable` installs the version in `package.json`)
- Docker Desktop, running. The first `pnpm supabase start` downloads the Supabase Docker images
  (several GB), so the first run takes a while on a slow connection
- Free ports: 3000 (app) and 54321 to 54327 (Supabase)

The Supabase CLI comes with `pnpm install`; you don't install it separately.

### Steps

```sh
git clone https://github.com/adnankurniawann/Recomp-AI.git
cd Recomp-AI
pnpm install
pnpm supabase start               # starts Postgres, Auth and Storage in Docker
cp .env.example .env.local
pnpm supabase status -o env       # copy three values into .env.local, see below
pnpm db:reset                     # migrations, seed.sql and the STACK 2026 guidebook
pnpm seed:profiles                # 50 simulated students
pnpm seed:content                 # the "Persiapan Hackathon" course
pnpm dev                          # http://localhost:3000
```

From `pnpm supabase status -o env`, set these in `.env.local`:

| `.env.local` | From `supabase status -o env` |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `API_URL` (`http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SERVICE_ROLE_KEY` |

Leave the AI keys empty to run without AI: the guidebook agent, the recruiter and case-study
feedback fall back to saved results and templates. See [Environment variables](#environment-variables).

### Try it

1. Open http://localhost:3000/masuk and sign up with any email and password.
2. Finish the four-step onboarding, then open `/lomba` and pick STACK 2026.
3. Create a team in `/tim/baru`; the ranking tab lists the simulated students for each role.

Other local pages: Supabase Studio at http://127.0.0.1:54323 and the test mailbox at
http://127.0.0.1:54324.

### Make yourself an admin

`/admin/lomba`, `/admin/mentor` and `/admin/metrik` need an admin account. After you sign up, open
Supabase Studio, go to the SQL editor and run this with your email:

```sql
update profiles set app_role = 'admin'
where user_id = (select id from auth.users where email = 'you@example.com');
```

### Stop and reset

```sh
pnpm supabase stop                # stops the containers and keeps the data
pnpm db:reset                     # wipes the database back to the seed, then run both seed scripts again
```

### If something fails

- `Cannot connect to the Docker daemon`: start Docker Desktop and wait until it says it is running.
- `port is already allocated`: another Supabase project is running. Run `pnpm supabase stop
  --all`, or stop whatever holds the port.
- `Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY` from a seed script: `.env.local` is
  missing those values; copy them from `pnpm supabase status -o env`.
- "Lanjutkan dengan Google" fails locally: Google sign-in needs your own OAuth client. Use
  email and password.

## Environment variables

See `.env.example`. Secrets never go in the repository. To call Gemini through OpenRouter instead
of Google, set `OPENROUTER_API_KEY`; it wins over `GEMINI_API_KEY`, and a bare `GEMINI_MODEL` gets
the `google/` prefix. `GEMINI_MODEL` may list several models, comma-separated; when one is busy
(503, 429) or stalls, the next is tried. Empty means `gemini-3.5-flash`, then `gemini-3.5-flash-lite`. Without either key, or with `DEMO_MODE=true`, the app still runs and the AI features fall back to saved results and templates
([ADR 0006](docs/adr/0006-ai-features-degrade-without-a-key.md)).

## Tests

```sh
pnpm lint && pnpm typecheck && pnpm test   # unit tests, also in CI
pnpm test:e2e                              # Playwright on local Supabase: the core flow, 360 px pass
```

## Third-party resources

Libraries listed in `package.json`. Fonts: Inter and JetBrains Mono (SIL Open Font License).
Icons: Lucide (ISC). Competition guidebooks: linked to their official pages, not redistributed.
No illustrations or photos from other sites.

## AI disclosure

| Tool | Role |
| --- | --- |
| Gemini API (directly, or through OpenRouter when `OPENROUTER_API_KEY` is set) | Inside the product: guidebook extraction, invitation drafts, case-study feedback. Candidate scores never use it. Also runs `pnpm eval:guidebook` |
| Claude Code (Anthropic) | During development: drafted the project docs (README, AGENTS, CONTEXT, CONTRIBUTING, TODO, ADRs, design system, PRD v1.2 edits) and the design mock. Drafted Dhanes's H0–H1 code: Zod schemas, `ActionResult`, phone formatting, `Avatar`, `Stepper`, `EmptyState`, `ProgressBar`, profile RLS and SQL functions, the onboarding wizard and `/profil`. Drafted Dhanes's H2–H3 code: the public profile `/u/[username]` (`ProfileSummary`, `HistoryTimeline`, `PortfolioGrid`, `SkillChip`), portfolio cover upload, the database integration tests in `tests/integration`, the invite SQL functions and team-table RLS in `0004_invites.sql`, the invite dialog and `/undangan`. Drafted Dhanes's H4–H5 code: the learning SQL functions in `0005_learning.sql` (`submit_mcq`, progress, promo and simulated purchase), `seed-content.ts` and two lessons of "Persiapan Hackathon", the course unlock card, mentor RLS in `0006_mentor_rls.sql` and `/mentor/[id]`, and the Playwright tests in `tests/e2e`. Drafted Adnan's H0 work: the matching score and reasons in `lib/matching` with their tests, the skill list and role templates in `seed.sql`, the UI fixtures in `lib/fixtures`, and the CI workflow. Drafted Adnan's H1 work: guidebook text extraction in `lib/pdf` and the simulated profile seed in `lib/seed` and `scripts/seed-profiles.ts`. Drafted Adnan's H2 work: the guidebook agent, skill mapping, extraction cache, role suggestions and guidebook summary data in `lib/ai` and `app/api/ai/guidebook`, and the role source labels in `lib/format/role-source.ts`. Drafted the team work Adnan took over from Malik: `create_team` in `0008_create_team.sql`, `createTeam` and the `/tim/baru` wizard, `save_roles` in `0009_save_roles.sql`, the role editor and `/tim/[id]/role`, the team dashboard `/tim/[id]` with the gap logic in `lib/team` and `assign_member_role` in `0010_assign_member_role.sql`, teammate contacts on the dashboard, the mentor grid `/mentor` (`MentorCard`, filters in `lib/mentors/list.ts`) and the simulated mentors in `seed.sql`, mentor booking and the simulated payment (`0011_bookings.sql`, checkout, "Sesi mentor"), the competition admin `/admin/lomba` (competition form, guidebook upload, extraction review), with their integration and Playwright tests. Drafted Alek's H0 work: the base UI components in `components/ui` and the page frames in `components/layout` (`PublicNavbar`, `Footer`, `AppShell`, `Sidebar`, `SearchInput`). Drafted Alek's M2 work: the notification bell, `markNotificationsRead` and `0007_notifications.sql`, the `/belajar` catalog and course page, the lesson player (`LessonShell`, `LessonTopBar`, `QuestionMCQ`, lesson Markdown), the lessons "Struktur pitch deck" and "Demo yang aman", and the responsive pass (44 px touch targets, `tap-target`, the 404 and global error pages). Drafted Alek's H5 work: the match panel on `/u/[username]` (`MatchPanel`, `lib/ranking/role-match.ts`), mentor management in `/admin/mentor` (`save_mentor` in `0016_save_mentor.sql`), the lessons "Menentukan role tim", "Menyusun timeline kerja", "Validasi pengguna", "Menentukan scope MVP" and "Menjawab pertanyaan juri", core-flow steps 3 to 7 in Playwright, the second responsive pass with `tests/e2e/responsive.spec.ts`, and this README update. Drafted Malik's work after the Nov 23 swap: the `ranking_candidates` SQL function in `0012_ranking.sql`, `GET /api/ranking/[teamRoleId]`, `lib/ranking/build.ts` and their tests; the "Cocok" / "Kurang cocok" feedback (`0013_recommendation_feedback.sql`, `submitFeedback`, `CandidateFeedback`); case-study feedback (`lib/ai/case-feedback.ts`, `POST /api/ai/case-feedback`, `record_case_attempt` and RLS on `agent_actions` in `0014_case_feedback.sql`, the answer form and feedback panel in `QuestionCase`); the recruiter agent (`lib/ai/recruiter.ts`, `POST /api/ai/recruit`, `RecruitPanel`, `recordRecruitDecision`, `loadRecruitHint`); the trial metrics page (`trial_metrics()` and `events` in `0015_trial_metrics.sql`, `/admin/metrik`, `lib/admin/metrics.ts`); the guidebook evaluation (`pnpm eval:guidebook`, `lib/ai/eval.ts`, `eval/guidebooks.json` with the STACK 2026 criteria). Drafted Malik's Nov 25 work: the fix for "Muat lagi" skipping candidates after an invite (`lib/ranking/paging.ts` and its tests); the guidebook evaluation on six guidebooks (finding the five new public guidebooks, download by `url` and `sha256` into `eval/pdfs/`, page-aware matching in the scorer, the run in `eval/runs/2026-11-25`). Claude also drafted the hand answers for those five guidebooks from the PDFs; a team member checks them against each PDF before the number goes in the proposal. Drafted and rendered the posters of the seven simulated competitions in `supabase/seed/posters` (SVG turned into WebP, no real event posters or logos). Drafted the proposed logo in `docs/brand` (symbol, full logo, icons) and the brand intro. Rendered the "WINNING HACKATHON?" cover of "Persiapan Hackathon" and added the `cover` field to the course files (`lib/learn/content.ts`), and seeded Adnan's real mentor profile from the photo and role Adnan gave. Drafted the model fallback for Gemini (`lib/ai/fallback.ts`) after the course feedback kept timing out. Drafted the featured-first order on `/lomba` (`lib/competitions/filter.ts`) and placed STACK 2026's official poster, supplied by the team, as its cover. The team reviews them in the pull request before merge |

Every member adds a row or a line here when an AI tool materially helps with their work.

## Known limitations

- No public deployment: the app runs only on the local setup. Google sign-in needs your own Google
  OAuth client, so locally use email and password.
- Light theme only, Indonesian UI only, one campus in the first version.
- Payments and mentors are simulated. Mentor photos, schedule slots and contacts come only from the
  seed; the admin form edits the rest.
- Guidebooks must be text PDFs; scanned PDFs fall back to manual role entry.
- Guidebook accuracy: 54/65 judging criteria (83.1%) with the right name and page on 6 real
  guidebooks (`pnpm eval:guidebook`, [eval/README.md](eval/README.md)). The agent can miss later
  rounds when a guidebook has several branches.
- One course ("Persiapan Hackathon"). Lesson text has no tables.
- On a local production build, the measured LCP on `/` is 0.52 s, but Lighthouse's simulated
  mobile LCP is 2.4 to 2.7 s (target 2.5 s) because it also counts the early Next.js JavaScript.

## Versions

- Starting version for Final Day: not tagged yet
- Final version: not tagged yet
- Final Day changes: not started

## Team and contributions

| Member | GitHub | Role | Main contributions |
| --- | --- | --- | --- |
| Malik Arsyafiandra Madani | [@malikarsya](https://github.com/malikarsya) | Leader, backend | Competition RLS, storage buckets and `seed.sql`, Google and email sign-in with the route middleware, "Tertarik", Gemini through OpenRouter. After the Nov 23 swap: `ranking_candidates` and `GET /api/ranking`, "Cocok" / "Kurang cocok", the recruiter agent, case-study feedback, `/admin/metrik`, `pnpm eval:guidebook`. Still to do: release tags |
| Dhanesworo Muhammad Datiputro | [@dhanesmd3](https://github.com/dhanesmd3) | Backend | Base components, onboarding and `/profil`, the public profile, contact privacy (RLS) with its integration tests, invitations and `/undangan` with the atomic accept, `submit_mcq`, course access and the simulated purchase, `/mentor/[id]`, the first Playwright tests |
| Axeleon Justin Algianto | [@angseleong](https://github.com/angseleong) | Frontend | Design tokens and base components, `AppShell` and `PublicNavbar`, the landing page, `/lomba` and the competition page, the ranking UI and the profile sheet, notifications, `/belajar` and the lesson player, 7 of the 9 lessons, the match panel on public profiles, `/admin/mentor`, core-flow steps 3 to 7, both responsive passes, this README |
| Muhammad Adnan Kurniawan | [@adnankurniawann](https://github.com/adnankurniawann) | AI and data | The matching score and reasons, guidebook text extraction and the guidebook agent, skill mapping and cache, the simulated profile seed and UI fixtures, CI. After the Nov 23 swap: `/tim/baru`, the role editor and the team dashboard, contacts on the team page, `/admin/lomba`, `/mentor` and the simulated booking |

## Docs

- [docs/PRD.md](docs/PRD.md): what to build (Indonesian)
- [TODO.md](TODO.md): who builds what, day by day
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, branches, pull requests
- [CONTEXT.md](CONTEXT.md): the words the project uses
- [docs/design-system.md](docs/design-system.md): how the UI looks
- [docs/adr/](docs/adr/): decisions and why
