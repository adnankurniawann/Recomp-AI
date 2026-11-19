# Recomp AI logo

**Status: proposed.** The final logo is an open decision (PRD §24) until the team agrees. Trademark
clearance has not been checked; search the DJKI database before using it outside the competition.

**Idea:** an "r" made of two parts, a stem and a shoulder, with a gap between them. Two roles make
one team. It grows out of the placeholder "r" in a blue square.

Two forms:

- **Short:** the symbol, a white "r" on a blue tile.
- **Full:** the same "r" in blue, without the tile, as the first letter of the name: r(logo) + "ecomp
  ai". Never put the tile next to the full logo; the "r" would appear twice.

Presentation board: [board/board.html](board/board.html) (slides as PNG in `board/`).

## Which file to use

| Need | File |
| --- | --- |
| Short form: app icon, avatar, sidebar, anything square | `logo/recomp-symbol.svg` |
| Short form at 32 px or smaller | `logo/recomp-symbol-small.svg` (thicker strokes, wider gap) |
| Full name: navbar, slides, documents, intro screen | `logo/recomp-horizontal.svg` |
| Full name on a dark background | `logo/recomp-horizontal-reversed.svg` |
| One colour (print, stamps, embroidery) | `logo/*-black.svg`, `*-white.svg`, `*-blue.svg`, or the `*-mono.svg` masters |
| PNG for slides and documents | `logo/recomp-horizontal-1200.png`, `logo/recomp-symbol-512.png` |
| Favicon, app icon, PWA | `logo/web/` (`head-snippet.html` shows the tags) |
| Intro animation | `logo/intro-preview.html` |

Every SVG is filled outlines: no live text, strokes, filters or images.

## Colours

| Name | HEX | RGB | Use |
| --- | --- | --- | --- |
| Primary blue | `#145AFF` | 20 90 255 | The tile; the "r" and "ai" of the full logo |
| Ink | `#020520` | 2 5 32 | "ecomp" in the full logo |
| White | `#FFFFFF` | 255 255 255 | The "r" on the tile, the wordmark on dark backgrounds |

These are the `primary` and `ink-strong` tokens in `app/globals.css`. For print, convert from the HEX
and check a proof: no Pantone match has been chosen.

## Clear space and minimum size

- Keep clear space around the logo equal to the width of the "r" stem: 14% of the symbol's height.
- Symbol: down to 16 px. At 32 px and below, use `recomp-symbol-small.svg`.
- Horizontal lockup: at least 120 px wide. Below that, use the symbol alone.

## Backgrounds

- Light backgrounds (`bg`, white, `wash`): the full-colour files.
- Dark backgrounds: `recomp-horizontal-reversed.svg`, or the symbol as is (the tile carries its own colour).
- Photos or busy backgrounds: put the logo on a white or blue panel first.

## Don't

- Close the gap between the stem and the shoulder. The gap is the idea.
- Retype the wordmark in a font. The letters are drawn; Inter is for the UI, not the logo.
- Recolour the tile, add gradients, shadows or outlines, or stretch, rotate or crop the mark.
- Put the blue tile on a blue background without white space around it.

## Intro animation

`logo/intro-preview.html` plays the full logo in order: the blue stem rises, the shoulder slides in
and joins it, then "ecomp ai" comes out from behind the "r" (about 1.2 s). In
`recomp-horizontal.svg` the parts carry `id="stem"`, `id="shoulder"` and `id="wordmark"`, so the
same file can be animated in the app. It turns off with `prefers-reduced-motion`. The app plays
the same sequence (see below); it isn't in the PRD, so drop it if the team says no.

## In the app

- `components/layout/logo.tsx`: `FullLogo` (the SVG) and `Logo` (the SVG as a link home), used by the
  navbar, footer, sidebar and app top bar. Colours come from the `fill-primary` and `fill-ink-strong`
  tokens. The path data is in `components/layout/logo-paths.ts`, copied from `recomp-horizontal.svg`.
- `app/favicon.ico`, `app/icon.svg` and `app/apple-icon.png`: Next.js adds the `<link>` tags.
- `components/layout/intro.tsx`: the intro on the first page of a visit, once per browser tab
  (`sessionStorage`). Skipped with reduced motion. Styles at the end of `app/globals.css`.
