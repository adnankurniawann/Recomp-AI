# Issue tracker

Issues live in this repo's GitHub Issues. Use the `gh` CLI.

- One issue per backlog row in PRD §21.7. Title: `F-RNK-01 Ranking tab` (feature ID first, a dash
  for rows without one).
- Body: the feature template in `.github/ISSUE_TEMPLATE/feature.md`, with the acceptance criteria
  copied from PRD §6 as checkboxes.
- Labels: one priority, one area, one type (`docs/agents/labels.md`). Milestone: M0 to M4
  (PRD §21.4). Assignee: the GitHub handle from PRD §20.2.
- An issue closes only when every acceptance criterion passes on `develop`.

```sh
gh issue list --label area:rnk --state open
gh issue create --title "F-RNK-01 Ranking tab" --label P0,area:rnk,type:feature \
  --milestone "M1 Alur inti" --assignee angseleong --body-file /path/to/body.md
gh issue view 28
```

Link the pull request with `Closes #<n>` in its body.
