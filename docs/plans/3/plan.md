# Issue 3 Plan: D1 Schema, Migrations, and Seed Data

## Goal

Establish the first real database layer for WeDo v1 so later slices can read and mutate household data from D1 instead of scaffold-only in-memory fixtures. This slice should define the Drizzle schema for the five core tables, add a migration that creates them in D1, and provide checked-in Martin household seed data that matches the current shared contracts.

## Scope

This PR includes:

- Drizzle and D1 configuration needed to define schema and run migrations in this repo
- `src/db/schema.ts` with typed table definitions for `persons`, `tasks`, `task_completions`, `skip_days`, and `streaks`
- checked-in migration files under `src/db/migrations/`
- a seed module under `src/db/seed.ts` containing the Martin family dataset and insert helpers
- unit tests that validate the seed dataset against the FEAT-002 Zod contracts and prove key schema invariants
- documentation/config updates needed so later tickets can apply migrations and seed D1 consistently

## Non-Goals

This PR does not include:

- replacing the scaffold board response with live D1 reads
- Durable Object query or mutation logic
- recurrence evaluation logic beyond storing valid `schedule_rules` JSON
- streak recalculation behavior
- UI changes or Playwright-visible behavior
- task creation, deletion, or completion write flows

## Current Context And Gaps

- The repo currently has no Drizzle dependency, no D1 binding, no schema file, and no migration directory.
- `src/db/board-repository.ts` is still a pure scaffold and should stay that way for this slice so schema work remains reviewable on its own.
- FEAT-002 already established the current runtime contracts for `Person`, `Task`, `TaskCompletion`, `SkipDay`, and `Streak`.
- There is no callable Bridget tool in this workspace, so the Alexandria cards, ADRs, and v1 implementation-plan tickets serve as the context briefing source for this issue.
- There is a documented mismatch between the broader `System - Data Store` card and the checked-in FEAT-002 contracts: the card mentions `tasks.rollover_type` and `task_completions.completed_by`, while the current shared Zod schemas do not. This slice should preserve the checked-in contract surface and leave that expansion explicit for a later follow-up instead of silently changing persisted shapes across layers.

## Affected Layers And Boundaries

- `src/db/`: owns Drizzle schema, migration artifacts, and seed helpers only
- `src/types/`: remains the source of runtime validation contracts; this slice may consume those schemas in tests or JSON validation, but should not move persistence logic into `types/`
- `src/services/`, `src/workers/`, `src/realtime/`, `src/ui/`: unchanged in this slice

Boundary rules preserved in this slice:

- D1 remains the durable source of truth; no in-memory cache is introduced
- db-layer code does not import from services, workers, realtime, or ui
- seed data is validated against shared contracts instead of inventing a separate persistence-only shape
- UI-facing scaffold responses stay isolated until the later read-path slice

## Slice Strategy

This PR lands one reviewable seam: "make D1 real and reproducible without changing product behavior yet." That seam is small enough to review because it introduces the storage contract and initial dataset without mixing in read models, websocket behavior, or UI rendering.

Deliberately deferred:

- D1-backed board reads and day materialization in FEAT-004/FEAT-007
- task mutation writes in the Durable Object slice
- streak computation and backfill semantics in FEAT-010
- migration/seed invocation from deployment or first-run UX in FEAT-016

Keeping the slice at schema-plus-seed level reduces blast radius and gives downstream tickets a stable foundation.

## Stateful Model And Data Guarantees

Important persisted states introduced here:

- `persons`: household members and their dashboard order
- `tasks`: recurring task definitions with JSON `schedule_rules`
- `task_completions`: initially empty insert/delete table; presence means completed
- `skip_days`: initially empty per-family day overrides
- `streaks`: denormalized counts seeded to zero for each person

Source of truth:

- D1 is the only durable store for all five table types.
- Seed data is only a bootstrap path into D1; later runtime logic must read/write the database, not hold separate durable state in memory.

Failure/edge cases this slice should guard against:

- invalid `schedule_rules` JSON entering the seed dataset
- non-unique person display order in the seed household
- duplicate streak rows for a person
- schema definitions drifting from FEAT-002 Zod contracts

## Implementation Steps

1. Add the required D1/Drizzle packages and repo configuration for schema generation and migration application.
2. Add the D1 binding to Wrangler config and point Wrangler at the checked-in migration directory for local migration application.
3. Define `src/db/schema.ts` with D1-compatible Drizzle tables, primary keys, foreign keys, and the JSON `schedule_rules` column mapped to the existing `ScheduleRules` contract.
4. Check in an initial migration under `src/db/migrations/` that creates the five tables in the same shape as the Drizzle schema.
5. Add `src/db/seed.ts` with:
   - canonical family/person/task constants for the Martin household
   - 8-12 representative recurring tasks across multiple persons
   - zeroed streak records for all seeded persons
   - insert helpers that can seed a D1 database idempotently enough for local/dev workflows
6. Add unit tests proving the seed rows satisfy the existing Zod schemas and key dataset invariants, including valid RFC 5545 day codes and coverage across multiple schedules.
7. Update docs or scripts as needed so downstream work can apply migrations and seed D1 consistently.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`

`npm run test:e2e` is not required for this slice because no visible UI behavior changes and no browser flow is introduced.

Acceptance scenarios:

- the Drizzle schema defines all five accepted D1 tables
- the initial migration creates those tables cleanly
- the seed dataset creates exactly six persons for the Martin household with stable display order
- the seed dataset creates 8-12 recurring tasks with valid `schedule_rules`
- each seeded person has a zeroed streak row
- seed payloads parse through the FEAT-002 Zod schemas

## Risks And Open Questions

- The Alexandria `System - Data Store` card includes `rollover_type` and `completed_by`, but the checked-in FEAT-002 contracts do not. This plan keeps the implementation aligned with FEAT-002 so downstream code has one active contract; if the broader card should win, that should land as an explicit contract update rather than an incidental schema expansion inside this slice.
- D1 JSON support in Drizzle for Cloudflare should be verified carefully. If direct JSON mode is awkward, the implementation should still preserve a typed `ScheduleRules` contract at the db edge rather than letting opaque strings spread through the codebase.
- The issue says the seed data should use real task examples from the wireframes, but the source material only names a few representative examples. This slice should seed a conservative set of recurring household tasks grounded in the documented examples and leave broader task inventory expansion to later product work.

## Exit Criteria

This slice is done when:

- `src/db/schema.ts` exists with typed Drizzle definitions for the five tables
- an initial migration exists under `src/db/migrations/`
- `src/db/seed.ts` contains the Martin household bootstrap data and helpers
- Wrangler points at the D1 binding and checked-in migration directory for local migration application
- unit tests cover seed/schema alignment with the shared contracts
- typecheck, lint, unit, and structural tests pass locally
