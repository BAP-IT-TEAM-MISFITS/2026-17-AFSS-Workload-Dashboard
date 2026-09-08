---
name: AFSS Backlog
description: Dense SimPRO-backed job-backlog and workload dashboard for Red Adair fire-safety technicians, restyled to the FPOWS dark-glass command-console family.
colors:
  brand-red: "#cc2222"
  brand-accent: "#e63946"
  brand-gradient-start: "#ff4d5a"
  control-bar-navy: "#1a1a2e"
  page-ground: "#f5f5f5"
  foreground: "#171717"
  card-surface: "#ffffff"
  table-header: "#2c2c2c"
  table-stripe: "#f9f9f9"
  table-hover: "#fdeceb"
  table-border: "#e8e8e8"
  pill-neutral-bg: "#23233b"
  pill-neutral-text: "#8e99c5"
  pill-neutral-border: "#3d3d5c"
  pill-info-bg: "#1a3a5c"
  pill-info-text: "#7ec8f5"
  pill-info-border: "#3498db"
  pill-success-bg: "#102e1f"
  pill-success-text: "#52cc8a"
  pill-success-border: "#27ae60"
  pill-error-bg: "#2e1010"
  pill-error-text: "#cc5252"
  pill-error-border: "#c0392b"
  pill-warning-bg: "#3a2c0f"
  pill-warning-text: "#f0b84d"
  pill-warning-border: "#b8860b"
typography:
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 700
    letterSpacing: "0.3px"
    fontFeature: "uppercase"
  data-cell:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  control: "10px"
  card: "16px"
  pill: "20px"
  swatch: "2px"
spacing:
  control-bar-y: "10px"
  control-bar-x: "16px"
  cell-x: "12px"
  cell-y: "8px"
components:
  button-primary:
    backgroundColor: "{colors.brand-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "40px"
  button-outline:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "#cccccc"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "40px"
  input-dark:
    backgroundColor: "rgba(255,255,255,0.05)"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    height: "40px"
  pill-neutral:
    backgroundColor: "{colors.pill-neutral-bg}"
    textColor: "{colors.pill-neutral-text}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.card-surface}"
    rounded: "{rounded.card}"
---

# Design System: AFSS Backlog

## Overview

**Creative North Star: "The Fire-Safety Command Console"**

AFSS Backlog is a directed restyle onto a sibling internal tool's (FPOWS) established look, not an original creative direction: a dense operational data console housed inside a dark-glass control shell, with content living on white cards over a light-gray ground. The build confirms the pinned world faithfully — sticky dark-navy glass bar, red/crimson brand accent, Inter throughout, striped dark-headed tables, capsule status pills — and adds nothing beyond it. Density is the point: every table in this system (backlog rows, dashboard grids) carries far more columns than fit a viewport comfortably, and the system does not fight that; it manages it with sticky headers, horizontal scroll, and small, consistent type rather than by simplifying the data.

The dashboards (`dashboard`, `dashboard2`) preserve a pre-existing spreadsheet/report structure (multi-row `rowSpan`/`colSpan` grid headers) — this build only reskinned that structure's chrome and color to match FPOWS; the structural density itself is inherited, not a new design decision, and should not be read as a "signature grid" pattern to imitate on non-tabular surfaces.

**Key Characteristics:**
- Dark-glass sticky control bar as the one fixed chrome element on every authenticated screen (shared via `UserBar.tsx` plus each page's own control bar).
- Brand red/crimson reserved for primary actions, focus rings, and small brand marks — never for body text or large fills.
- White, single-radius cards as the only content container; no secondary container styles.
- Capsule pills as the sole status/count-encoding device — no badges, no colored underlines, no icon-only status marks.
- Dense tables are a first-class citizen: small type, tight padding, sticky headers, striped rows, no attempt to "air out" the data.

## Colors

The palette is a small, fixed brand-red-on-dark-navy-glass system laid over a light neutral page, with a five-way pill palette used exclusively for status/state encoding.

### Primary
- **Command Red** (`#cc2222`): the solid brand mark color — small swatches (company indicator dots in the backlog dropdown) and the "BACKLOG" wordmark accent tint.
- **Signal Crimson** (`#e63946`): the operative accent — focus-ring color, active-state borders (`data-active="true"` outline buttons), spinner arc, "Syncing…" text, and the base of the primary-button gradient.
- **Ember Gradient** (`linear-gradient(135deg, #ff4d5a, #e63946)`): the primary-button and CTA-badge fill exclusively; paired with a matching red-tinted glow shadow (`0 4px 15px rgba(230,57,70,0.3)`, brightening on hover).

### Neutral
- **Console Navy** (`#1a1a2e`): the control-bar glass base (used at 85% opacity with `blur(20px) saturate(180%)`) and the full-bleed background on the login screen.
- **Ground Gray** (`#f5f5f5`): the page background beneath every white card, on every authenticated screen. (Adjusted from an earlier `#f0f2f5` after user feedback that the cooler/bluer tint read poorly against the table cells that inherit the page background directly.)
- **Card White** (`#ffffff`): the sole content-container background.
- **Ink** (`#171717`): default body foreground on the light ground.
- **Header Charcoal** (`#2c2c2c`): table header row fill (backlog and both dashboards), always paired with white uppercase labels.
- **Stripe Gray** (`#f9f9f9`) / **Hover Blush** (`#fdeceb`): alternating-row and hover states on data tables, the latter tinted toward the brand red family rather than a neutral gray.
- **Hairline** (`#e8e8e8`): table cell and card borders throughout.

### Named Rules
**The Red-Is-Rare Rule.** Brand red/crimson appears only on: the primary CTA, focus rings, active-toggle borders, small identifying swatches, and the spinner. It never fills a card, a table, or body text — its rarity against the navy glass and white cards is what keeps it legible as "the action color."

### Status/Data-Encoding Colors (not part of the decorative palette)
The dashboard's `STATUS_ROWS` (green `#166534` "Scheduled", blue `#2563eb` "Awaiting Client Info", brown `#92400e` "Tentative", gray `#64748b` "Attendance Complete") are a fixed semantic legend for job-status data, not a decorative color choice — treat this four-color mapping as data encoding to preserve verbatim if the dashboard is extended, not as a general-purpose accent set. Similarly, each backlog row's status-pill border/text/dot color is read live from SimPRO's own `Status.Color` field per job — the pill *shape* (`.afss-pill-neutral` capsule) is the system token; the *color inside it* is inherited data, not a fixed token.

## Typography

**Body/UI Font:** Inter (with system sans-serif fallback), loaded via `next/font/google` at weights 300–800.

**Character:** A single-family system with no display face — Inter carries everything from the wordmark to table cells, differentiated only by size, weight, and case, which suits a dense operational console over an editorial one.

### Hierarchy
- **Title** (700, `text-xl`/`text-xl` ~1.25rem): dashboard section headers ("TECH TEAM WORKS") and card headings ("Access Denied"); bold, high-contrast on dark charcoal fills.
- **Body** (400–600, `text-sm` ~0.875rem): control-bar labels, page sub-headers, card body copy.
- **Data cell** (400, `text-xs` ~0.75rem): the dominant size across every table — backlog rows, dashboard grids — chosen for density over legibility headroom; always paired with `whitespace-nowrap`/`truncate` and a `title` attribute for overflow.
- **Label** (700, `0.68rem`, `letter-spacing: 0.3px`, uppercase): status pills and table header cells (`.afss-table thead th`) — the only uppercase, tracked text in the system.

### Named Rules
**The One-Family Rule.** There is no second (display/serif/mono) typeface anywhere in the shipped build. Every weight from 300–800 is Inter; new surfaces should not introduce a display face.

## Layout

The system is a fixed-header, scrollable-body shell repeated on every page: a sticky dark-glass control bar pinned to the top (`position: sticky; top: 0; z-index: 40`), a thin sub-header line naming the current view, then a flex-1 scrollable region holding one white card. `UserBar.tsx` adds a second, outer sticky bar (session identity + logos) above each page's own control bar, so authenticated screens carry two stacked dark-glass bars: identity above, page controls below.

Control bars use `flex flex-wrap items-center gap-3` so filters/toggles/actions reflow rather than break the bar height; a `flex-1` spacer pushes status/count/CTA elements to the right edge. Tables intentionally exceed viewport width (`minWidth: 1800px` on the backlog table) and rely on the card's own `overflow: hidden` plus an outer `overflow-auto` wrapper, not on hiding columns — density is preserved over responsiveness on the two dashboard/backlog surfaces. The login page is the one exception: a single centered card (`max-w-sm`/`max-w-md`) on a full-bleed navy background, no control bar.

## Elevation & Depth

Depth is conveyed through soft, diffuse ambient shadows plus glass blur — never hard-offset or neobrutalist shadows. The control bar is a frosted-glass plane (`backdrop-filter: blur(20px) saturate(180%)` at 85% navy opacity) sitting above the page; cards float on a large, soft ambient shadow; the primary button carries a tinted (red) glow shadow rather than a neutral one.

### Shadow Vocabulary
- **Glass bar** (`box-shadow: 0 8px 32px rgba(0,0,0,0.2)`, `backdrop-filter: blur(20px) saturate(180%)`): the sticky control bar's separation from page content below it.
- **Card ambient** (`box-shadow: 0 30px 90px rgba(0,0,0,0.12)`): the large, soft lift under every white content card — diffuse, not directional.
- **Brand glow** (`box-shadow: 0 4px 15px rgba(230,57,70,0.3)`, intensifying to `0 6px 20px rgba(230,57,70,0.45)` on hover): exclusive to the primary/gradient button and CTA-style icon badges.

### Named Rules
**The Soft-Glow-Only Rule.** Every shadow in the shipped build is large-radius and diffuse (ambient card lift, glass-bar blur, tinted button glow). Don't introduce hard-offset/neobrutalist shadows (e.g. `4px 4px 0`) — that vocabulary doesn't exist anywhere in this build.

## Shapes

Two radius families cover the whole system: a **control radius** (10px) for buttons, inputs, and the dropdown-open panel; and a **card radius** (16px) for the one content-container shape. Status pills use a full capsule radius (20px, effectively pill-shaped at their height). Small square company-color swatches in the view-picker dropdown use a near-square 2px radius (`rounded-sm`) — the one place the system uses a hard corner, reserved for tiny (10px) inline data-identity chips, not for any container. Borders are uniformly 1px hairlines (`#e8e8e8` on light surfaces, `rgba(255,255,255,0.1)`/`#3d3d5c` on dark glass) — no thick or colored container borders outside the active-state outline button and pill borders.

## Components

### Buttons
- **Shape:** 10px radius, 40px fixed height, `inline-flex` with 8px icon/label gap.
- **Primary** (`.afss-btn`): white text on the red gradient fill, red-tinted glow shadow, `font-weight: 600`, `0.85rem`. Used for the single dominant action per screen (Download CSV).
- **Outline** (`.afss-btn-outline`): translucent white-5% fill, `#4d4d70` border, `#ccc` text; hover lightens fill/border/text; an explicit `data-active="true"` state (used for stage tabs) swaps to a red-tinted fill and border. This is the system's only selected/toggle-button treatment.
- **Compact** (`.afss-btn-sm`): same gradient as primary, used only for inline actions inside dense table rows/toolbars; brightens on hover instead of lifting, since it lacks room for a transform.

### Chips / Pills
- **Style:** capsule (20px radius), `0.68rem` bold uppercase text, 3px/12px padding, always a colored 1px border matching the semantic fill/text triad.
- **Variants:** neutral, info, success, error, warning — each a dark fill + saturated border + tinted text triad (never a solid saturated fill). This is the system's only status/count-encoding device; do not introduce a second badge style.

### Cards / Containers
- **Corner Style:** 16px radius, `overflow: hidden`.
- **Background:** white only.
- **Shadow Strategy:** ambient card shadow (see Elevation & Depth); 1px `rgba(0,0,0,0.05)` hairline border in addition to the shadow.
- **Internal Padding:** cards hosting tables have no internal padding (the table fills edge-to-edge); cards hosting forms/messages use `p-8`.

### Inputs / Fields
- **Style:** 10px radius, 40px height, translucent white-5% fill with a white-10% border, white text — styled specifically for the dark control-bar context (`.afss-control-bar select.afss-input`); there is no light-surface input variant in the shipped build.
- **Focus:** border shifts to Signal Crimson, background deepens to `#2a2a45`, plus a 3px red-tinted focus ring (`box-shadow: 0 0 0 3px rgba(230,57,70,0.15)`). Generic `:focus-visible` elsewhere uses a 2px crimson outline, lightened to `#ff7d86` specifically inside the control bar for contrast against navy.

### Navigation
- The control bar itself is the navigation surface: a wordmark, a company/view dropdown (custom-built, not a native `<select>`, with its own dark dropdown panel `#1a1a2e`/`#3d3d5c`), a native `<select>` for cross-dashboard navigation, and stage-toggle outline buttons. No separate sidebar, tab strip, or breadcrumb exists anywhere in the build.
- `UserBar.tsx` is a second, session-scoped nav bar (identity + logos + sign-out) stacked above every page's own control bar, sharing the same glass treatment but its own neutral pill for the product name.

### Tables (signature component)
Every data surface in this system is a dense table: dark charcoal header (`#2c2c2c`, white uppercase text), 1px `#e8e8e8` borders on every cell, even-row striping (`#f9f9f9`), and a red-tinted row hover (`#fdeceb`) instead of a neutral gray hover. The backlog table adds a sticky `<thead>` and capsule status pills in the Status column (colored from live SimPRO data); the dashboard tables preserve pre-existing `rowSpan`/`colSpan` report-grid headers, reskinned to the same charcoal/white treatment but structurally unchanged from before the restyle.

## Do's and Don'ts

### Do:
- **Do** keep brand red/crimson confined to primary actions, focus states, and small identity marks (The Red-Is-Rare Rule).
- **Do** use the 10px control radius for every interactive control and the 16px card radius for every content container — no third radius scale.
- **Do** render status/state exclusively as capsule pills with a dark-fill + colored-border + colored-text triad, never a solid saturated fill.
- **Do** keep dashboard `STATUS_ROWS` and per-job status-pill colors as data-driven semantic encoding — preserve their meaning if the dashboard is extended, don't restyle them decoratively.
- **Do** use soft, large-radius ambient shadows and glass blur for depth; keep the tinted glow shadow exclusive to the primary/gradient button.

### Don't:
- **Don't** introduce hard-offset/neobrutalist shadows — no shadow in this build has a small, non-blurred offset.
- **Don't** add a second typeface; Inter (300–800) is the only family used across the whole build.
- **Don't** invent a new badge/chip shape for status or counts — the capsule pill is the system's only device for that job.
- **Don't** treat the dashboard's inherited `rowSpan`/`colSpan` report-grid density as a pattern to imitate on new, non-tabular surfaces — it's a preserved structural artifact of the pre-existing dashboards, not a chosen signature layout.
