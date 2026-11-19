# UI review

A change to anything on screen (a page, a component, its words, an icon) is judged by what a
student sees in the browser, not by the diff. Check it against `docs/design-system.md` and this
list before opening the PR, and put screenshots in the PR body.

## Checklist

- [ ] Looks right at **360 px** and **1280 px** wide, with no horizontal scroll.
- [ ] Loading (skeleton), empty (`EmptyState`), error ("Coba lagi") and success (toast) states all
      exist for data pages.
- [ ] Only tokens: no hex colours, radii or shadows outside `app/globals.css`.
- [ ] At most one filled primary button on the page.
- [ ] Coloured text uses an `-ink` shade; no `ink-3` text on `surface-2`.
- [ ] Every control is reachable with Tab, has a visible focus ring, and icon-only buttons have an
      `aria-label`. Images have `alt`, form fields have labels.
- [ ] Touch targets at least 44 px on phones.
- [ ] Words on screen are Indonesian and use the UI labels from `CONTEXT.md`.
- [ ] Simulated data shows the "Simulasi" badge; AI output shows "Dibuat AI".
- [ ] No contact (WhatsApp, email) is visible to someone who isn't a teammate.

Before the release on H5, run Lighthouse on the public pages: Accessibility ≥ 90, LCP under 2.5 s.
