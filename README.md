# Recomp AI

**One AI platform for competition teams, from matching to mentoring.** Built for STACK 2026
(Case 1: Smarter Campus and Learning) by Team Cumlaude.

A team leader picks a competition. An AI agent reads the official guidebook and proposes the roles
the team needs, each with the page it came from. For every empty role, Recomp AI ranks the
students who marked that competition as interesting, with a score an algorithm computes (not an
AI) and the reasons behind it. The leader invites; contacts open only after both sides agree.
Teams then prepare through short courses and paid mentor sessions (simulated).

> **Status: planning.** Nothing below is built yet. The specification is
> [docs/PRD.md](docs/PRD.md) and the work plan is [TODO.md](TODO.md). This README only claims a
> feature is done once it works in the deployed app.

## Demo

- Live: not deployed yet
- Demo accounts: in the submission notes, never in this repository
- Simulated data: profiles, mentors and payments marked "Simulasi" are fictional

## Features

| Feature | PRD | Status |
| --- | --- | --- |
| Google sign-in and profile onboarding | F-FND-02, F-PRF-01 | Done: `/masuk`, four-step onboarding, `/profil` with portfolio covers, public profile `/u/[username]` without contacts |
| Competition list, detail and "Tertarik" | F-CMP-01..03 | Done: `/lomba`, `/lomba/[slug]` with the guidebook summary tab, "Tertarik" |
| Competition admin and guidebook upload | F-CMP-04 | Done: `/admin/lomba` (add and edit competitions, guidebook PDF upload, "Jalankan ekstraksi", review and approve the extraction) |
| Guidebook extraction and suggested roles | F-GBA-01..04 | In progress: agent, skill mapping and cache work; no screen yet |
| Team creation, role editor and team dashboard | F-TEM-01..04 | Done: `/tim/baru` wizard, role editor, `/tim/[id]` dashboard with gap summary and member role moves |
| Explainable candidate ranking per role | F-RNK-01..04 | In progress: scoring, reasons and the ranking UI with the profile sheet; waits for `GET /api/ranking` (#28) and the team page (#26) |
| Invitations and contacts that open on accept | F-INV-01..04 | Done: invite dialog, `/undangan` (accept, decline, cancel), atomic accept, and teammates' WhatsApp and email on the team page |
| Recruiter agent drafts (sent only on click) | F-RCR-01..03 | Planned |
| Course player, quizzes and case-study feedback | F-LRN-01..06 | In progress: catalog, course page, lesson player, quizzes with points and progress, promo code and simulated purchase, 4 lessons; case-study feedback waits for #40 |
| Mentors and simulated booking | F-MNT-01..04 | Done: `/mentor` grid with filters, `/mentor/[id]`, simulated booking and checkout, the "Sesi mentor" card with the mentor's contact after payment, and 10 simulated mentors in the seed |
| Notifications and admin | F-NTF-01, F-ADM-01 | Planned |

### Planned for Final Day

Left on purpose, as the STACK handbook asks ([ADR 0007](docs/adr/0007-three-tasks-left-for-final-day.md)):

1. Applying to a team that is still looking (F-INV-05)
2. Suggesting the next competition for a complete team
3. Mentor ratings and reviews (F-MNT-06)

## Tech stack

Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui, Lucide,
React Hook Form and Zod, TanStack Query, Supabase (Postgres, Auth, Storage, RLS), Gemini through
`@google/genai`, `unpdf`, Vitest, Playwright, pnpm. Deployed on Vercel and Supabase cloud.
Why: [ADR 0001](docs/adr/0001-nextjs-supabase-gemini-stack.md).

## Setup

You need Node.js 20+, pnpm, Docker (for local Supabase) and the Supabase CLI.

```sh
git clone https://github.com/adnankurniawann/Recomp-AI.git
cd Recomp-AI
pnpm install
cp .env.example .env.local        # fill in values from `pnpm supabase start`
pnpm supabase start
pnpm db:reset
pnpm seed:profiles && pnpm seed:content
pnpm dev                          # http://localhost:3000
```

These commands work once the app is scaffolded (issue #2, H0).

## Environment variables

See `.env.example`. Secrets never go in the repository. To call Gemini through OpenRouter instead
of Google, set `OPENROUTER_API_KEY`; it wins over `GEMINI_API_KEY`, and a bare `GEMINI_MODEL` gets
the `google/` prefix. Without either key, or with `DEMO_MODE=true`, the app still runs and the AI features fall back to saved results and templates
([ADR 0006](docs/adr/0006-ai-features-degrade-without-a-key.md)).

## Tests

```sh
pnpm lint && pnpm typecheck && pnpm test   # unit tests, also in CI
pnpm test:e2e                              # Playwright, core flow on seed data
```

## Third-party resources

Libraries listed in `package.json`. Fonts: Inter and JetBrains Mono (SIL Open Font License).
Icons: Lucide (ISC). Competition guidebooks: linked to their official pages, not redistributed.
No illustrations or photos from other sites.

## AI disclosure

| Tool | Role |
| --- | --- |
| Gemini API | Inside the product: guidebook extraction, invitation drafts, case-study feedback. Candidate scores never use it |
| Claude Code (Anthropic) | During development: drafted the project docs (README, AGENTS, CONTEXT, CONTRIBUTING, TODO, ADRs, design system, PRD v1.2 edits) and the design mock. Drafted Dhanes's H0–H1 code: Zod schemas, `ActionResult`, phone formatting, `Avatar`, `Stepper`, `EmptyState`, `ProgressBar`, profile RLS and SQL functions, the onboarding wizard and `/profil`. Drafted Dhanes's H2–H3 code: the public profile `/u/[username]` (`ProfileSummary`, `HistoryTimeline`, `PortfolioGrid`, `SkillChip`), portfolio cover upload, the database integration tests in `tests/integration`, the invite SQL functions and team-table RLS in `0004_invites.sql`, the invite dialog and `/undangan`. Drafted Dhanes's H4–H5 code: the learning SQL functions in `0005_learning.sql` (`submit_mcq`, progress, promo and simulated purchase), `seed-content.ts` and two lessons of "Persiapan Hackathon", the course unlock card, mentor RLS in `0006_mentor_rls.sql` and `/mentor/[id]`, and the Playwright tests in `tests/e2e`. Drafted Adnan's H0 work: the matching score and reasons in `lib/matching` with their tests, the skill list and role templates in `seed.sql`, the UI fixtures in `lib/fixtures`, and the CI workflow. Drafted Adnan's H1 work: guidebook text extraction in `lib/pdf` and the simulated profile seed in `lib/seed` and `scripts/seed-profiles.ts`. Drafted Adnan's H2 work: the guidebook agent, skill mapping, extraction cache, role suggestions and guidebook summary data in `lib/ai` and `app/api/ai/guidebook`, and the role source labels in `lib/format/role-source.ts`. Drafted the team work Adnan took over from Malik: `create_team` in `0008_create_team.sql`, `createTeam` and the `/tim/baru` wizard, `save_roles` in `0009_save_roles.sql`, the role editor and `/tim/[id]/role`, the team dashboard `/tim/[id]` with the gap logic in `lib/team` and `assign_member_role` in `0010_assign_member_role.sql`, teammate contacts on the dashboard, the mentor grid `/mentor` (`MentorCard`, filters in `lib/mentors/list.ts`) and the simulated mentors in `seed.sql`, mentor booking and the simulated payment (`0011_bookings.sql`, checkout, "Sesi mentor"), the competition admin `/admin/lomba` (competition form, guidebook upload, extraction review), with their integration and Playwright tests. Drafted Alek's H0 work: the base UI components in `components/ui` and the page frames in `components/layout` (`PublicNavbar`, `Footer`, `AppShell`, `Sidebar`, `SearchInput`). Drafted Alek's M2 work: the notification bell, `markNotificationsRead` and `0007_notifications.sql`, the `/belajar` catalog and course page, the lesson player (`LessonShell`, `LessonTopBar`, `QuestionMCQ`, lesson Markdown), the lessons "Struktur pitch deck" and "Demo yang aman", and the responsive pass (44 px touch targets, `tap-target`, the 404 and global error pages). Drafted the proposed logo in `docs/brand` (symbol, full logo, icons) and the brand intro. The team reviews them in the pull request before merge |

Every member adds a row or a line here when an AI tool materially helps with their work.

## Known limitations

- Light theme only, Indonesian UI only, one campus in the first version.
- Payments and mentors are simulated.
- Guidebooks must be text PDFs; scanned PDFs fall back to manual role entry.

## Versions

- Starting version for Final Day: not tagged yet
- Final version: not tagged yet
- Final Day changes: not started

## Team and contributions

| Member | GitHub | Role | Main contributions |
| --- | --- | --- | --- |
| Malik Arsyafiandra Madani | [@malikarsya](https://github.com/malikarsya) | Leader, backend | Planned: repo and CI, Supabase and auth, deploy and releases. Since Nov 23 (swapped with Adnan): ranking API, recommendation feedback, recruiter agent, case-study feedback, admin metrics and guidebook evaluation |
| Dhanesworo Muhammad Datiputro | [@dhanesmd3](https://github.com/dhanesmd3) | Backend | Planned: base components, profiles, contact privacy (RLS), invitations, quiz and course access, mentor detail, end-to-end tests |
| Axeleon Justin Algianto | [@angseleong](https://github.com/angseleong) | Frontend | Planned: design system and components, landing, competitions, ranking UI and profile sheet, notifications, course player, responsive pass |
| Muhammad Adnan Kurniawan | [@adnankurniawann](https://github.com/adnankurniawann) | AI and data | Planned: matching algorithm, guidebook agent, seed data. Since Nov 23 (swapped with Malik): teams, competition admin, mentor list and booking |

"Planned" becomes a list of merged work as features land.

## Docs

- [docs/PRD.md](docs/PRD.md): what to build (Indonesian)
- [TODO.md](TODO.md): who builds what, day by day
- [CONTRIBUTING.md](CONTRIBUTING.md): setup, branches, pull requests
- [CONTEXT.md](CONTEXT.md): the words the project uses
- [docs/design-system.md](docs/design-system.md): how the UI looks
- [docs/adr/](docs/adr/): decisions and why
