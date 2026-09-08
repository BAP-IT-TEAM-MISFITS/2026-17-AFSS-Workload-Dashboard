# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Red Adair fire-safety technicians and operations staff. They check the CFSP (fire safety) job backlog, past-due jobs, and workload across three SimPRO companies (RM AFSS, CHUBB/AFAC AFSS, AE Evac Procedure Audits) as part of their daily operational work. Internal tool only — no external clients or customer-facing use.

## Product Purpose

Tracks CFSP job backlog by pulling live data from SimPRO, enriching it with site/schedule details, and presenting it as a per-company backlog table plus an aggregate analytics dashboard, so ops staff can see workload, past-due jobs, and technician assignments without going into SimPRO directly.

## Positioning

Internal operational tool, not a market-facing product — no competitive positioning applies.

## Operating Context

- Data source: SimPRO REST API v1.0 (live job/schedule/cost-centre data).
- Auth: Google Workspace SSO gated to a specific Workspace group (`technicalafss-deployment@redadair.com.au`), enforced in `middleware.ts` / `app/lib/auth.ts` — out of scope for this restyle.
- Hosting: Google Cloud Run (`australia-southeast1`), Next.js 16 App Router, Tailwind CSS v4.
- Sibling internal tool **FPOWS** (REDMEN Fire Protection simPRO Automation Platform, same org) has an established visual identity that this restyle adopts: dark navy glass control bar, red/crimson (`#cc2222` / `#e63946`) brand accents, Inter typeface, card-based white content areas over a light-gray page background, styled data tables, capsule status pills.

## Capabilities and Constraints

- Pages in scope for restyle: `app/page.tsx` (backlog table), `app/dashboard/page.tsx` and `app/dashboard2/page.tsx` (analytics dashboards), `app/login/page.tsx`, `app/components/UserBar.tsx`, `app/globals.css`, `app/layout.tsx`.
- **Out of scope / must not change:** `middleware.ts`, `app/lib/auth.ts`, any auth/session logic, and all data-fetching, filtering, drill-down, and CSV-export behavior. This is a visual-only restyle — data and how it works must never be touched, only presentation.
- Existing AFSS branding (product name "AFSS Backlog", Red Adair Evacuation and Fire Audits logos) is preserved as-is; only the visual language (color, type, components, layout treatment) changes to match FPOWS.

## Brand Commitments

- Product name stays "AFSS Backlog." Existing logos (`/logo-evacuation.png`, `/logo-fire-audits.png`) stay and keep their current meaning/placement role.
- Visual world is deliberately aligned to FPOWS's established look (see Operating Context) rather than an original direction — this is a directed restyle, not free creative exploration.

## Evidence on Hand

- FPOWS reference implementation cloned locally at the path noted in the restyle request (its `index.html` inline `<style>` block) — real, current CSS from a live sibling tool, not a mockup.
- Live SimPRO-backed data already renders correctly on the incumbent (unstyled) AFSS pages; no placeholder/fabricated data involved.

## Product Principles

1. Data integrity and existing behavior are non-negotiable — every filter, drill-down, export, and computed figure must work identically after the restyle.
2. Visual identity should read as clearly related to FPOWS (same design family) without literally becoming FPOWS or renaming AFSS.
3. Because this is an internal ops tool (Operate mode), scanability and consistency of the dense data tables outrank decorative flourish.
4. Auth and middleware are frozen — no visual change may require touching `middleware.ts` or `app/lib/auth.ts`.

## Accessibility & Inclusion

No product-specific requirement established beyond standard web accessibility practice (the dark control bar and status-pill colors must keep sufficient contrast).
