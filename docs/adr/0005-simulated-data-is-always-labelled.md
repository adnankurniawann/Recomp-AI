# 5. Simulated data is always labelled

Status: accepted (2026-11-19)

## Context

STACK rules 6 and 10: simulated or unfinished features must be marked, and data must not be made
up. The demo needs 50 profiles, 10 mentors and payments that don't exist.

## Decision

- Every simulated row has `is_simulated = true`: seed profiles, mentors without written permission,
  competitions added only for the demo, every booking and payment.
- The UI shows the "Simulasi" badge on each of them, and checkout shows "Ini pembayaran simulasi.
  Tidak ada uang yang ditarik".
- The admin metrics page keeps simulated and real data apart. Trial results are reported with the
  real number of participants.

## Consequences

- A screenshot or video never shows a fictional profile without its badge.
- Real mentors need written permission, photo included, before they replace simulated ones.
