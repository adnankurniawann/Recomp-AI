# Design system (v2)

How to build the Recomp AI look in code. The spec (what each token means, which component
exists) is [PRD §9](PRD.md#9-sistem-desain-tema-terang-v2); this page is how to implement it. If the
two disagree, the PRD wins and this page gets fixed. Why v2 replaced v1.1:
[ADR 0008](adr/0008-design-v2-one-blue-dense-product-ui.md).

**Mock:** [Recomp AI design mock](https://claude.ai/artifact/4pRV1n972hBxnxRHeWmLh9), four
artboards: tokens and components, landing, team dashboard with ranking, phone. It is private
until its owner shares it from the page's Share menu.

## The look in one paragraph

A near-white canvas and one brand colour, royal blue `#145AFF`. Everything else is neutral ink.
Role and status colours appear only as 6 px dots, thin bars and small chips. Buttons are 10 px
rounded rectangles, usually outlined with an icon; chips and badges are pills. Cards are white
with a 1 px `line` border, 16 px radius and an almost invisible shadow. Headings are Inter 600 with
tight tracking; numbers (scores, counts, prices, IDs) are JetBrains Mono. Logged-in pages use a
left sidebar; public pages use a top navbar. The landing shows the product itself, not
illustrations.

## Tailwind v4 theme

Put this in `app/globals.css`. Never hardcode a colour, radius or shadow outside it.

```css
@import "tailwindcss";

@theme {
  --color-bg: #FCFCFC;
  --color-surface: #FFFFFF;
  --color-surface-2: #F1F5F9;
  --color-wash: #F0F4FE;
  --color-line: #E2E8F0;
  --color-line-strong: #CBD5E1;
  --color-ink-strong: #020520;
  --color-ink: #14141E;
  --color-ink-2: #374151;
  --color-ink-3: #6B7280;

  --color-primary: #145AFF;
  --color-primary-hover: #1048CC;
  --color-primary-200: #DCE6FF;

  --color-success: #16A34A;
  --color-success-ink: #15803D;
  --color-success-50: #F0FDF4;
  --color-danger: #F26052;
  --color-danger-ink: #B42318;
  --color-danger-50: #FEF3F2;
  --color-warning: #F59E0B;
  --color-warning-ink: #9A5B00;
  --color-warning-50: #FFFBEB;

  --color-role-backend: #0284C7;
  --color-role-backend-soft: #E0F2FE;
  --color-role-backend-ink: #075985;
  --color-role-frontend: #16A34A;
  --color-role-frontend-soft: #F0FDF4;
  --color-role-frontend-ink: #15803D;
  --color-role-uiux: #DB2777;
  --color-role-uiux-soft: #FCE7F3;
  --color-role-uiux-ink: #BE185D;
  --color-role-data: #7A5AF8;
  --color-role-data-soft: #F1EDFF;
  --color-role-data-ink: #6941C6;
  --color-role-product: #EA580C;
  --color-role-product-soft: #FFEDD5;
  --color-role-product-ink: #9A3412;
  --color-role-business: #0E9F9A;
  --color-role-business-soft: #E5F6F5;
  --color-role-business-ink: #0F766E;
  --color-role-other: #6B7280;
  --color-role-other-soft: #F1F5F9;
  --color-role-other-ink: #374151;

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 40px;

  --shadow-xs: 0 1px 2px rgba(2, 5, 32, 0.06);
  --shadow-primary: 0 1px 2px rgba(20, 90, 255, 0.25);
  --shadow-pop: 0 12px 32px rgba(2, 5, 32, 0.12);
  --shadow-glow: 0 0 100px -28px rgba(20, 90, 255, 0.35);
}

body { @apply bg-bg text-ink font-sans antialiased; }
```

Load Inter (400, 500, 600) and JetBrains Mono (500) with `next/font/google`, `display: "swap"`,
as the `--font-inter` and `--font-jetbrains` variables. No weight 700 anywhere.

Role colours are looked up by `color_key` in `lib/constants.ts`, one object per role with the
`solid`, `soft` and `ink` class names, so components never build class names from strings.

## Contrast (WCAG AA needs 4.5:1 for body text)

Measured, not guessed. Re-run the check when a colour changes.

| Text | On | Ratio |
| --- | --- | --- |
| `ink` `#14141E` | `bg` | 17.8:1 |
| `ink-2` `#374151` | `surface-2` | 9.4:1 |
| `ink-3` `#6B7280` | `bg` | 4.7:1 |
| `ink-3` `#6B7280` | `surface-2` | **4.4:1, fails: don't** |
| white | `primary` | 5.3:1 |
| `primary` | `bg` | 5.2:1 |
| `primary-hover` | `wash` | 6.8:1 |
| `success-ink` | `success-50` | 4.8:1 |
| `danger-ink` | `danger-50` | 6.1:1 |
| `warning-ink` | `warning-50` | 5.2:1 |
| role `ink` | role `soft` | 4.8:1 (frontend) to 6.6:1 (backend) |

Solid colours (`success`, `danger`, `warning`, role solids) are for dots, bars and borders only.
Coloured text always uses the `-ink` shade.

## Component recipes

Starting points for `components/ui`. Sizes come from PRD §9.4.

| Component | Classes |
| --- | --- |
| `Button` primary | `h-10 px-4 rounded-md bg-primary text-white font-medium shadow-primary hover:bg-primary-hover inline-flex items-center gap-2` |
| `Button` secondary | `h-10 px-4 rounded-md border border-line bg-surface text-ink font-medium shadow-xs hover:border-line-strong` |
| `Button` accent | secondary with `text-primary` |
| `Button` sm | `h-8 px-3 rounded-sm text-[13px]` |
| Focus ring (all controls) | `focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200` |
| `Card` | `rounded-xl border border-line bg-surface shadow-xs p-4` (lg: `p-6`) |
| `StatusBadge` | `h-[26px] px-2.5 rounded-full border border-line bg-surface text-xs font-medium inline-flex items-center gap-1.5`, dot `size-1.5 rounded-full`, text in the tone's `-ink` |
| `SimulatedBadge` | `rounded-full border border-dashed border-warning bg-warning-50 text-warning-ink text-xs font-medium px-2` |
| `Chip` (role) | `h-7 px-2.5 rounded-full bg-role-X-soft text-role-X-ink text-[13px] font-medium`, dot `bg-role-X` |
| `SegmentedTabs` | wrapper `p-[3px] rounded-md bg-surface-2 inline-flex gap-0.5`; active item `rounded-sm bg-surface text-primary shadow-xs` |
| `SectionLabel` | `font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3` |
| `ScoreBadge` | `h-[30px] px-2 rounded-sm border border-line bg-surface inline-flex items-center gap-1.5`, dot ≥ 80 `bg-success`, 60–79 `bg-primary`, < 60 `bg-warning`, number `font-mono text-[15px] text-ink-strong` |
| Numbers | `font-mono tabular-nums` |

## Do and don't

Do:

- One filled `primary` button per page. Everything else is secondary, accent or ghost.
- Put the product on the landing: the hero preview is real components with simulated data.
- Keep gaps inside components at 8–12 px and between cards at 16 px.
- Give every icon-only button an `aria-label`.

Don't:

- No dot patterns, blurred colour blobs, moving chips or dark sections.
- No pill-shaped buttons; pills are for chips and badges.
- No `ink-3` text on `surface-2`.
- No logos, photos, illustrations or copy from GDGoC ITB, Google, Skilvul, Relate or any other
  product we looked at.
- No dark mode in this version (PRD §4.2).

## Reviewing UI changes

Use [docs/agents/ui-review.md](agents/ui-review.md) before opening a PR that changes a screen.
