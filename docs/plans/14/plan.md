# Issue 14 Plan: Watercolor Aesthetic Implementation

## Goal

Close the remaining FEAT-014 rework items on PR `#31` so the shared watercolor UI system behaves correctly under Tailwind's cascade layers and stays aligned with the handwritten typography constraints in `Standard - Visual Language`.

## Scope

This rework update includes:

- an updated checked-in implementation plan for issue `#14` that matches the current PR seam
- a CSS cascade-layer fix in `src/ui/index.css` for reusable stationery / handwritten helper classes so Tailwind state utilities can override them predictably
- day-navigation styling fixes for the disabled next arrow and pressed skip toggle so those states are visibly distinct in the browser
- handwritten typography weight adjustments where FEAT-014 introduced bold treatments that conflict with the visual-language standard
- regression coverage focused on browser-observable styles for the affected day-navigation states

## Non-Goals

This rework update does not include:

- reopening the broader FEAT-014 restyling work that is already on the branch unless a fix is required for the reported regressions
- schema, service, Worker, Durable Object, or API changes
- changes to task, skip-day, streak, navigation, or realtime semantics
- new visible features beyond making the existing watercolor states render correctly
- introducing a UI component library or replacing the current React / Tailwind stack

## Current Context And Gaps

- The FEAT-014 branch already applied the winning watercolor direction across the main board flows, and the remaining work is now review-driven cleanup rather than a fresh design pass.
- `Standard - Visual Language` requires handwritten / letterpress typography, watercolor completion treatment, sketched controls, warm off-white paper, and avoidance of default OS control styling across the app.
- `Experience Goal - Ambient Calm` makes two constraints testable for this slice: the board should feel like household art, and the dashboard should stay legible from across the room without alarm colors or dense chrome.
- PR review on `#31` identified the concrete regressions to close in this pass:
  - reusable classes such as `.stationery-link` and `.stationery-button` are declared outside any Tailwind cascade layer, so utility classes on disabled and pressed states are being overridden by unlayered CSS
  - the disabled next-day arrow and pressed skip toggle in `DayNavigation` therefore lose their intended state styling in the browser
  - `.hand-title` and `.hand-link` use `font-weight: 700`, which conflicts with the visual-language requirement to keep handwritten display text light-to-regular rather than bold
- The repo expects a Bridget briefing, but there is no Bridget tool and no checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, checked-in FEAT-014 ticket doc, prototype wireframes in `docs/alexandria/sources/`, and repo code are the available context briefing source.

## Affected Layers And Boundaries

- `src/ui/`: owns the CSS helper classes and `DayNavigation` state styling in scope for this rework
- `tests/e2e/`: owns the browser-level regression checks because the reported bugs are cascade and computed-style problems, not just DOM-shape problems

Boundary rules preserved:

- no changes outside the `ui` and UI-test layers unless a test fixture needs a harmless update
- no imports that violate `types -> config -> db -> services -> workers/realtime -> ui`
- D1 remains the source of truth and no visual treatment is allowed to imply a different persistence or state model

## Slice Strategy

This rework lands one reviewable seam: "make the FEAT-014 watercolor helper styles cooperate correctly with Tailwind utilities and handwritten typography constraints." That seam is reviewable on its own because it stays entirely in the presentational layer, preserves the already-shipped interaction semantics, and can be judged directly against the checked-in visual-language standard plus browser QA.

Deliberately deferred:

- any additional FEAT-014 polish outside the reported review items
- post-v1 animation or celebration experiments
- broader visual exploration that is not needed to fix the PR regressions

## Implementation Steps

1. Update `docs/plans/14/plan.md` so the plan matches the current PR rework seam and validation strategy.
2. Move the reusable handwritten / stationery helper classes in `src/ui/index.css` into an explicit Tailwind layer so utility classes can win when a component needs state-specific overrides.
3. Lower handwritten font weights in the shared typography helpers to a regular-weight treatment that stays readable but complies with `Standard - Visual Language`.
4. Tighten `DayNavigation` state classes so the disabled next arrow and pressed skip toggle replace the neutral stationery background with visible state-specific treatments.
5. Add browser-level regression assertions in `tests/e2e/home.spec.ts` that verify the computed visual states of the disabled arrow and pressed skip toggle after navigation and skip toggling.
6. Verify the result in local Chrome through Playwright at an iPad-like landscape viewport, then run the required checks and review the diff for any remaining cascade-layer conflicts.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e`
- `npm run test:struct`

Additional validation:

- `npm run test` to ensure the existing unit coverage still passes after the shared CSS helper changes

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport
- confirm the disabled next-day arrow reads as intentionally unavailable rather than like an active stationery control
- confirm the pressed skip toggle takes on a visible blue-wash state distinct from the neutral stationery button style
- confirm handwritten headings still read calmly and legibly without bold system-weight emphasis

Acceptance scenarios:

- navigating from today to tomorrow disables the next-day arrow with a visibly muted background, text color, and shadow treatment
- toggling skip day on the current day applies a visible blue-wash pressed state to the skip button instead of leaving it visually identical to the neutral stationery button
- handwritten display and supporting text no longer rely on bold font weights that violate the visual-language standard
- the CSS helper changes do not alter task, skip-day, navigation, or realtime behavior

## Risks And Open Questions

- Moving shared CSS into a Tailwind layer changes precedence across multiple visible controls, so browser validation needs to cover more than the originally reported button states.
- Lowering handwritten font weights must preserve 8-foot readability; if a regular weight becomes too faint in Chrome, the implementation should stop at the lightest readable value rather than mechanically chasing the minimum weight.
- Because the review bug is about cascade precedence, markup-level tests alone are insufficient; browser-level assertions are required to prove the fix.

## Exit Criteria

This slice is done when:

- `docs/plans/14/plan.md` is checked in and matches the implemented PR rework seam
- the shared handwritten / stationery helpers no longer override Tailwind utility-driven state styling because they live inside an explicit cascade layer
- day-navigation disabled and pressed states are visibly distinct in the browser and remain aligned with the watercolor aesthetic
- handwritten helper weights comply with the light-to-regular guidance in `Standard - Visual Language`
- typecheck, lint, unit, e2e, and structural checks pass locally
- the updated UI has been visually verified in local Chrome via Playwright at an iPad-like viewport
- the branch is left ready for PR update against `main`
