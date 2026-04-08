# Issue 17 Plan: Watercolor Aesthetic Prototype

## Goal

Create a standalone, reviewable watercolor prototype route that uses real household board data to explore WeDo's art direction: multiple typography directions, watercolor completion treatment, sketched checkbox treatment, translucent layered surfaces, and an iPad-landscape composition that feels like household art rather than styled software.

## Scope

This plan covers:

- a prototype-only UI route for the watercolor study, checked into the existing React app
- prototype-specific presentation components and CSS needed to explore the visual language without replacing the production dashboard
- use of the existing board data flow so the prototype renders real seeded family names and task titles rather than invented placeholder copy
- automated coverage for the new route and its key visible prototype affordances
- Playwright-based local visual verification and captured screenshots for review

## Non-Goals

This slice does not cover:

- replacing the current dashboard route or fully rolling the prototype styling into the production board
- changing persistence, realtime, or service-layer behavior
- introducing new fonts that require external network fetches or a broader asset licensing decision unless the implementation can stay self-contained in-repo
- redesigning single-list, settings, or non-prototype routes beyond the minimum navigation seam to reach the prototype
- finalizing every visual choice for FEAT-014; this route is a study surface that makes the follow-up implementation safer

## Current Context And Gaps

- `PROTO-001` explicitly asks for a standalone prototype page or sandbox route, not a direct replacement of the product dashboard.
- The current dashboard already leans paper-like, but it still uses one typography direction and the production component set rather than a prototype study surface with 2-3 typography explorations.
- The repository asks for a Bridget briefing, but there is no Bridget tool and no checked-in `docs/alexandria/implementation-plans/wedo-v1/CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, ticket doc, ADRs, current UI code, and seeded household data are the available context briefing sources.
- The visual language standard requires custom rendering and explicitly rejects default UI toolkit styling, flat fills, pure white, and red/orange urgency signals.
- The issue acceptance criteria require screenshots, so the implementation needs a path that can be opened locally and captured through Playwright/Chrome.

## Affected Layers And Boundaries

- `ui/routes/`: owns the standalone prototype route and route registration
- `ui/components/`: may gain prototype-only presentational components or helper composition for the study surface
- `ui/index.css`: owns prototype art-layer styling, typography tokens, watercolor textures, and layout treatment
- `tests/unit/ui/`: route-level markup assertions for the prototype seam
- `tests/e2e/`: browser-level verification that the prototype renders at iPad-ish landscape dimensions

What does not belong in this slice:

- changes to `db/`, `services/`, `workers/`, or `realtime/` behavior
- new API contracts or schema changes
- production dashboard behavior changes beyond a minimal link or route registration seam if needed

## Slice Strategy

This PR lands one reviewable seam: "add a prototype-only watercolor study route that reuses real board data." That seam is reviewable on its own because it isolates the visual exploration requested by `PROTO-001` without coupling it to a production dashboard rewrite.

Deferred follow-up seam:

- choosing which prototype treatments graduate into the production dashboard in `FEAT-014`
- any custom font asset packaging or broader typography system once a direction is selected
- deeper motion or render-technology experiments if CSS/SVG studies reveal a need for canvas or additional assets

## Implementation Steps

1. Add `docs/plans/17/plan.md` before substantial implementation and keep the route scope aligned with this plan.
2. Inspect the existing route tree and board state access pattern, then register a standalone prototype route that can reuse the ready board data for the selected day.
3. Build prototype-only UI composition for:
   - an iPad-landscape dashboard study using all six person columns
   - 2-3 typography explorations shown side by side or in a dedicated study panel
   - watercolor completion rings and highlights with more organic opacity/layering than the production dashboard
   - sketched checkbox treatment that is clearly custom and non-OS-like
4. Add prototype-specific CSS variables/effects for warm off-white paper, translucent washes, soft edges, and subtle motion or stagger where it supports the study.
5. Ensure the prototype route remains accessible and navigable without becoming the default home route.
6. Add route-level unit coverage for the prototype path and assertions for its visible study affordances.
7. Add or update a Playwright scenario to open the prototype in an iPad-like viewport and verify the route renders household data and prototype labels; capture screenshots during manual verification.

## Tests And Acceptance Scenarios

Planned checks:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

Not currently planned unless implementation crosses boundaries unexpectedly:

- `npm run test:struct`
  Reason: this slice stays inside `ui/` and tests; no new cross-layer imports are expected, though the check can be added if the route composition introduces any ambiguity.

Acceptance scenarios:

- visiting `/prototype/watercolor` renders a dashboard-like composition with six household columns and real task names from the seeded board
- the page exposes at least 2-3 typography studies, making the comparison explicit instead of implying it
- completion rings, checkbox treatment, and checked-task highlights read as watercolor/sketched treatments rather than default controls
- the prototype looks intentional at an iPad-landscape viewport and avoids hard borders, pure white, and alarm colors
- screenshots can be captured locally for review without relying on external design tools

## Risks And Open Questions

- The current app font stack is limited to locally available fonts. The prototype should explore clearly distinct typography directions without creating a hidden dependency on external CDNs unless a local asset path is added intentionally.
- Because this is a study surface, there is a risk of overfitting the prototype with implementation detail that should wait for `FEAT-014`. The route should stay explicitly exploratory and isolated.
- If the real seeded data is not varied enough to show the typography and spacing tradeoffs clearly, the prototype may need small study labels or annotations rather than fake product data.
- Screenshot capture is partly a workflow concern rather than a code artifact. The final implementation should leave the route easy to capture and note where the screenshots were produced.

## Exit Criteria

This slice is done when:

- the repo contains a checked-in plan at `docs/plans/17/plan.md`
- a standalone `/prototype/watercolor` route exists and renders prototype art direction against real board data
- the route visibly includes multiple typography explorations plus watercolor/sketched treatments requested by the issue
- relevant automated checks pass
- the prototype has been opened locally in a browser at an iPad-like viewport and screenshots have been captured for review
