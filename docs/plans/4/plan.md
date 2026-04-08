# Issue 4 Plan: Durable Object With WebSocket Init And Broadcast

## Goal

Implement the first real family-scoped realtime coordination path for WeDo v1 so clients can connect to a Durable Object over WebSocket, request the current family board state for a date, toggle task completion through that same socket, persist the mutation to D1, and receive the resulting full-state broadcast.

## Scope

This PR includes:

- a checked-in family board Durable Object class in `src/realtime/` that uses one instance per family
- Hono worker routing that upgrades WebSocket requests and forwards them to the correct Durable Object instance
- D1-backed read logic to materialize `FamilyBoardState` for a requested date from persons, tasks, completions, streaks, and skip days
- recurrence evaluation for deciding which seeded tasks appear on a requested date based on `schedule_rules`
- D1-backed toggle persistence that inserts or deletes `task_completions` rows before broadcasting updated full state
- unit tests for the day-state assembly and realtime message handling flow
- runtime/config updates needed to bind the family Durable Object into the worker

## Non-Goals

This PR does not include:

- UI websocket connection management or optimistic client updates
- additional websocket message variants beyond `init`, `task_toggled`, `init_response`, and `state_update`
- skip-day mutation handling
- streak recalculation behavior
- broad API redesign of the existing scaffold `/api/board` route
- authentication, multi-household account flows, or any global realtime singleton

## Current Context And Gaps

- `src/realtime/family-room.ts` is still a placeholder helper and there is no Durable Object class yet.
- `src/workers/app.ts` only serves scaffold HTTP routes; there is no WebSocket upgrade route or Durable Object binding.
- `src/services/board-service.ts` and `src/db/board-repository.ts` still return static scaffold data instead of D1-backed family day state.
- FEAT-002 already established the websocket contracts and FEAT-003 established D1 schema plus seed data, but there is not yet any service that evaluates `schedule_rules` for a requested date.
- There is no callable Bridget tool in this workspace, so the Alexandria cards and ADRs are the available context briefing source for this feature work.

## Affected Layers And Boundaries

- `src/types/`: may add narrow shared helpers or exports if the realtime/db boundary needs them, but should remain contract-only
- `src/config/`: owns Durable Object bindings in worker runtime types only
- `src/db/`: owns D1 queries and mutation helpers for family day state and task completion persistence
- `src/services/`: owns recurrence evaluation and board-state assembly rules that the DO depends on
- `src/realtime/`: owns Durable Object websocket lifecycle, message validation, per-family coordination, and broadcast logic
- `src/workers/`: owns HTTP routing and WebSocket upgrade handoff only
- `src/ui/`: unchanged in this slice

Boundary rules preserved in this slice:

- D1 remains the durable source of truth; the Durable Object may coordinate and broadcast but must not become the only durable state holder
- the Durable Object stays family-scoped; no global singleton or cross-family broadcast path is introduced
- recurrence/date logic belongs in `services`, not inline inside the worker route
- worker code upgrades and routes requests but does not absorb realtime coordination logic from `realtime`

## Slice Strategy

This PR lands one reviewable seam: "make realtime sync real for one existing mutation path." That seam is reviewable because it wires together D1-backed day-state reads, one websocket mutation, and family-scoped DO broadcast without mixing in client-side socket consumption, additional mutation types, or visible UI redesign.

Deliberately deferred:

- frontend websocket client adoption in FEAT-005 and later UI slices
- skip-day realtime mutations
- additional task create/delete/edit mutation flows
- streak recalculation when retroactive edits arrive
- replacing the scaffold `/api/board` UI response with the realtime-backed day-state model

## Stateful Model And Transitions

Important states in this slice:

- active family websocket connections held by the family-scoped Durable Object
- `FamilyBoardState` for a requested date, assembled from D1 plus recurrence rules
- completion presence for a `(task_id, date)` pair in `task_completions`

Allowed transitions:

1. Client connects to `/api/realtime/:familyId`.
2. Worker routes the request to the DO instance for that `familyId` and upgrades the socket.
3. Client sends `init` with a target date.
4. DO validates the message, reads full day state from D1/services, and responds with `init_response`.
5. Client sends `task_toggled` with `completed: true` or `false`.
6. DO validates the message, persists the completion insert/delete in D1, rebuilds the day state, and broadcasts `state_update` to connected clients.

Source of truth:

- D1 tables are the only durable source of task completion and family day state inputs.
- the DO connection set is ephemeral coordination state only and must tolerate hibernation/reconnect.

Failure and edge cases to guard:

- malformed websocket payloads at the boundary
- toggles for tasks outside the family DO scope
- tasks whose `schedule_rules` do not apply to the requested date
- reconnect after hibernation, where a fresh `init` must recover current state from D1 instead of stale memory

## Implementation Steps

1. Add the family Durable Object binding to worker runtime config and Wrangler config.
2. Replace the placeholder realtime module with a family board Durable Object that accepts websocket upgrades and tracks connected sockets with hibernation-safe APIs.
3. Add db-layer queries for the family/person/task/streak/skip-day/completion data needed to build a `FamilyBoardState` for a requested date.
4. Add service-layer recurrence helpers that evaluate the current `schedule_rules` day-code model against an ISO date and assemble the full family day state.
5. Add db-layer toggle helpers that insert or delete `task_completions` rows idempotently for a `(task_id, date)` pair.
6. Implement DO `init` and `task_toggled` handlers using the existing Zod websocket schemas, D1-backed state rebuilds, and full-state broadcast behavior.
7. Add the worker route that upgrades and forwards `/api/realtime/:familyId` requests to the correct DO instance.
8. Add or update unit tests covering recurrence filtering, full-state assembly, and the websocket init/toggle/broadcast flow.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`

`npm run test:e2e` is not required unless the slice grows into visible UI socket adoption. This issue’s worker/realtime changes are not user-visible on their own.

Acceptance scenarios:

- a websocket request to the family realtime route upgrades successfully and reaches the correct family-scoped DO
- `init` returns a full `FamilyBoardState` for the requested date using D1-backed persons, tasks, completions, streaks, and skip days
- tasks whose `schedule_rules.days` do not include the requested day are omitted from the returned state
- `task_toggled` with `completed: true` creates the completion row and broadcasts updated full state
- `task_toggled` with `completed: false` removes the completion row and broadcasts updated full state
- a second connected client to the same family receives the broadcast update
- a task from another family cannot be toggled through the current family DO

## Risks And Open Questions

- The issue body suggests using DO-local SQLite cache if needed, but ADR 002 and the repo rules make D1-first correctness more important than premature caching. This plan keeps cache use out of scope unless the implementation reveals a concrete need.
- FEAT-003 seeded only the base tables and zeroed streaks. This slice can read those streak rows, but it should not infer new streak semantics or silently add retroactive recalculation behavior.
- Cloudflare Hibernatable WebSocket APIs differ from standard fetch handlers and may need careful test design. The tests should focus on the message-handling units and route wiring rather than pretending to be a full Cloudflare runtime emulator.

## Exit Criteria

This slice is done when:

- a family-scoped Durable Object class exists and handles websocket upgrade plus `init` / `task_toggled`
- worker routing upgrades websocket requests to the correct DO instance
- D1-backed day-state reads and completion toggles exist in db/services
- unit and structural checks pass locally
- the branch is ready for review against `main` without broadening into UI socket adoption
