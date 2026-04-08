# Issue 6 Plan: Single List View With Tap-To-Toggle

## Goal

Implement FEAT-006 so the dashboard can open a focused Single List View for one person, task rows can be toggled done or not-done from that view, and the UI feels instant locally while reconciling against the existing family-scoped realtime broadcast contract.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#6`
- React Router navigation between the dashboard and a person-focused Single List View
- a shared UI board shell so the family WebSocket connection and latest board snapshot are established once and reused across both routes
- optimistic `task_toggled` handling in the UI hook using the existing FEAT-004 websocket contract
- dashboard column affordances that open Single List View without introducing dashboard-side task toggles
- Single List View rendering with a larger completion ring, larger task rows, a back button, and a visible non-functional `Add task` button
- unit and e2e coverage for navigation, focused rendering, and optimistic toggle behavior

## Non-Goals

This PR does not include:

- day navigation behavior or persistent arrow controls from FEAT-008
- natural-language task entry or text-field behavior from FEAT-009
- task deletion affordances from FEAT-012
- backend protocol expansion beyond the existing `init`, `task_toggled`, `init_response`, and `state_update` messages
- auth, settings implementation, or changes to family scoping

## Current Context And Gaps

- FEAT-005 already renders the real dashboard from the family Durable Object websocket state, but it intentionally deferred navigation into Single List View and any task mutation UI.
- FEAT-004 already provides the D1-backed `task_toggled` mutation path through the family-scoped Durable Object, so FEAT-006 can stay mostly in `src/ui/` unless a concrete client-contract bug is discovered.
- The FEAT-006 ticket explicitly requires React Router navigation, optimistic local updates, a visible `Add task` button placeholder, and a back button.
- Alexandria and the founder notes are aligned that dashboard task rows are not toggle controls; they remain read-only launch affordances into the focused view.
- There is no callable Bridget tool in this workspace, so the Alexandria cards, founder source notes, ADRs, and checked-in ticket docs are the context briefing source for this slice.

## Affected Layers And Boundaries

- `src/types/`: may expose existing realtime message types already needed by the UI; no view-specific state should move here unless it is a shared contract helper
- `src/services/`, `src/db/`, `src/realtime/`, `src/workers/`: treated as the existing source of truth and mutation path; only touched if the client exposes a concrete mismatch
- `src/ui/`: owns route composition, view-specific derivations, optimistic client state, websocket send orchestration, and visual rendering for dashboard and single-list surfaces

Boundary rules preserved:

- UI still talks to the backend only via `/api/board` bootstrap and `/api/realtime/:familyId` websocket traffic
- D1 remains the durable source of truth; optimistic state exists only as temporary client presentation until the next server snapshot arrives
- the per-family Durable Object remains the serialized mutation hub; this slice must not invent direct HTTP mutation shortcuts or global coordination

## Slice Strategy

This PR lands one reviewable seam: "turn the existing realtime dashboard into the full FEAT-006 completion flow for one person." That seam is reviewable because the backend toggle pipeline already exists, and the remaining work is a focused client-side composition problem: routing, shared state, optimistic toggling, and view-specific rendering.

Deliberately deferred:

- day navigation controls and state persistence across dates
- the FEAT-009 task-entry interaction behind the `Add task` button
- delete affordances or any extra task-row actions beyond tap-to-toggle
- broader watercolor art polish that belongs to the dedicated visual follow-up work

## Stateful Model And Transitions

Important client states in this slice:

- shared board load lifecycle: `loading` -> `ready` or `error`
- shared realtime health: `live` or `degraded` while preserving the last good board
- current route focus: dashboard or one person's Single List View
- optimistic task completion state layered on top of the last server snapshot until broadcast reconciliation

Allowed transitions:

1. App bootstraps the family id and current day.
2. App opens the family websocket and sends `init`.
3. Server returns `init_response`; shared board state becomes ready.
4. User taps a dashboard column and navigates to that person's Single List View.
5. User taps a task row in Single List View.
6. UI immediately flips the completion state locally and sends `task_toggled` for the current board day.
7. Durable Object writes to D1, rebuilds board state, and broadcasts `state_update`.
8. UI replaces the optimistic board with the server snapshot.
9. User taps Back and returns to the dashboard without tearing down the shared board connection.

Source of truth:

- server `FamilyBoardState` snapshots are authoritative
- optimistic completion changes are temporary UI state only and must be replaceable by the next broadcast

Failure and edge cases to guard:

- user tries to toggle when realtime is unavailable or the socket is not open
- route points at a person id not present in the current board snapshot
- optimistic update targets a task missing from the latest board snapshot
- websocket error/close after initialization must preserve the last visible board and communicate degraded state clearly

## Implementation Steps

1. Add `docs/plans/6/plan.md` and keep the implementation aligned with this FEAT-006-only slice.
2. Refactor the UI route tree so a shared board shell owns `useFamilyBoard()` and provides data/actions to child dashboard and single-list routes.
3. Extend the family-board hook and helper module to expose a typed optimistic `toggleTask` action plus reusable board-update helpers.
4. Update dashboard rendering so person columns become clear navigation affordances into `/people/:personId` while keeping dashboard task rows non-interactive.
5. Implement the Single List View with focused person lookup, larger ring/task-row variants, back navigation, and a visible disabled `Add task` button.
6. Add or adjust tests for optimistic board-state helpers, dashboard navigation, single-list rendering, and the realtime toggle interaction path.
7. Run typecheck, lint, unit tests, structural tests, e2e tests, and a Playwright-driven local visual verification pass.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport and confirm the dashboard-to-single-list transition, focused layout, and warm task toggle treatment read clearly

Acceptance scenarios:

- tapping a dashboard column opens the corresponding Single List View
- the focused view shows a larger completion ring, larger task rows, and a visible `Add task` button
- tapping anywhere on a focused task row toggles its completion immediately in the UI
- the optimistic completion change is reconciled by the next websocket `state_update`
- the completion ring updates immediately on toggle and still shows the warm full-state treatment at 100%
- back navigation returns to the dashboard without forcing a full board reload
- degraded realtime state remains visible and prevents silent data drift during focused interaction

## Risks And Open Questions

- The ticket requires optimistic UI, but the existing client only reflects server snapshots. The implementation should keep the optimistic layer minimal and pure so it is easy to replace with the next broadcast and easy to reason about in tests.
- FEAT-008 says day navigation is persistent on both screens, but FEAT-006 is explicitly blocked from taking that behavior on. This slice should keep the current day display visible without inventing partial navigation controls.
- The issue text references a future `src/ui/views/SingleList.tsx`, but the current route structure already lives under `src/ui/routes/`; the implementation can preserve the current organization if the resulting seam stays clear and testable.

## Exit Criteria

This slice is done when:

- `docs/plans/6/plan.md` is checked in and matches the implemented FEAT-006 seam
- the dashboard opens a person-focused Single List View through React Router
- Single List View task rows toggle through optimistic local updates plus the existing websocket mutation contract
- the focused completion ring and task-row rendering feel intentionally larger and warmer than the dashboard variants
- the visible `Add task` button and back navigation are present
- local typecheck, lint, unit, structural, and e2e checks pass
- the flow has been visually verified in local Chrome via Playwright and the branch is ready for review against `main`
