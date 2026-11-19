# 9. A develop branch, and work split by feature

Status: accepted (2026-11-19)

## Context

Four people merge every day for five days, while `main` must always be a version judges can open
and the committee can point to (first and last commit). The team's roles are uneven in size:
frontend has far more screens than AI has agents. Split by layer, one person would block the rest.

## Decision

- **Branches:** `main` holds releases only (`v0.1.0`, semifinal, Final Day) and deploys to
  production. `develop` is the integration branch and deploys to staging. Feature branches come
  from `develop` and return to it by PR. Hotfixes branch from `main` and are merged back into
  `develop` the same day. Malik opens the release PRs.
- **Roles:** Malik and Dhanes lead backend, Adnan leads AI and data, Alek (Axeleon) leads frontend.
  A lead reviews their area; they don't build all of it.
- **Work split by whole features** (UI to database), about 12 to 13 backlog issues each (PRD §20.2,
  §21.7).
- **Contracts first:** on H0 the migration and generated types, matching types and fixtures, Zod
  schemas and base components land before any feature work, so UI can be built on fixtures.

## Consequences

- Everyone touches the frontend and the database, so everyone can explain the system to judges.
- A change to a shared contract needs a heads-up before its PR.
- Both `main` and `develop` need branch protection (PR, 1 review, CI green), set up on H0.
