# Issue 8 Plan: Day Navigation With Arrow-Based Browsing

## Goal

Implement FEAT-008 so both the dashboard and Single List View share a persistent day-navigation bar with back/forward arrows, the app can browse unlimited history plus tomorrow only, and the currently viewed day is carried through route state and realtime board loading instead of always snapping back to today.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#8`
- a validated requested-day contract for board bootstrap requests so URL state cannot bypass the tomorrow-only forward limit
- shared day-navigation UI rendered on both Dashboard and Single List views in the existing watercolor / letterpress style
- route-state preservation so navigating between dashboard and single-person view keeps the current day in place
- shared board-hook updates so changing the requested day re-initializes the board snapshot and realtime socket state for that day
- narrow realtime coordination updates needed so a socket tracks the day it is currently viewing
- unit and e2e coverage for date validation, navigation affordances, and cross-route day persistence

## Non-Goals

This PR does not include:

- calendar pickers, jump-to-date UI, week view, or any other date shortcut
- future navigation beyond tomorrow
- task-entry work from FEAT-009
- streak-engine or skip-day behavior changes beyond preserving the current board day correctly
- schema changes or new D1 tables
- auth, settings implementation, or broader visual redesign outside the navigation slice

## Current Context And Gaps

- FEAT-006 already established a shared `BoardRoute` shell and nested routes for dashboard and Single List View, which makes this a good seam for persistent navigation across both screens.
- The current UI displays the active day in both headers, but it is static and person links / back links reset navigation to today because no day state is preserved in the route.
- `/api/board` currently always boots today in the configured timezone, so a requested historical or tomorrow day cannot be expressed through the bootstrap contract.
- The current family Durable Object websocket flow accepts a date in the `init` message, but socket attachment state only tracks `familyId`, not the day currently being viewed.
- The release plan references `CONTEXT_BRIEFING.md`, but that file is not present in this clone. There is also no callable Bridget tool in this workspace, so the Alexandria cards, founder notes, ADR guidance already in repo, and the sanitized issue summary are the available context briefing sources for this slice.

## Affected Layers And Boundaries

- `src/types/`: owns the bootstrap request/response validation for requested day input and any shared date-contract helpers that genuinely belong at the contract layer
- `src/services/`: owns canonical day derivation and forward-limit validation for board bootstrap behavior
- `src/workers/`: owns parsing the requested day from the HTTP request and returning the validated bootstrap envelope
- `src/realtime/`: may track the per-socket viewed day so broadcasts stay aligned to the socket’s current board date
- `src/ui/`: owns route/search state, arrow interactions, date-label rendering, and preserving the current day when moving between dashboard and single-list views

Boundary rules preserved:

- D1 remains the durable source of truth for task/completion state; navigation only changes which day is requested
- day-limit rules live in service / contract seams, not only in button disable state
- UI continues to use the existing bootstrap endpoint and family websocket path rather than inventing direct data access
- no right-to-left imports across `types -> config -> db -> services -> workers/realtime -> ui`

## Slice Strategy

This PR lands one reviewable seam: "make board day a validated, route-carried input instead of an implicit always-today default." That seam is reviewable because it adds the full FEAT-008 user-facing behavior without mixing in task-entry work, schema changes, or unrelated visual redesign.

Deliberately deferred:

- any richer date navigation mechanism beyond left/right arrows
- persistence outside route/app state, such as local storage
- copy or behavior refinements for future issues that depend on day navigation, such as FEAT-011

## Stateful Model And Transitions

Important states in this slice:

- canonical today: derived on the server from the configured timezone
- requested board day: optional route/query state resolved to a validated `IsoDate`
- socket viewed day: the current day a connected client has initialized against
- visible board state: the latest server snapshot for the validated requested day

Allowed transitions:

1. App opens with no day override and resolves to canonical today.
2. User taps left arrow and requested day decrements by one calendar day.
3. User taps right arrow from a past day and requested day increments by one calendar day.
4. User taps right arrow from today and requested day becomes tomorrow.
5. User on tomorrow cannot move farther forward; the right arrow stays disabled and server validation still rejects any manual URL beyond tomorrow.
6. Shared board hook reboots or re-initializes the current family snapshot for the validated requested day.
7. User moves between dashboard and single-list routes while preserving the current requested day.
8. Task toggles continue to act against the currently viewed day, including past-day catch-up and tomorrow planning.

Source of truth:

- the server-side validated requested day is authoritative for bootstrap
- D1-backed family board state remains authoritative for the returned day snapshot
- route/query state is the app-level persistence mechanism for the currently viewed day in this slice

Failure and edge cases to guard:

- malformed `day` query values
- manual URL edits that request more than one day into the future
- navigation links that accidentally drop the current day when moving between views
- socket broadcasts pushing the wrong date snapshot to a client after that client has navigated to another day

## Implementation Steps

1. Add `docs/plans/8/plan.md` and keep implementation aligned with this FEAT-008-only seam.
2. Extend the board bootstrap contract so `/api/board` can accept an optional requested day and validate it against canonical today / tomorrow rules.
3. Update the worker and board service to parse the requested day safely and return the validated board bootstrap date.
4. Update the family-board hook and realtime Durable Object state so the client can re-initialize the board cleanly when the requested day changes.
5. Introduce a shared day-navigation UI component and route/search helpers that preserve the requested day across dashboard and single-list navigation.
6. Adjust copy where needed so focused-view status text remains correct on past days and tomorrow.
7. Add or update unit and e2e coverage for worker/service validation, persistent navigation behavior, and tomorrow-limit affordances.
8. Run required checks, verify visually in local Chrome through Playwright, and review the diff before handing off.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport and confirm the persistent navigation bar feels intentional on both screens, the day label updates correctly, and the right arrow visibly disables on tomorrow

Acceptance scenarios:

- dashboard loads today by default with the day navigation bar visible
- tapping left arrow on dashboard loads yesterday, then older days on repeated taps
- tapping right arrow from a past day moves toward today, and from today moves to tomorrow only
- the right arrow is disabled when tomorrow is visible
- opening a person’s Single List View preserves the current day
- returning from Single List View preserves the current day
- manual URL edits with invalid day strings or dates beyond tomorrow fall back to the nearest allowed behavior defined by the service contract without crashing the app
- toggling a task continues to target the currently viewed day after navigation

## Risks And Open Questions

- The current realtime protocol broadcasts one day snapshot to every socket in a family room. Once day navigation exists, sockets need enough attachment state to avoid cross-day drift if multiple clients view different days.
- The capability card says day state is persisted in app state and restored on return. This slice will use route/query state for that persistence; if product later wants device-level persistence across a fresh visit to `/`, that should be a separate explicit decision.
- Founder wireframes mentioned a calendar picker, but Alexandria cards and the round-two founder decision explicitly reject it. This slice follows the stricter, newer product source of truth and keeps arrow navigation only.

## Exit Criteria

This slice is done when:

- `docs/plans/8/plan.md` is checked in and matches the implemented FEAT-008 seam
- both dashboard and Single List View render the persistent arrow-based day navigation bar
- route changes preserve the currently viewed day across both views
- the server and client both enforce the tomorrow-only forward limit
- task toggles still operate against the currently viewed day
- local typecheck, lint, unit, e2e, and structural checks pass
- the UI has been visually verified in local Chrome via Playwright and the branch is ready for review against `main`
