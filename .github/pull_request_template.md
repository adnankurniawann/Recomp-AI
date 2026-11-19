<!-- Title: a short Conventional Commit in English, like "feat(ranking): add score badge".
     PRs into main are squash-merged, so the title becomes the commit. -->

## What changed

<!-- 1–3 sentences on what a student or teammate can do now. -->

Closes #

## PRD ID

F-XXX-00

## How to test

1.

## Screenshots

<!-- Anything on screen: 360 px and 1280 px, from simulated data. Nothing visible? "No visible change." -->

## Checklist

- [ ] Every acceptance criterion in the issue passes
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] Loading, empty and error states exist (data pages)
- [ ] `docs/agents/ui-review.md` checked (UI changes)
- [ ] No secrets or real personal data in the diff or screenshots
- [ ] Simulated data or features are labelled
- [ ] No `Co-Authored-By` or AI attribution in commits or this PR (AI use goes in the README table)
