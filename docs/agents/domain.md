# Domain docs

How agents should use this repo's domain documentation.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root.
- **`docs/adr/`**: the ADRs that touch the area you're about to work in.
- **`docs/PRD.md`**: only the section for your area (the map is in `AGENTS.md`).

## Use the glossary's vocabulary

When your output names a domain concept (an issue title, a test name, a variable, a commit), use
the term as `CONTEXT.md` defines it, and its UI label for words on screen. Don't drift to the
synonyms it lists under _Avoid_.

If the concept you need isn't there, either you're inventing language the project doesn't use, or
there's a real gap: add it to `CONTEXT.md` in the same pull request.

## Be honest about status

An ADR marked `proposed` isn't decided. Don't describe anything in `README.md` or `docs/` as working
until it runs on `main`.
