# UI Copy Density Cleanup Plan

## Goal

Reduce visual and textual clutter in the dashboard and focused person views so the app reads more like an ambient household board and less like an explanatory interface.

## Scope

- Remove redundant helper copy from the dashboard, person screen, and day navigation.
- Make `WeDo` a smaller top-left home link on the focused person screen.
- Replace visible Settings text with a compact gear icon link in the top-right.
- Remove the bordered top menu panel treatment so navigation sits directly on the paper background.
- Remove the page-level paper-canvas oval that creates extra horizontal padding.
- Tighten dashboard people-row outer gutters so they match the spacing between
  person cards.
- Remove checkbox glyphs from dashboard task rows to preserve horizontal space.
- Tighten dashboard task-row and person-card horizontal padding so task titles
  do not wrap prematurely.
- Move the Skip Day control below the date.
- Align task row emoji/check/title content vertically.
- Change delete reveal behavior so the row content does not slide left on hover.
- Update route/e2e tests to match the refined UI.
- Verify visually in the in-app Browser.

## Non-Goals

- No persistence, realtime, service, or schema changes.
- No new navigation destinations.
- No broad redesign of settings, prototype, or task creation flows.
- No new icon package unless the existing stack already provides one.

## Current Context And Gaps

- The current top area repeats descriptive text such as "Shared family board," "Day," and "Focused list" that does not help the household use the board.
- The focused person screen has both a WeDo logo and an explicit Back button. The requested behavior is to make WeDo itself the home navigation.
- Settings currently consumes text space in the header even though it is a utility action.
- The task-row delete affordance was recently fixed for hit testing, but its reveal motion still moves the primary row content, which is visually confusing.

## Affected Layers And Boundaries

- `src/ui/routes/dashboard-route.tsx`: dashboard header copy and settings affordance.
- `src/ui/routes/single-list-route.tsx`: person screen header copy, home link, settings affordance, and progress copy.
- `src/ui/components/day-navigation.tsx`: day-nav container and skip-button placement.
- `src/ui/components/task-row.tsx`: task row alignment and delete reveal behavior.
- `tests/unit/ui/board-route.test.tsx` and `tests/e2e/home.spec.ts`: assertions for the changed visible UI.

This slice is UI-only. It must not move persistence, recurrence, streak, or realtime policy into the UI.

## Slice Strategy

This is one reviewable UI polish slice: remove low-value explanatory text and simplify the task/list header interaction. It is narrow enough for one PR because it touches only the visible composition around existing data and actions.

Deferred:

- Broader dashboard layout redesign.
- Settings route visual cleanup.
- New global icon system.

## Implementation Steps

1. Create this plan before component edits.
2. Add small inline SVG icon helpers where needed for the settings affordance.
3. Simplify dashboard and focused person headers while preserving accessible labels.
4. Adjust `DayNavigation` to remove its panel border and put Skip Day below the date.
5. Adjust task rows so emoji/check/title are center-aligned and delete reveal does not translate row content.
6. Update unit and e2e expectations for the changed copy and navigation affordances.
7. Verify in Browser at the current focused person URL and at the dashboard.

## Tests And Acceptance Scenarios

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`
- `npm run test:e2e`
- Browser verification at `http://127.0.0.1:5173/people/8afb19dd-44f4-4ab4-bff7-754dc9f4ccfd?day=2026-05-22`

Acceptance:

- Removed text is absent from the visible DOM.
- Focused person screen has no explicit Back button; `WeDo` links home.
- Settings is accessible as a gear icon link in the top-right.
- Day navigation sits directly on the paper background without the menu-card border.
- The page no longer renders a large background oval around the content.
- The dashboard people row uses the same horizontal outer gutter as the
  inter-card gap.
- Dashboard task rows show emoji and title without the checkbox glyph.
- Dashboard task rows have compact interior spacing and avoid unnecessary
  wrapping at the current viewport.
- Skip Day appears under the date.
- Task row emoji/check/title align cleanly.
- Hovering a task reveals the trash button without shifting the checkmark/title left.

## Risks And Open Questions

- Removing text must not remove accessible names for navigation and settings.
- The gear icon should remain consistent with the existing sketched/stationery style.
- Touch delete behavior should still be usable after removing hover translation.

## Exit Criteria

- The focused person and dashboard views match the requested simplified composition.
- Automated checks pass.
- Browser inspection shows no console errors and confirms the changed UI.
