# TODO

Everything before the semifinal submission, day by day, one list per person. Every item comes from
[PRD §20.3](docs/PRD.md#203-rencana-per-hari-per-orang) and the backlog in
[§21.7](docs/PRD.md#217-backlog-issue) (`#n` = backlog number, the GitHub issue once created).
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

Load per person: Malik 13, Dhanes 13, Adnan 13, Alek 12 backlog issues (PRD §21.7). Leads review
their area: backend `@malikarsya` / `@dhanesmd3`, frontend `@angseleong`, AI and data
`@adnankurniawann`.

## Done

- [x] Repo created, PRD v1.2, project docs and design system v2 (this PR)

## H0 Thu Nov 19, evening

Contracts first, so everyone can work in parallel from H1.

**@malikarsya**
- [ ] #1 Next.js App Router, TypeScript strict, pnpm, ESLint, Prettier, Vitest, CI (F-FND-01)
- [ ] Protect `main` (PR, 1 review, CI green). Needs admin: ask @adnankurniawann
- [ ] #2 Supabase local and cloud, `0001_init.sql` from PRD §12, generated types (F-FND-01)
- [ ] Create all GitHub labels, milestones and issues from PRD §21.3–21.7

**@dhanesmd3**
- [ ] Zod schemas in `lib/validation` for profile, team and invite inputs (PRD §13.1)
- [ ] `ActionResult<T>` type and error codes
- [ ] `lib/format/phone.ts` with tests (`08…` and `+62 …` become `+62…`)

**@angseleong**
- [ ] #3 v2 tokens in `app/globals.css`, `Button`, `IconButton`, `Card`, `Chip`, `StatusBadge`, `SimulatedBadge`, `SectionLabel` (F-FND-03)
- [ ] #5 `AppShell`, `Sidebar` and `PublicNavbar` skeletons (F-FND-03)

**@adnankurniawann**
- [ ] #26 `lib/matching/types.ts`, `score.ts` skeleton, the Dinda test case (PRD §7.6)
- [ ] Skill list and role templates for `seed.sql` (PRD §7.1, §15)
- [ ] UI fixtures in `lib/fixtures` (profiles, a team, a ranking result) for building screens early

## H1 Fri Nov 20

**@malikarsya**
- [ ] #6 Google and email sign-in, profile trigger, onboarding middleware (F-FND-02)
- [ ] #7 `seed.sql`: skills, role templates, competitions; Storage buckets; RLS on competitions (F-FND-04)
- [ ] #17 "Tertarik" button and `toggleInterest` (F-CMP-03)

**@dhanesmd3**
- [ ] #9 Four-step onboarding wizard, UI and server actions (F-PRF-01)
- [ ] #13 `/profil` edit page (F-PRF-07)
- [ ] RLS on profiles and the tables under it

**@angseleong**
- [ ] #14 Landing page (PRD §10.1)
- [ ] #15 `/lomba` with `CompetitionCard`, `SegmentedTabs`, `SearchInput`, filters (F-CMP-01)
- [ ] #16 `/lomba/[slug]` without the guidebook tab (F-CMP-02)
- [ ] #4 `Avatar`, `Stepper`, `EmptyState`, `ProgressBar` (F-FND-03)

**@adnankurniawann**
- [ ] #26 `scoreCandidate`, `reasons.ts`, all seven unit tests passing (PRD §7.6)
- [ ] #8 `seed-profiles.ts`, 50 simulated profiles (F-FND-04)
- [ ] #19 `lib/pdf/extract.ts`, text per page (F-GBA-01)

## H2 Sat Nov 21

**@malikarsya**
- [ ] #23 `create_team` and the three-step `/tim/baru` wizard (F-TEM-01)
- [ ] #24 Role editor, `saveRoles`, `recompute_team_status` (F-TEM-02)

**@dhanesmd3**
- [ ] #12 `/u/[username]` with `HistoryTimeline` and `PortfolioGrid` (F-PRF-06)
- [ ] #10 Skill, history, portfolio and contact actions, portfolio image upload (F-PRF-02..05)
- [ ] #11 `profile_contacts` RLS and its integration tests (F-PRF-05)
- [ ] #29 `ProfileSheet` without the match panel (F-RNK-03)

**@angseleong**
- [ ] #28 `CandidateRow`, `CandidateCard`, `ScoreBadge`, `FactorBars`, `ReasonList`, `KpiStrip` on fixtures (F-RNK-01..02)
- [ ] #22 Guidebook summary tab UI on the competition page (F-CMP-02)

**@adnankurniawann**
- [ ] #20 Guidebook agent end to end: Gemini, Zod schema, one retry (F-GBA-01)
- [ ] #21 Skill mapping, cache per competition, manual fallback form (F-GBA-02..04)
- [ ] #22 Data for the guidebook summary tab (F-CMP-02)

## H3 Sun Nov 22

**@malikarsya**
- [ ] #25 Team dashboard on real data, gap summary, `assignMemberRole` (F-TEM-03..04)
- [ ] #18 Competition admin, guidebook upload, "Jalankan ekstraksi" (F-CMP-04)

**@dhanesmd3**
- [ ] #30 Invite dialog and `sendInvite` (F-INV-01)
- [ ] #32 Atomic `accept_invite` and the concurrency test, `decline_invite`, `cancel_invite` (F-INV-03)
- [ ] #31 `/undangan` (F-INV-02)
- [ ] #33 Contacts on the team dashboard (F-INV-04)

**@angseleong**
- [ ] #28 Ranking tab on the real API: load more, sort, empty state (F-RNK-01)
- [ ] #22 Wire the guidebook summary tab
- [ ] Pending-invite count in the sidebar

**@adnankurniawann**
- [ ] #27 `ranking_candidates` SQL and `GET /api/ranking/[teamRoleId]` (F-RNK-01)
- [ ] #29 Match panel in `ProfileSheet`, with Dhanes (F-RNK-03)
- [ ] #34 "Cocok" and "Kurang cocok" feedback (F-RNK-05)

**Everyone, evening:** internal demo of the core flow. If it doesn't run end to end, H4's P1 work
waits and everyone helps fix P0.

## H4 Mon Nov 23

**@malikarsya**
- [ ] #42 `/mentor` with `MentorCard` and role filter (F-MNT-01)
- [ ] #43 `/mentor/[id]` (F-MNT-02)
- [ ] #44 Checkout, `create_booking`, `simulate_booking_payment`, mentor seed (F-MNT-03..04)
- [ ] Vercel: `main` to production, a preview URL for every PR

**@dhanesmd3**
- [ ] #38 `submit_mcq` and progress (F-LRN-03)
- [ ] #40 `redeem_promo`, `simulate_course_purchase` (F-LRN-05)
- [ ] #45 Notifications and the bell (F-NTF-01)
- [ ] `seed-content.ts` for the course

**@angseleong**
- [ ] #36 `/belajar` and `/belajar/[kursus]` (F-LRN-01..02)
- [ ] #37 `LessonShell`, lesson player, `QuestionMCQ`, points and progress (F-LRN-03)

**@adnankurniawann**
- [ ] #35 Recruiter agent: API and draft cards (F-RCR-01..03)
- [ ] #39 Case-study feedback API and `QuestionCase` (F-LRN-04)

**Everyone:**
- [ ] #41 Write two lessons each for "Persiapan Hackathon" (F-LRN-06)

## H5 Tue Nov 24

**@malikarsya**
- [ ] #47 Playwright core flow (PRD §16.3)
- [ ] Local backup with `DEMO_MODE=true`, screen recording of the core flow
- [ ] **Tag `v0.1.0` on `main` at 21.00**

**@dhanesmd3**
- [ ] All database integration tests in PRD §16.2
- [ ] Bug fixes in profiles and invites

**@angseleong**
- [ ] #48 Every page at 360 px; loading, empty and error states; Lighthouse Accessibility ≥ 90
- [ ] #49 README: setup, feature table, limitations

**@adnankurniawann**
- [ ] #50 `pnpm eval:guidebook` on 5–10 guidebooks (PRD §8.1)
- [ ] #46 Admin metrics page (F-ADM-01, PRD §17)
- [ ] #49 AI disclosure in the README
- [ ] Ranking bug fixes

## M3 Semifinal, Nov 25–30

- [ ] Recruit trial students (target 30) through student associations: @malikarsya
- [ ] Run the trial: leaders create teams, rate recommendations, invite: everyone
- [ ] Count the metrics with the real number of participants (PRD §17): @adnankurniawann
- [ ] 2-minute video in English: script @malikarsya, recording and editing @dhanesmd3
- [ ] Proposal, at most 10 pages, sections split as in PRD §20.6: everyone
- [ ] Signed originality declaration: @malikarsya
- [ ] Submit before 23.59 WIB on Nov 30: @malikarsya

## M4 Final Day, Dec 16

Don't start these before Final Day ([ADR 0007](docs/adr/0007-three-tasks-left-for-final-day.md)).

- [ ] #51 Apply to a team (F-INV-05)
- [ ] #52 Suggest the next competition for a complete team
- [ ] #53 Mentor ratings and reviews (F-MNT-06)

## Open decisions

From PRD §24. Each one needs an owner before H1.

- [ ] Is the stack in PRD §11.1 accepted? ([ADR 0001](docs/adr/0001-nextjs-supabase-gemini-stack.md) is still `proposed`)
- [ ] Which eight real competitions go in the seed
- [ ] Who has admin access to Supabase and Vercel
- [ ] Final logo and domain (placeholder: "r" in a blue square)
- [ ] Real mentors who can give written permission
- [ ] Platform fee (proposed 20%) and sample service prices
- [ ] Semifinal fee and who pays
