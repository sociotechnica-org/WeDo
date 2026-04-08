# Issue 11 Plan: Skip Day Toggle With Visual Dimming

## Goal

Implement FEAT-011 so a family-scoped Skip Day can be toggled from Day Navigation, persisted in D1 through the family Durable Object, broadcast to connected clients, and rendered with the intended forgiving visual treatment across dashboard and single-list views.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#11`
- realtime mutation support for toggling a family skip day on the viewed date
- db/service wiring to insert or remove the existing `skip_days` row and trigger streak recalculation
- client-side action wiring so the Day Navigation toggle works on current and past days
- visual treatment for skipped days: visible toggle state, struck-through day label, and dimmed task surfaces while tasks remain visible
- regression tests for contracts, service mutations, realtime behavior, state updates, and UI rendering

## Non-Goals

This PR does not include:

- a schema expansion to per-person Skip Days
- a required skip-day reason field or extra settings UI
- hiding tasks, disabling navigation, or preventing task completion on a skipped day
- broader dashboard or single-list redesign beyond the skip-day treatment
- auth, family switching, or any new non-skip-day mutation type

## Current Context And Gaps

- FEAT-010 already added streak calculation that reads `skip_days`, so this slice should reuse that path instead of redefining streak rules.
- The current schema and board state expose one family-level `skip_days` row per `family_id + date`, not per-person skip flags.
- `FamilyBoardState` already includes `skip_day` on each person state, populated from one shared row, so the UI can render skip-day state without a new board shape.
- The realtime protocol currently supports `init` and `task_toggled` only; FEAT-011 needs an explicit mutation added to the existing websocket flow.
- The repo expects a Bridget context briefing, but there is no Bridget tool and no checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, ADRs, checked-in ticket docs, and sanitized issue summary are the available context briefing sources.
- Alexandria cards describe Skip Day as sometimes per-person, but the shipped schema is family-scoped. This PR follows the actual schema and leaves any per-person expansion to a separate schema and product decision.

## Affected Layers And Boundaries

- `src/types/`: owns websocket contract updates for the new skip-day toggle message
- `src/db/`: owns the `skip_days` insert/delete queries against D1
- `src/services/`: owns skip-day mutation validation and the follow-up streak sync trigger
- `src/realtime/`: owns websocket handling, mutation serialization, and broadcast after durable writes
- `src/ui/`: owns the Day Navigation control, optimistic/local state updates if needed, and the visible dimming/strike-through treatment

Boundary rules preserved:

- D1 remains the durable source of truth; the Durable Object orders the mutation and only broadcasts after the write path succeeds
- streak recalculation remains in services and continues to read `skip_days` from D1
- UI renders skip-day state from board snapshots and does not import persistence logic
- no right-to-left imports across `types -> config -> db -> services -> workers/realtime -> ui`

## Slice Strategy

This PR lands one reviewable seam: "make the existing family-scoped skip day actually operable and visibly legible throughout the board." That seam is narrow enough for one review because it uses the existing schema and streak engine, adding only the missing toggle path and visual state.

Deliberately deferred:

- per-person Skip Day support
- a reason entry flow
- any extra analytics or settings around skipped days

## Stateful Model And Transitions

Important states:

- board date being viewed
- family-scoped skip-day record present or absent for that date
- board snapshots for each viewed date held by connected clients
- denormalized streak rows that must stay synchronized after retroactive skip edits

Allowed transitions:

1. no skip-day row on viewed date -> toggle on -> create `skip_days` row -> sync streaks -> broadcast updated board state
2. skip-day row exists on viewed date -> toggle off -> delete row -> sync streaks -> broadcast updated board state
3. past-day toggle follows the same path and triggers retroactive streak recalculation via the existing streak sync service

Source of truth:

- `skip_days` in D1 determines whether a day is skipped
- `streaks` in D1 stores the denormalized current streak rows after recalculation
- board snapshots and websocket payloads are derived views, not durable state

Failure and edge cases to guard:

- toggling tomorrow or a past day must respect the existing day-resolution guardrails
- failed realtime writes must not leave the UI in a silently divergent state
- un-skip must remove the durable row, not create a second sentinel state
- skipped days must still show tasks and still allow task toggles

## Implementation Steps

1. Add `docs/plans/11/plan.md` and keep implementation aligned to the family-scoped FEAT-011 seam.
2. Extend the realtime type contracts with a skip-day toggle client message and ensure server responses remain the existing board-state update flow.
3. Add db helpers to create and remove a family skip-day row for a date, plus service-layer mutation helpers that validate the request and invoke streak sync.
4. Update the family Durable Object websocket handler to process skip-day toggles and broadcast refreshed board state for the affected viewed date(s).
5. Extend the board UI hook/action surface so Day Navigation can send the skip-day toggle mutation for the active board date.
6. Update Day Navigation, dashboard columns, and single-list task surfaces to show the skip-day state with WeDo-consistent visual dimming and a struck-through date label while keeping tasks visible.
7. Add regression tests across types, services, realtime, hook/state helpers, and route/component rendering.
8. Run required checks, verify the UI in local Chrome via Playwright, review the diff, and leave the branch ready for PR update or creation.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport and confirm the skip toggle reads clearly in the header, the date label gains a strike-through when active, and task surfaces dim without disappearing or looking like generic disabled widgets

Acceptance scenarios:

- Day Navigation shows a skip-day toggle adjacent to the current date
- toggling on creates the skip-day state for the viewed date and toggling off removes it
- skipped dates render with a struck-through date label
- dashboard task surfaces dim on skipped days while remaining readable
- single-list task surfaces dim on skipped days while remaining interactive
- realtime broadcasts update other clients viewing the same family/date
- retroactive skip toggles trigger streak recalculation through the existing FEAT-010 path

## Risks And Open Questions

- The product library is inconsistent about family-scoped versus per-person Skip Days. This slice follows the checked-in schema and current board contract.
- The issue text names a `skip_day_toggled` broadcast, but the existing realtime model already broadcasts full board-state updates. Reusing `state_update` keeps the protocol smaller unless tests or code evidence show a stronger need for a dedicated server event.
- Visual dimming must still preserve the watercolor / letterpress tone; using default disabled styling would violate the visual language even if functionally correct.

## Exit Criteria

This slice is done when:

- `docs/plans/11/plan.md` is checked in and matches the implemented FEAT-011 seam
- skip-day toggles persist through D1 via the family Durable Object and trigger streak resync
- the board UI shows an obvious skip-day toggle and forgiving skipped-day styling without hiding tasks
- realtime clients receive refreshed board state after skip-day mutations
- local typecheck, lint, unit, e2e, and structural checks pass
- the updated UI has been visually verified in local Chrome via Playwright
- the branch is ready to update or open for review against `main`
