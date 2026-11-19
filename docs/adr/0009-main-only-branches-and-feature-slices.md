# 9. One main branch, and work split by feature

Status: accepted (2026-11-19). Replaces the first version of this ADR, which also had a `develop`
branch; the team dropped it the same day to keep the flow simple.

## Context

Four people merge every day for five days, while the deployed app must always be a version judges
can open and the committee can point to (first and last commit on Final Day). The team's roles are
uneven in size: frontend has far more screens than AI has agents. Split by layer, one person would
block the rest.

## Decision

- **Branches:** one long-lived branch, `main`, protected (PR, 1 review, CI green) and deployed to
  production. Feature branches come from `main` and return to it by PR; every PR gets a Vercel
  preview URL. Releases are tags on `main` (`v0.1.0`, `v0.2.0-semifinal`, `v1.0.0-final`) made by
  Malik.
- **Roles:** Malik and Dhanes lead backend, Adnan leads AI and data, Alek (Axeleon) leads frontend.
  A lead reviews their area; they don't build all of it.
- **Work split by whole features** (UI to database), about 12 to 13 backlog issues each (PRD §20.2,
  §21.7).
- **Contracts first:** on H0 the migration and generated types, matching types and fixtures, Zod
  schemas and base components land before any feature work, so UI can be built on fixtures.

## Consequences

- `main` must always work: a half-done PR is never merged, and big features land as several small
  PRs that each still run.
- Everyone touches the frontend and the database, so everyone can explain the system to judges.
- A change to a shared contract needs a heads-up before its PR.
- Branch protection on `main` needs a repo admin (Adnan) on H0.
