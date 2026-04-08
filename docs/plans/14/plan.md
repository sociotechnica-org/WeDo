# Issue 14 Plan: Watercolor Aesthetic Implementation

## Goal

Implement FEAT-014 so every visible WeDo UI surface reads as letterpress stationery rather than software, with a consistent watercolor / handwritten treatment across Dashboard View, Single List View, Day Navigation, Settings, and the board shell states that frame those screens.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#14`
- a shared visual-system pass in `src/ui/` covering typography, palette tokens, paper/background treatment, and reusable handcrafted controls
- updated Dashboard View, Person Column, Completion Ring, and Task Row styling to better match the approved watercolor direction
- updated Single List View styling, including focused header, task rows, Add Task affordance, and composer styling
- updated Day Navigation and Settings styling so they feel like the same physical artifact, not separate utility chrome
- updated loading / error / empty utility states in the board shell so no visible surface falls back to generic software styling
- regression tests for route rendering and component markup where the visual contract is encoded in DOM output

## Non-Goals

This PR does not include:

- schema, service, Worker, or Durable Object changes
- changes to task, skip-day, streak, or realtime semantics
- adding new visible features beyond the aesthetic pass already implied by existing flows
- introducing a UI component library or replacing the current React / Tailwind stack
- perfectionist visual animation work beyond what is needed to support the watercolor / letterpress feel

## Current Context And Gaps

- The current UI already has a warm paper palette and custom surfaces, but several visible elements still read as styled software controls instead of stationery: squared checkbox fills, standard button silhouettes, dense header cards, and numeric completion copy in the focused view.
- `Standard - Visual Language` requires handwritten / letterpress typography, watercolor completion treatment, sketched controls, warm off-white paper, and avoidance of default OS control styling across the app.
- `Experience Goal - Ambient Calm` makes two constraints testable for this slice: the board should feel like household art, and the dashboard should stay legible from across the room without alarm colors or dense chrome.
- The ticket and prototype wireframes point toward a lighter, more spacious composition than the current card-heavy layout, so the work should simplify and unify existing surfaces rather than layering more decorative widgets on top.
- PR review on `#31` identified a narrow follow-up seam inside this same slice: disabled stationery controls need stricter disabled-state styling, the focused single-list view needs visible progress counts restored, and per-person palettes need distinct watercolor tints instead of a shared wash.
- The repo expects a Bridget briefing, but there is no Bridget tool and no checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, checked-in FEAT-014 ticket doc, prototype wireframes in `docs/alexandria/sources/`, and repo code are the available context briefing source.

## Affected Layers And Boundaries

- `src/ui/`: owns the entire slice, including CSS tokens, reusable presentational components, route layout, and view-level visual composition
- `tests/unit/ui/`: owns DOM-level regression checks for the visible contract that can be asserted without a browser
- `tests/e2e/`: owns end-to-end flow coverage for the main visible surfaces after the visual pass

Boundary rules preserved:

- no changes outside the `ui` and UI-test layers unless a test fixture needs a harmless update
- no imports that violate `types -> config -> db -> services -> workers/realtime -> ui`
- D1 remains the source of truth and no visual treatment is allowed to imply a different persistence or state model

## Slice Strategy

This PR lands one reviewable seam: "replace the remaining software-like visible UI with a consistent watercolor / letterpress presentation across the existing v1 board flows." That seam is reviewable on its own because it stays in the presentational layer, uses the already-built task / board behavior, and can be judged against the checked-in visual language spec plus browser QA.

Deliberately deferred:

- any post-v1 animation or celebration experiments beyond subtle completion-state polish
- bespoke iPad-only fullscreen or kiosk-mode work outside the current routed app shell
- copy changes that are unrelated to the aesthetic spec

## Implementation Steps

1. Add `docs/plans/14/plan.md` and keep implementation aligned with the UI-only visual-system seam.
2. Refine shared CSS tokens and paper textures in `src/ui/index.css`, introducing clearer typography roles and reusable handcrafted surface styles where needed.
3. Update `CompletionRing`, `TaskRow`, and `PersonColumn` so rings feel watercolor, checkboxes feel sketched, completed state uses a blue wash, and dashboard columns breathe more like the prototype direction.
4. Update `DayNavigation` so arrows, day label, and skip-day control match the same handwritten / stationery system and skipped-day dimming looks intentional rather than disabled.
5. Update `DashboardRoute`, `SingleListRoute`, and `SettingsRoute` headers and section layouts to reduce generic card chrome, unify the board framing, and keep utility screens visually consistent with the main experience.
6. Update board-shell loading / error / not-found states so no visible screen falls back to generic app-shell styling.
7. Add or update unit and end-to-end assertions that cover the main visible contract changes without overfitting to incidental class names.
8. Address actionable PR feedback within the same UI seam by tightening disabled stationery CSS behavior, restoring visible focused-list counts, and reintroducing distinct per-person wash/mist values.
9. Verify the result in local Chrome through Playwright at an iPad-like landscape viewport, then run required checks and review the diff for any remaining default-control drift.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport
- confirm the dashboard is legible from a distance, with no alarm colors and no visually dominant software chrome
- confirm the focused single-list view and Settings screen feel like the same artifact family as the dashboard rather than generic form screens

Acceptance scenarios:

- Dashboard View shows person columns, task rows, and completion rings with a clearly handcrafted watercolor / letterpress treatment
- Single List View uses the same system at a larger scale, with calm completion feedback and a non-generic Add Task affordance
- Day Navigation and skip-day styling feel integrated with the board instead of like separate utility widgets
- Settings remains lighter-weight than the main board but still avoids default software styling
- loading, error, empty, and not-found states remain visually consistent with the product aesthetic
- no visible default browser form controls or OS-like checkbox / progress primitives remain in the main UI

## Risks And Open Questions

- The issue text says "all visible elements," which is broader than a single component pass. The implementation should therefore include the shell states and Settings, not just dashboard columns.
- The handwritten / letterpress requirement must be balanced against 8-foot readability. Decorative choices that lower legibility should be rejected even if they look more "artful" up close.
- Over-styling utility controls could make the app feel precious or hard to use. The target is calm and tactile, not ornamental clutter.
- The prototype wireframes are sparse and low fidelity, so the implementation should infer layout restraint and mark-making from them without treating every exact pixel as a literal spec.

## Exit Criteria

This slice is done when:

- `docs/plans/14/plan.md` is checked in and matches the implemented FEAT-014 seam
- all visible board flows use a coherent watercolor / letterpress visual system
- dashboard, single-list, day navigation, settings, and board shell states no longer show generic software-like controls
- typecheck, lint, unit, e2e, and structural checks pass locally
- the updated UI has been visually verified in local Chrome via Playwright at an iPad-like viewport
- the branch is left ready for PR update or creation against `main`
