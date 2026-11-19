# 3. Contacts open only through RLS

Status: accepted (2026-11-19)

## Context

Product principle 3: a student's WhatsApp and email never show before both sides agree. A check in
the UI or an API route can be forgotten in one query; a leak is the privacy failure judges would
remember.

## Decision

- Contacts live in their own tables, `profile_contacts` and `mentor_contacts`, apart from public
  profiles.
- RLS allows a read only to the owner and teammates who have both joined
  (`are_teammates(current_profile_id(), profile_id)`), and mentor contacts only to a team with a
  `paid` booking.
- Code that serves a user never uses the service role key and never joins contacts into a public
  profile query.

## Consequences

- Integration tests prove A can't read B before they are teammates and can after `accept_invite`
  (PRD §16.2).
- Showing contacts needs a second query under the user's session; that's the point.
