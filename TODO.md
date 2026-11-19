# TODO

Everything before the semifinal submission, day by day, one list per person. Every item comes from
[PRD §20.3](docs/PRD.md#203-rencana-per-hari-per-orang) and the backlog in
[§21.7](docs/PRD.md#217-backlog-issue) (`#n` = the GitHub issue; backlog row = issue number − 1).
**Tick an item only when it works on `main`**, not when the code is written.

| Day | Date | Goal you can try |
| --- | --- | --- |
| [H0](#h0-thu-nov-19-evening) | Thu Nov 19, evening | Repo, schema, tokens and contracts in place |
| [H1](#h1-fri-nov-20) | Fri Nov 20 | Sign in, finish onboarding, browse competitions |
| [H2](#h2-sat-nov-21) | Sat Nov 21 | Create a team from AI-suggested roles |
| [H3](#h3-sun-nov-22) | Sun Nov 22 | **Core flow end to end**: ranking, invite, accept, contacts |
| [H4](#h4-mon-nov-23) | Mon Nov 23 | Courses, mentors, recruiter agent |
| [H5](#h5-tue-nov-24) | Tue Nov 24 | Tests, responsive, deployed, **tag `v0.1.0` at 21.00** |
| [M3](#m3-semifinal-nov-2530) | Nov 25–30 | Trial with real students, video, proposal |
| [M4](#m4-final-day-dec-16) | Dec 16 | The three Final Day tasks |

Load per person, weighted by size (S = 1, M = 2, L = 3 points, PRD §21.7): Malik 27, Dhanes 27,
Alek 28, Adnan 29 (three of Adnan's are shared with Alek). On top of that: Malik's leader work, the video (Malik, Dhanes) and the proposal
(Alek, Adnan). Leads review
their area: backend `@malikarsya` / `@dhanesmd3`, frontend `@angseleong`, AI and data
`@adnankurniawann`.

## Done

- [x] Repo created, PRD v1.2, project docs and design system v2
- [x] GitHub labels, milestones M0–M4 and issues #2–#54 from PRD §21.3–21.7

## H0 Thu Nov 19, evening

Contracts first, so everyone can work in parallel from H1.

**@malikarsya**
- [ ] #2 Next.js App Router, TypeScript strict, pnpm, ESLint, Prettier, Vitest, CI (F-FND-01)
- [ ] Protect `main` (PR, 1 review, CI green). Needs admin: ask @adnankurniawann
- [ ] #3 Supabase local and cloud, `0001_init.sql` from PRD §12, generated types (F-FND-01)

**@dhanesmd3**
- [ ] #5 `Avatar`, `Stepper`, `EmptyState`, `ProgressBar` (F-FND-03)
- [ ] Zod schemas in `lib/validation` for profile, team and invite inputs (PRD §13.1)
- [ ] `ActionResult<T>` type and error codes
- [ ] `lib/format/phone.ts` with tests (`08…` and `+62 …` become `+62…`)

**@angseleong**
- [x] #4 v2 tokens in `app/globals.css`, `Button`, `IconButton`, `Card`, `Chip`, `StatusBadge`, `SimulatedBadge`, `SectionLabel` (F-FND-03)
- [x] #6 `AppShell`, `Sidebar` and `PublicNavbar` skeletons (F-FND-03)

**@adnankurniawann**
- [x] #27 `lib/matching/types.ts`, `score.ts` skeleton, the Dinda test case (PRD §7.6)
- [x] Skill list and role templates for `seed.sql` (PRD §7.1, §15)
- [x] UI fixtures in `lib/fixtures` (profiles, a team, a ranking result) for building screens early

## H1 Fri Nov 20

**@malikarsya**
- [ ] #7 Google and email sign-in, profile trigger, onboarding middleware (F-FND-02)
- [ ] #8 `seed.sql`: skills, role templates, competitions; Storage buckets; RLS on competitions (F-FND-04)
- [ ] #18 "Tertarik" button and `toggleInterest` (F-CMP-03)

**@dhanesmd3**
- [ ] #10 Four-step onboarding wizard, UI and server actions (F-PRF-01)
- [ ] #14 `/profil` edit page (F-PRF-07)
- [ ] RLS on profiles and the tables under it

**@angseleong**
- [x] #15 Landing page (PRD §10.1)
- [ ] #16 `/lomba` with `CompetitionCard`, `SegmentedTabs`, `SearchInput`, filters (F-CMP-01)
- [ ] #17 `/lomba/[slug]` without the guidebook tab (F-CMP-02)

**@adnankurniawann**
- [x] #27 `scoreCandidate`, `reasons.ts`, all seven unit tests passing (PRD §7.6)
- [x] #9 `seed-profiles.ts`, 50 simulated profiles (F-FND-04)
- [x] #20 `lib/pdf/extract.ts`, text per page (F-GBA-01)

## H2 Sat Nov 21

**@malikarsya**
- [ ] #24 `create_team` and the three-step `/tim/baru` wizard (F-TEM-01)
- [ ] #25 Role editor, `saveRoles`, `recompute_team_status` (F-TEM-02)

**@dhanesmd3**
- [ ] #13 `/u/[username]` with `HistoryTimeline` and `PortfolioGrid` (F-PRF-06)
- [ ] #11 Skill, history, portfolio and contact actions, portfolio image upload (F-PRF-02..05)
- [ ] #12 `profile_contacts` RLS and its integration tests (F-PRF-05)

**@angseleong**
- [ ] #30 `ProfileSheet` without the match panel (F-RNK-03)
- [ ] #29 `CandidateRow`, `CandidateCard`, `ScoreBadge`, `FactorBars`, `ReasonList`, `KpiStrip` on fixtures (F-RNK-01..02)
- [ ] #23 Guidebook summary tab UI on the competition page (F-CMP-02)

**@adnankurniawann**
- [ ] #21 Guidebook agent end to end: Gemini, Zod schema, one retry (F-GBA-01)
- [ ] #22 Skill mapping, cache per competition, manual fallback form (F-GBA-02..04)
- [ ] #23 Data for the guidebook summary tab (F-CMP-02)

## H3 Sun Nov 22

**@malikarsya**
- [ ] Vercel: `main` to production, a preview URL for every PR
- [ ] #34 Contacts on the team dashboard (F-INV-04)
- [ ] #26 Team dashboard on real data, gap summary, `assignMemberRole` (F-TEM-03..04)
- [ ] #19 Competition admin, guidebook upload, "Jalankan ekstraksi" (F-CMP-04)

**@dhanesmd3**
- [ ] #31 Invite dialog and `sendInvite` (F-INV-01)
- [ ] #33 Atomic `accept_invite` and the concurrency test, `decline_invite`, `cancel_invite` (F-INV-03)
- [ ] #32 `/undangan` (F-INV-02)

**@angseleong**
- [ ] #46 Notifications, the bell and the pending-invite count (F-NTF-01)
- [ ] #29 Ranking tab on the real API: load more, sort, empty state (F-RNK-01)
- [ ] #23 Wire the guidebook summary tab

**@adnankurniawann**
- [ ] #28 `ranking_candidates` SQL and `GET /api/ranking/[teamRoleId]` (F-RNK-01)
- [ ] #30 Match panel in `ProfileSheet`, with Alek (F-RNK-03)
- [ ] #35 "Cocok" and "Kurang cocok" feedback (F-RNK-05)

**Everyone, evening:** internal demo of the core flow. If it doesn't run end to end, H4's P1 work
waits and everyone helps fix P0.

## H4 Mon Nov 23

**@malikarsya**
- [ ] #43 `/mentor` with `MentorCard` and role filter (F-MNT-01)
- [ ] #45 Checkout, `create_booking`, `simulate_booking_payment`, mentor seed (F-MNT-03..04)

**@dhanesmd3**
- [ ] #44 `/mentor/[id]` (F-MNT-02)
- [ ] #39 `submit_mcq` and progress (F-LRN-03)
- [ ] #41 `redeem_promo`, `simulate_course_purchase` (F-LRN-05)
- [ ] `seed-content.ts` for the course

**@angseleong**
- [ ] #37 `/belajar` and `/belajar/[kursus]` (F-LRN-01..02)
- [ ] #38 `LessonShell`, lesson player, `QuestionMCQ`, points and progress (F-LRN-03)

**@adnankurniawann**
- [ ] #36 Recruiter agent: API and draft cards (F-RCR-01..03)
- [ ] #40 Case-study feedback API and `QuestionCase` (F-LRN-04)

**Everyone:**
- [ ] #42 Write two lessons each for "Persiapan Hackathon" (F-LRN-06)

## H5 Tue Nov 24

**@malikarsya**
- [ ] Local backup with `DEMO_MODE=true`, screen recording of the core flow
- [ ] **Tag `v0.1.0` on `main` at 21.00**

**@dhanesmd3**
- [ ] #48 Playwright core flow (PRD §16.3)
- [ ] All database integration tests in PRD §16.2
- [ ] Bug fixes in profiles and invites

**@angseleong**
- [ ] #49 Every page at 360 px; loading, empty and error states; Lighthouse Accessibility ≥ 90
- [ ] #50 README: setup, feature table, limitations

**@adnankurniawann**
- [ ] #51 `pnpm eval:guidebook` on 5–10 guidebooks (PRD §8.1)
- [ ] #47 Admin metrics page (F-ADM-01, PRD §17)
- [ ] #50 AI disclosure in the README
- [ ] Ranking bug fixes

## M3 Semifinal, Nov 25–30

- [ ] Recruit trial students (target 30) through student associations: @malikarsya
- [ ] Run the trial: leaders create teams, rate recommendations, invite: everyone
- [ ] Count the metrics with the real number of participants (PRD §17): @adnankurniawann
- [ ] 2-minute video in English: @malikarsya (script) and @dhanesmd3 (recording and editing)
- [ ] Proposal, at most 10 pages: @angseleong and @adnankurniawann, sections split as in PRD §20.6
- [ ] Signed originality declaration: @malikarsya
- [ ] Submit before 23.59 WIB on Nov 30: @malikarsya

## M4 Final Day, Dec 16

Don't start these before Final Day ([ADR 0007](docs/adr/0007-three-tasks-left-for-final-day.md)).

- [ ] #52 Apply to a team (F-INV-05)
- [ ] #53 Suggest the next competition for a complete team
- [ ] #54 Mentor ratings and reviews (F-MNT-06)

## Open decisions

From PRD §24. Each one needs an owner before H1.

- [ ] Is the stack in PRD §11.1 accepted? ([ADR 0001](docs/adr/0001-nextjs-supabase-gemini-stack.md) is still `proposed`)
- [ ] Which eight real competitions go in the seed
- [ ] Who has admin access to Supabase and Vercel
- [ ] Final logo and domain (logo proposed in [docs/brand](docs/brand/README.md), needs team approval; domain still open)
- [ ] Real mentors who can give written permission
- [ ] Platform fee (proposed 20%) and sample service prices
- [ ] Semifinal fee and who pays
