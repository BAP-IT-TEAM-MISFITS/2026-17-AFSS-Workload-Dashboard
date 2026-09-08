---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/dashboard/page.tsx","app/dashboard2/page.tsx","app/login/page.tsx","app/components/UserBar.tsx"]
---

## Direction contract

THESIS: Every AFSS screen reads as the same operational command console FPOWS technicians already trust — dense job data held inside a dark-glass control shell — refusing the generic light-Tailwind admin-template default the app currently has.

OWN-WORLD: Sticky dark-glass control bar (navy `#1a1a2e` at 85% opacity, `blur(20px) saturate(180%)`, hairline white-10% border); brand red/crimson (`#cc2222` solid, `#e63946` accent, `linear-gradient(135deg,#ff4d5a,#e63946)` on primary buttons with a red glow shadow); Inter typeface at 300–800 weights; light-gray page ground (`#f0f2f5`); white content cards (16px radius, `0 30px 90px rgba(0,0,0,.12)`, 1px hairline border); dark table headers (`#2c2c2c`, white uppercase labels) with striped rows (`#f9f9f9`); capsule status pills (dark fill + colored border + colored text, one palette per state).

STORY: A technician opens the backlog, instantly reads job status from color-coded pills and past-due counts, filters by company/stage through the dark control bar, drills into raw data inside a white card, and exports CSV — the shell matches FPOWS closely enough that moving between the two internal tools feels like one product family.

FIRST VIEWPORT: A shared session bar (`UserBar.tsx`, same dark-glass system) sits above every authenticated page, carrying the Red Adair Evacuation/Fire Audits logos centered and the signed-in user's email + sign-out control. Directly below it, `app/page.tsx` renders its own sticky dark-glass control bar — AFSS BACKLOG wordmark left, company dropdown + Dashboard select + Pending/Progress stage-toggle buttons center-left, job-count pill + last-updated + primary red Download CSV CTA right — over the `#f0f2f5` ground. No free-text search control exists in the product (filtering is by company/stage dropdown and tabs only); this corrected line replaces an earlier draft that incorrectly named a "search" element that was never built. Below the control bar, a white rounded card holds the job count/summary line and the backlog table with its dark header row and pill-badged status column.

FORM: Directly inherited from FPOWS's real, shipping implementation — a brief-pinned direction, not a generated one. No concept tournament run (none applies to a pinned sibling system). Seed key: N/A (pinned).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
