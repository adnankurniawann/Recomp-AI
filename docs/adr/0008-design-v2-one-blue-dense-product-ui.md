# 8. Design v2: one blue, dense product UI

Status: accepted (2026-11-19)

## Context

PRD v1.1 §9 took its look from gdgoncampusitb.com: dot patterns, colour blobs, a giant centred
hero, blue eyebrow labels, pill buttons and borderless cards with big shadows. Side by side it read
as a copy. Checking its colours also showed four of six role chips failing WCAG AA, UI/UX sharing
the danger red and Product sharing the "Simulasi" amber.

## Decision

- One brand colour, royal blue `#145AFF`, on a near-white canvas. Role and status colours only as
  dots, bars and small chips, with a darker `ink` shade for text that passes AA.
- Inter 400/500/600 and JetBrains Mono for numbers. Plus Jakarta Sans is dropped.
- Buttons are 10 px rounded rectangles, usually outlined with an icon; one filled primary per page.
  Chips and badges stay pills.
- Cards have a 1 px border, 16 px radius and an almost invisible shadow. Dense spacing.
- Logged-in pages use a left sidebar; public pages a top navbar.
- The ranking is a table on desktop and cards on phones.
- The landing shows the product (real components, simulated data), not decoration.

References: the Relate style on refero.design for colour and type, and dense product dashboards for
buttons, segmented tabs and KPI strips. Nothing is copied from them: no logos, layouts or copy.
Mock: four artboards, linked from `docs/design-system.md`.

## Consequences

- PRD §9 and §10 were rewritten in v1.2; `docs/design-system.md` holds the Tailwind theme and
  component recipes.
- Component names changed: `ScoreRing` became `ScoreBadge`, `CandidateCard` gained `CandidateRow`,
  `AppShell` now has a `Sidebar`, `Eyebrow` became `SectionLabel`.
- No illustrations to make or credit; empty states use icons.
