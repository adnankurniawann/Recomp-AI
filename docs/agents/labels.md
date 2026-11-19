# Labels

From PRD §21.3. Every issue gets one priority, one area and one type.

| Label | Colour | Meaning |
| --- | --- | --- |
| `P0` | red | Required for the semifinal |
| `P1` | yellow | Required for Final Day |
| `P2` | grey | Extra |
| `area:fnd`, `area:prf`, `area:cmp`, `area:gba`, `area:tem`, `area:rnk`, `area:inv`, `area:rcr`, `area:lrn`, `area:mnt`, `area:ntf`, `area:adm`, `area:qa` | light blue | The epic, matching the feature ID (`F-RNK-01` is `area:rnk`) |
| `type:feature`, `type:bug`, `type:chore`, `type:docs` | purple | Kind of work |
| `final-day` | green | Left on purpose for Final Day; don't start before it (ADR 0007) |
| `blocked` | black | Waiting on something outside the issue; say what in a comment |
