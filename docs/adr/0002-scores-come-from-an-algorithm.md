# 2. Scores come from an algorithm, not an LLM

Status: accepted (2026-11-19)

## Context

A leader decides whom to invite from the ranking, and judges will ask why one student ranks above
another. An LLM score can't be reproduced, can't be unit-tested and can drift with the model.

## Decision

- `lib/matching` holds pure functions: `scoreCandidate` and `rankCandidates`. Five factors
  (coverage 0.40, level 0.20, availability 0.20, experience 0.10, fit 0.10), weights in the
  `matching_config` table (PRD §7.3).
- Reasons come from templates in code (PRD §7.4), never from an LLM.
- The function never reads gender, religion, ethnicity, campus, photo, age or entry year.
- The seven cases in PRD §7.6 are required unit tests, including "two candidates who differ only in
  campus or year score the same".

## Consequences

- Every score is explainable in the "Rincian skor" popover and repeatable in a test.
- Weights are a guess until the trial (PRD §17); changing them is a database update, not a deploy.
- The UI says "Skor dihitung algoritma, bukan AI" wherever a score appears.
