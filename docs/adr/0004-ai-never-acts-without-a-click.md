# 4. AI never acts without a click

Status: accepted (2026-11-19)

## Context

The recruiter agent drafts invitations and the product has bookings and simulated payments. An
agent that sends messages on its own would contact students who never agreed to hear from a stranger.

## Decision

- Agents only draft. A draft is saved in `agent_actions` with `approval = 'pending'`.
- An invite, a booking or a payment is created only by the user's own click ("Kirim", "Bayar").
- After the LLM writes a message, code rejects any message with a number or skill name that wasn't
  in the input and uses the template from F-INV-01 instead.
- Every AI output shows a "Dibuat AI" mark.

## Consequences

- The recruiter agent saves typing, not decisions. Metrics count how many drafts were sent
  (`approved / total`).
- No background job may call `sendInvite`.
