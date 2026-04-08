# Issue 2 Plan: Shared Zod Types and WebSocket Protocol

## Goal

Establish the shared contract layer for WeDo v1 so every later slice can rely on the same runtime-validated schemas for household data and realtime messages. This slice should define the core entity shapes, the RFC 5545 schedule rule schema, the family-board day state used by realtime sync, and the discriminated WebSocket message protocol that clients and the family Durable Object will share.

## Scope

This PR includes:

- canonical Zod schemas and inferred TypeScript types for the core primitives described by the issue and Alexandria cards
- shared date, day-code, and timezone contract types needed by those schemas
- realtime day-state and WebSocket message schemas in `src/types/`
- an export surface from `src/types/index.ts` for downstream tickets
- minimal config wiring so the timezone anchor defaults to `America/New_York`
- unit tests that prove valid payloads parse and invalid payloads fail
- narrow refactors to existing scaffold code only where needed to consume the new contracts safely

## Non-Goals

This PR does not include:

- D1 schema definitions, migrations, or real database queries
- Durable Object upgrade handling, message routing, or broadcast implementation
- recurrence evaluation logic beyond the shape of `schedule_rules`
- UI work for dashboard, single-list, or day navigation behavior
- task mutation business logic, streak calculation, or realtime connection management

## Current Context And Gaps

- The current repo still uses scaffold-only board types in `src/types/board.ts` and a placeholder family-room helper in `src/realtime/`.
- There is no shared entity schema layer yet for `Person`, `Task`, `TaskCompletion`, `SkipDay`, `Streak`, or schedule rules.
- There is no formal WebSocket protocol yet, even though ADR 002 and the v1 release plan already constrain the basic flow: `init` with a requested date, mutations over the same socket, D1 write first, then broadcast full state.
- There is no callable Bridget tool in this workspace. The Alexandria cards and implementation-plan tickets therefore serve as the product context briefing source for this slice.

## Affected Layers And Boundaries

- `src/types/`: owns runtime schemas, inferred types, and protocol unions only
- `src/config/`: may import shared type helpers to parse timezone config, but owns env access and defaults
- `src/services/`, `src/workers/`, `src/realtime/`, `src/ui/`: may consume the shared contracts later, but this slice should not move feature logic into those layers

Boundary rules preserved in this slice:

- the types layer stays pure data-shape definitions with no business or persistence logic
- config may use types, but types must not import from config
- realtime protocol definitions live in `src/types/`, while actual Durable Object behavior remains deferred to later tickets
- D1 remains the source of truth by contract; no in-memory-only state model will be introduced here

## Slice Strategy

This PR lands one reviewable seam: "define the contracts that later D1, DO, worker, and UI work will share." That is independently reviewable because it adds no hidden behavior and narrows future implementation choices instead of broadening them.

Deliberately deferred:

- concrete D1 table/query implementation from FEAT-003
- DO socket lifecycle and mutation handlers from FEAT-004
- UI socket consumption and optimistic state flows from FEAT-005 onward

Keeping this slice contract-only prevents schema design, persistence behavior, and UI behavior from being mixed in one PR.

## Stateful Model And Message Transitions

Important states in this slice:

- `FamilyBoardDayState`: the full family board state for a single requested date
- client request messages: `init`, `task_toggled`
- server response/broadcast messages: `init_response`, `state_update`

Allowed transitions defined by contract:

1. Client connects and sends `init` with a target date.
2. DO responds with `init_response` containing the full day state for that date.
3. Client sends a mutation message for the same family/day context.
4. After a successful D1 write in a later ticket, the DO broadcasts `state_update` with the latest full day state.

Source of truth:

- D1 is the durable source of truth for entities and day state.
- The DO is only the serialized coordination point and broadcaster.
- Client state is optimistic/ephemeral and must reconcile against broadcast state.

Failure cases to guard with schemas:

- invalid day codes in `schedule_rules`
- malformed dates/timestamps in entity or message payloads
- unknown message `type` values
- incomplete mutation payloads entering the realtime boundary

## Implementation Steps

1. Add shared scalar helpers in `src/types/` for identifiers, ISO calendar dates, timestamps, day codes, and timezone values.
2. Add primitive schemas for `Person`, `Task`, `TaskCompletion`, `SkipDay`, and `Streak`, plus `ScheduleRules`.
3. Add a family board day-state schema that can back both `init_response` and `state_update` without leaking UI styling concerns into the contract layer.
4. Add discriminated WebSocket message schemas and inferred unions for client messages, server messages, and the combined protocol surface.
   This slice only locks in `init` / `task_toggled` for client-originated messages and `init_response` / `state_update` for server-originated messages; create/delete/skip-day variants are deferred until the Durable Object slices define their durable semantics.
5. Add `src/types/index.ts` exports for the new contract modules and keep existing health/board exports available where still needed.
6. Update config parsing so timezone defaults to `America/New_York` using the shared timezone contract.
7. Refactor existing scaffold code only as needed to import the new shared exports without changing product behavior.
8. Add unit tests covering valid and invalid entity, schedule, message, and timezone payloads.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`

Acceptance scenarios:

- valid primitive records from the issue description parse successfully through Zod
- invalid `schedule_rules` payloads fail on unknown day codes or empty day arrays
- WebSocket protocol parsing accepts `init`, `task_toggled`, `init_response`, and `state_update`
- discriminated unions reject unknown realtime message types
- runtime config returns `America/New_York` when no timezone binding is provided
- existing scaffold code still compiles and tests cleanly against the new shared exports

## Risks And Open Questions

- The release docs specify the `init` request shape precisely, but the exact long-term payloads for created/deleted/skip-day broadcasts should be set alongside the later D1-backed mutation slices. This plan intentionally defers those variants so the current shared contract only commits to `task_toggled` as a client mutation and `state_update` as the post-write broadcast shape.
- The current scaffold `board` response is UI-facing and not the same as the future realtime day-state contract. This slice should avoid forcing those two models together prematurely.
- `TaskCompletion.completed_by` appears in the Alexandria Data Store card, but the FEAT-002 ticket summary omits it from the requested schema. This slice should follow the issue scope literally and leave `completed_by` for a later schema update if the repository adds it explicitly.

## Exit Criteria

This slice is done when:

- the shared core schemas and protocol unions exist in `src/types/`
- all shared types are exported from `src/types/index.ts`
- timezone config defaults correctly through shared contract types
- unit tests cover both acceptance and rejection paths for the new schemas
- typecheck, lint, unit, and structural tests pass locally
