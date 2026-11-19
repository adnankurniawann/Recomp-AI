# 7. Three tasks are left for Final Day

Status: accepted (2026-11-19)

## Context

The STACK handbook forbids starting from an empty repo on Final Day and asks teams to leave 2 to 3
meaningful pieces of work for the build session, while the committee records the first and last
commit.

## Decision

These stay unbuilt until Final Day, labelled `final-day`, milestone M4:

1. Applying to a team (F-INV-05)
2. Suggesting the next competition for a complete team
3. Mentor ratings and reviews (F-MNT-06)

If the trial finds a serious problem, one of them may be swapped for that fix.

## Consequences

- The database already has `invites.direction = 'apply'` and `bookings.status = 'done'`, so the
  work is UI and logic, not a migration.
- README lists all three under "Planned for Final Day".
