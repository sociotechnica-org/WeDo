# Issue 15 Plan: Playwright E2E Suite Stabilization

## Goal

Land a reviewable FEAT-015 slice that turns the existing Playwright coverage into a deterministic, local end-to-end suite for the WeDo critical paths: seeded dashboard render, dashboard-to-single-list navigation, task toggling with persistence, natural-language task creation, and the main day / settings flows that FEAT-015 depends on.

## Scope

This slice includes:

- a checked-in implementation plan for issue `#15`
- Playwright support changes needed to keep local D1 state isolated between e2e tests
- a dedicated Cloudflare `e2e` runtime mode for deterministic local natural-language task creation so Playwright can exercise the Worker, service, Durable Object, and D1 stack without browser-side app-route mocking or a production-exposed bypass
- Playwright spec and config updates needed to use those local support hooks while preserving the real browser flow

## Non-Goals

This slice does not include:

- replacing the Anthropic-backed production task parser with a different v1 product architecture
- new dashboard, single-list, settings, realtime, recurrence, skip-day, or streak features
- broad CI workflow work beyond what is required for the checked-in Playwright suite itself
- visual redesign work outside of the existing FEAT-014 surfaces the tests already touch

## Current Context And Gaps

- `tests/e2e/home.spec.ts` already covers the major user journeys expected from FEAT-015, but one path (`Add task`) currently depends on a browser-added request override to force the local stub parser path.
- The current Playwright server setup seeds D1 once at web-server startup. Because the suite mutates shared state, later tests inherit earlier writes. That makes the suite order-dependent and less reviewable as a true regression gate.
- `Standard - Engineering Methodology` and `Standard - Project Structure` treat Playwright as the required end-to-end and visual QA loop, so the suite needs to be deterministic enough for repeated local execution.
- The repo asks for a Bridget briefing, but no Bridget tool or checked-in briefing artifact exists in this workspace. For this slice, Alexandria cards plus the current code are the available product context source.

## Affected Layers And Boundaries

- `src/config/`: owns the runtime binding that selects live vs. deterministic local parser behavior
- `src/services/`: may own a test-only deterministic NL parsing branch because parsing policy belongs in services, not in UI tests
- `src/workers/`: should pass runtime config into the service layer but should not absorb business logic or local-only bypass policy
- `tests/e2e/`: owns Playwright fixtures and assertions for the browser-driven flows
- `wrangler.jsonc` / Playwright config: may select the dedicated local `e2e` environment used for the suite

Boundary rules preserved:

- no imports that violate `types -> config -> db -> services -> workers/realtime -> ui`
- D1 remains the durable source of truth; no in-memory-only test state replaces persisted behavior
- any e2e-only support path must be explicitly scoped so production behavior stays Anthropic-backed by default and cannot be enabled by arbitrary production requests

## Slice Strategy

This PR lands one seam: "make the checked-in Playwright suite a deterministic local full-stack gate for the core v1 household flows." That seam is reviewable on its own because it does not change the user-facing product scope; it makes the existing acceptance suite trustworthy and locally runnable.

Deliberately deferred:

- extra Playwright coverage beyond the current critical paths already represented in `home.spec.ts`
- remote CI/pipeline refinements that are not required to prove the local suite
- any broader fallback-parser product decision outside of the explicit e2e support need

## Implementation Steps

1. Add `docs/plans/15/plan.md` so the issue has the required checked-in plan aligned to the actual PR seam.
2. Move deterministic parser selection to explicit runtime configuration, keeping the default environment in live mode and providing a dedicated `e2e` environment for the Playwright server.
3. Add Playwright test setup that reseeds local D1 before each test so stateful flows stay isolated and repeatable.
4. Update the e2e spec to use the runtime-selected local support path for natural-language task creation while preserving the real browser interaction and persistence assertions.
5. Run the required local checks, execute the e2e suite in Chrome, and visually verify the covered flows at an iPad-like landscape viewport.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome through Playwright at an iPad-like landscape viewport
- confirm the dashboard renders the seeded household data with the watercolor UI intact
- confirm dashboard-to-single-list navigation, toggling, day navigation, settings save, skip day, and delete flows still behave in the browser
- confirm add-task works through the app stack locally without relying on a browser mock or a production-exposed request override

Acceptance scenarios:

- each Playwright test starts from the same seeded D1 state and does not rely on writes from earlier tests
- creating a task from the single-list view succeeds locally through the Worker route and refreshed board state, using the dedicated local `e2e` runtime mode rather than a browser-side mock or request header bypass
- toggling a task still persists across reload and updates the dashboard state after navigating back
- the suite remains runnable against the local dev server with Chrome as the browser target

## Risks And Open Questions

- Any local deterministic parsing path must stay tightly scoped so it does not quietly replace the Anthropic-backed production behavior or become activatable by arbitrary production traffic.
- Reseeding D1 before each test adds runtime cost, so the implementation should prefer a simple, explicit reset over a more complex bespoke fixture system.
- Cloudflare Vite environment selection must cleanly provide the `e2e` binding set; if that proves brittle, the fallback is to keep the override logic fully server-side and explicitly local-only rather than reintroduce a client-driven bypass.

## Exit Criteria

This slice is done when:

- `docs/plans/15/plan.md` is checked in and matches the implemented seam
- Playwright no longer depends on browser-side mocking of the app's own task-creation route or a production-exposed request override
- each e2e test starts from a fresh seeded D1 state
- the critical FEAT-015 flows pass locally in Chrome
- typecheck, lint, unit, e2e, and structural checks pass locally
- the branch is left ready for PR creation or update against `main`
