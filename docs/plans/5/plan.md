# Issue 5 Plan: Dashboard View With Real Data Via WebSocket

## Goal

Implement the first real Dashboard View for WeDo so the home route connects to the family-scoped Durable Object over WebSocket, requests the current family board state from D1-backed services, and renders the household dashboard with person columns, streaks, completion rings, and task rows that update live as broadcasts arrive.

## Scope

This PR includes:

- a checked-in dashboard plan for issue `#5`
- a UI hook that owns the family board WebSocket lifecycle, sends the `init` message, validates server messages with shared Zod contracts, and updates local state from `init_response` / `state_update`
- dashboard view rendering that consumes `FamilyBoardState` instead of the scaffold `BoardSnapshot`
- dashboard components for the section-level layout, person columns, task rows, and completion rings using the current visual direction in the repo while preserving the later watercolor-polish seam
- route and worker adjustments needed so the browser can discover the family id and current day for the initial socket connection without crossing layer boundaries
- unit coverage for the new UI mapping / websocket behavior and updated e2e coverage for the real dashboard flow

## Non-Goals

This PR does not include:

- Single List View navigation or task toggling interactions from the dashboard
- new realtime mutation types beyond the FEAT-004 websocket protocol
- streak recalculation logic, skip-day mutation flows, or recurrence-rule changes
- the later PROTO-001 / FEAT-014 watercolor art pass; this slice should stay custom and warm, but not overreach into the dedicated polish work
- authentication, multi-family account selection, or global realtime coordination

## Current Context And Gaps

- FEAT-004 already provides the per-family Durable Object, message contracts, D1-backed day-state assembly, and broadcast behavior.
- The current home route still reads a scaffold `/api/board` HTTP response backed by `BoardSnapshot`, which no longer matches the product-critical dashboard acceptance criteria.
- The repo already has placeholder `CompletionRing` and `PersonColumn` components, but they render scaffold task shapes (`title`, `note`, `ink`, `wash`) instead of the real `FamilyBoardState` model (`emoji`, `title`, completion state, streaks).
- The FEAT-005 ticket says placeholder/basic styling is acceptable before PROTO-001, but Alexandria still requires custom, quiet, non-toolkit rendering and explicitly forbids red/alarm styling or ranked columns.
- The release plan references `CONTEXT_BRIEFING.md`, but that file is not present in this clone. For this slice, the Alexandria cards, ticket docs, and ADRs are the available Bridget briefing source.
- Post-review hardening is part of the current slice: the bootstrap path must fail clearly when no family can be derived, worker routing must translate bootstrap-domain failures into an intentional HTTP response, and the dashboard UI must not hide post-initialization websocket faults or rely on brittle color-string transforms.

## Affected Layers And Boundaries

- `src/types/`: may add narrow shared UI-facing helpers or exports only if they remain contract-level and reusable
- `src/config/`: may expose runtime-derived values already available to the UI bootstrap path; no persistence or socket behavior belongs here
- `src/services/`, `src/db/`, `src/realtime/`: existing FEAT-004 behavior is treated as the backend contract and should only change if a concrete bug is discovered while wiring the dashboard
- `src/workers/`: may provide a thin JSON bootstrap route for family id and current day if the UI needs an HTTP entrypoint before opening the socket
- `src/ui/`: owns websocket connection management, contract parsing on incoming messages, board-state-to-view mapping, and visible dashboard rendering

Boundary rules preserved:

- UI consumes server state through HTTP/bootstrap and WebSocket messages only; it must not import from `db/`, `workers/`, or `realtime/`
- D1 remains the source of truth; the dashboard reflects server broadcasts and reconnect init state rather than inventing client-owned durable state
- the family-scoped DO remains the only realtime coordination hub; this slice must not introduce any global socket or cross-family shortcut

## Slice Strategy

This PR lands one reviewable seam: "make the home screen the real family dashboard backed by the existing realtime contract." That seam is reviewable because FEAT-004 already established the backend protocol, and FEAT-005 can focus on one vertical UI slice from initial page load through live state updates without mixing in later navigation, mutation UX, or visual-prototype work.

Deliberately deferred:

- tap-through navigation to Single List View
- optimistic toggle UI from the dashboard
- settings screen implementation
- watercolor/letterpress polish beyond the basic custom dashboard treatment needed to avoid toolkit defaults

## Stateful Model And Transitions

Important client states in this slice:

- websocket lifecycle: `connecting` -> `ready` or `error`, with cleanup on unmount
- latest `FamilyBoardState` received from the server for one family and one day
- derived per-person progress presentation: streak count, task completion ratio, 100% completion treatment, and task-row completion styling

Allowed transitions:

1. Home route loads.
2. UI obtains the current family id and day to display.
3. UI opens `/api/realtime/:familyId` and sends `init` with the target date.
4. UI validates `init_response` and renders the board.
5. When the DO broadcasts `state_update`, UI validates the message and replaces the rendered board state.
6. On unmount or reconnect failure, UI cleans up the old socket and either shows an error state or retries only if the implementation stays simple and testable.

Source of truth:

- server-sent `FamilyBoardState` is the only source of rendered board data
- derived completion percentages and warm-complete styling are UI presentation derived from the server state, not additional durable state

Failure and edge cases to guard:

- invalid or unexpected websocket payloads
- websocket close/error after initialization, which should remain visible to the operator without discarding the last good board snapshot
- empty task lists for a person, including Sunday/quiet-column cases
- 0-task columns, which must render as an empty ring rather than divide by zero
- socket close/error before `init_response`, which should surface a clear unavailable state instead of hanging indefinitely

## Implementation Steps

1. Add or reuse a thin worker bootstrap path for the dashboard client to discover the family id and initial date without depending on scaffold `BoardSnapshot`.
2. Replace the scaffold-only `useBoardSnapshot` hook with a realtime-oriented hook that opens the family WebSocket, sends `init`, validates server messages, and stores the latest `FamilyBoardState`.
3. Replace the current home route composition with a dashboard layout that matches the FEAT-005 section spec: branding left, centered day frame, settings affordance right, and six equal-width family columns in landscape-friendly layout.
4. Rewrite `PersonColumn` and `CompletionRing`, and add a dedicated task-row component if needed, so they render real task data: streak count, emoji, task text, completion treatment, and non-numeric ring fill with a subtle 100% warm shift.
5. Remove or isolate scaffold `BoardSnapshot` usage from the home screen so the visible dashboard path is fully driven by `FamilyBoardState`.
6. Add unit tests for the websocket hook / state mapping behavior and update e2e coverage to assert real seeded household content from the D1-backed realtime path.
7. Run the required static checks, unit tests, structural checks, e2e tests, and Playwright visual verification in local Chrome.
8. Harden the implementation against review findings by removing brittle presentation helpers, making family bootstrap selection explicit, surfacing websocket degradation after initialization, and mapping bootstrap-domain failures to a controlled worker response.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright on an iPad-like landscape viewport and confirm the dashboard renders as a calm six-column ambient board with intentional whitespace

Acceptance scenarios:

- home route renders six household columns from seeded D1 data after websocket init
- each column shows streak count, person name, completion ring, and task rows with checkbox + emoji + task text
- completion rings fill proportionally and render a distinct but subtle 100% treatment
- websocket `state_update` replaces the displayed board state without a page refresh
- if the socket fails before initialization, the route shows a clear unavailable state
- if the socket fails after initialization, the UI preserves the last board snapshot and surfaces a degraded realtime status instead of silently swallowing the failure
- layout remains readable at an iPad landscape viewport without reordering columns by completion

## Risks And Open Questions

- FEAT-005 says placeholder/basic styling initially, while Alexandria still requires custom non-widget rendering. The implementation should stay restrained and custom without preempting the dedicated polish tickets.
- The current backend contract does not expose a separate bootstrap endpoint for family id/date. If no suitable existing source exists, the thin worker route added here should stay minimal and contract-shaped rather than reviving the old scaffold board API.
- There is no explicit reconnect requirement in the ticket beyond realtime updates. If reconnect logic adds too much surface for this PR, a single-connect implementation with clear failure UI is the safer reviewable seam.

## Exit Criteria

This slice is done when:

- `docs/plans/5/plan.md` is checked in and aligned with the implementation
- the home route renders the real family dashboard from FEAT-004 websocket state instead of scaffold board data
- person columns, task rows, streaks, and completion rings all use the real seeded family data model
- websocket broadcasts update the dashboard state live
- local typecheck, lint, unit, structural, and e2e checks pass
- the dashboard has been visually verified in local Chrome via Playwright and the branch is ready for review against `main`
