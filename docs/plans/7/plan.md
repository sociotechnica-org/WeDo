# Issue 7 Plan: Recurrence Engine With Timezone Anchor and Sunday Handling

## Goal

Implement the recurrence-engine slice that decides which tasks appear for a requested day, centralize that logic in `src/services/`, and ensure family board initialization uses it consistently with an America/New_York day anchor and Sunday-empty behavior.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#7`
- a dedicated recurrence service in `src/services/` for day-code lookup and task filtering
- a dedicated timezone config/helper seam in `src/config/` so day evaluation uses the repository’s canonical America/New_York anchor
- integration of the recurrence service into family board state assembly, which is the path already used by the family Durable Object `init` flow
- unit tests for recurrence evaluation, Sunday handling, and family-board integration behavior
- narrow test updates where existing expectations currently reflect the pre-issue Sunday behavior

## Non-Goals

This PR does not include:

- schema changes to `tasks` or `schedule_rules`
- new realtime message types or Durable Object protocol changes
- day navigation UI work
- streak recalculation logic beyond preserving the existing `day.is_sunday` signal and task materialization contract
- natural-language task creation or schedule parsing changes
- any visible UI redesign beyond relying on the existing empty-column rendering for Sunday

## Current Context And Gaps

- `src/services/family-board-service.ts` currently owns recurrence helpers inline (`getDayCodeForDate`, `isTaskScheduledForDate`) and filters tasks directly during board-state assembly.
- The current implementation derives day codes from `YYYY-MM-DD` using UTC midnight. That is stable for pure ISO dates, but it does not make the timezone anchor an explicit shared service/config concern for this feature.
- Current board-state assembly allows Sunday tasks to materialize if a task’s `schedule_rules.days` includes `SU`. That conflicts with FEAT-007 and the Recurrence Engine system card, both of which require Sunday to return an empty task list.
- The Alexandria cards contain one inconsistency: `System - Recurrence Engine` and the FEAT-007 ticket say Sunday materializes no tasks, while `Primitive - Day` says Sunday tasks may exist but streaks stay neutral. This slice will follow the more specific issue/ticket and recurrence-system requirements and leave that doc inconsistency explicit rather than silently guessing.
- There is no callable Bridget tool in this workspace, so the checked-in Alexandria cards and ticket docs are the context briefing source for this work.

## Affected Layers And Boundaries

- `src/types/`: continues to own `ScheduleRules`, `DayCode`, `IsoDate`, and timezone contract types only
- `src/config/`: owns the canonical timezone export/helper used by services
- `src/services/`: owns recurrence evaluation and family-board task materialization rules
- `src/realtime/`: continues to call `getFamilyBoardState`; it should not absorb recurrence business logic
- `src/ui/`: should remain unchanged unless a test expectation needs to reflect the existing Sunday-empty visual state

Boundary rules preserved:

- recurrence business logic stays in `services`, not in the Durable Object or UI
- D1 remains the source of truth for task definitions and completions; recurrence only filters what materializes for a day
- no right-to-left imports across `types -> config -> db -> services -> workers/realtime -> ui`

## Slice Strategy

This PR lands one reviewable seam: "extract and enforce recurrence rules for daily task materialization." That is reviewable on its own because the DO already delegates board-state assembly to `getFamilyBoardState`, so changing the service path changes the real product behavior without expanding the websocket contract or the UI surface.

Deliberately deferred:

- richer schedule rules beyond `days`
- exception handling inside schedules
- streak-engine recalculation features that depend on recurrence output
- explicit Sunday copy or art polish in the UI, since the current empty-state card already satisfies the issue’s gentle-empty requirement

## Stateful Model And Transitions

Important states in this slice:

- task definition state in D1: every task has canonical `schedule_rules`
- requested board day: identified by an `IsoDate`, with a derived RFC 5545 day code and `is_sunday` flag
- materialized board task list: tasks included for a person on the requested day after recurrence filtering

Allowed transitions:

1. Client requests a board date.
2. DO calls `getFamilyBoardState` for that family/date.
3. Service loads family source data from D1.
4. Recurrence service derives the requested day code using the canonical timezone-aware day helpers for this feature.
5. If the requested day is Sunday, no tasks materialize for any person.
6. Otherwise tasks materialize only when their `schedule_rules.days` include the derived RFC 5545 day code.
7. Returned board state keeps per-person streak/skip-day/completion data aligned to the filtered task set.

Source of truth:

- D1 task rows are the durable source of truth
- recurrence evaluation is deterministic derived logic in `services`
- DO and UI only consume the derived board state

Failure and edge cases to guard:

- invalid or malformed day-code lookup behavior
- Sunday dates accidentally materializing tasks
- duplicate recurrence logic drifting between `board-service` and `family-board-service`
- future regressions where completion toggles are accepted for tasks that should not exist on the requested day

## Implementation Steps

1. Add `docs/plans/7/plan.md` and keep implementation aligned with this FEAT-007-only seam.
2. Add a small timezone config/helper module in `src/config/` that exports the canonical WeDo timezone and shared day-derivation helpers needed by services.
3. Create `src/services/recurrence.ts` with the recurrence primitives for RFC 5545 day-code lookup, single-task schedule evaluation, and task-list filtering, including explicit Sunday-empty handling.
4. Refactor `src/services/family-board-service.ts` to consume the recurrence service instead of carrying its own inline recurrence logic.
5. Keep the Durable Object integration point stable by continuing to serve `init` through `getFamilyBoardState`, now backed by the extracted recurrence service.
6. Update unit tests to cover all day-code mappings, task filtering, Sunday-empty behavior, and family-board assembly on Sunday vs. non-Sunday dates.
7. Run the required local checks and confirm no structural-boundary regressions.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- run the existing Playwright flow in local Chrome to confirm the dashboard still renders quiet empty states correctly when a person has no materialized tasks; no dedicated UI edit is expected for this slice

Acceptance scenarios:

- recurrence maps requested dates to the correct RFC 5545 day code
- a task with `{ "days": ["MO", "TU", "TH", "FR"] }` appears only on those days
- Sunday returns an empty task list even if a task includes `SU`
- family board state sets `day.is_sunday` correctly and returns empty per-person task arrays on Sunday
- completion toggles for a task on a non-scheduled day still fail through the service guardrail
- existing realtime init path remains contract-compatible because it still calls `getFamilyBoardState`

## Risks And Open Questions

- The main product risk is the checked-in doc conflict about Sunday task visibility. This PR will follow FEAT-007 plus `System - Recurrence Engine`; if product intent changes later, the Alexandria `Primitive - Day` card should be reconciled in a separate docs update.
- There is a small design risk of duplicating date/day helpers between `board-service` and the new recurrence path. Where practical, this slice should consolidate shared date derivation instead of creating parallel timezone logic.
- The issue title mentions a "timezone anchor," but the realtime protocol currently sends canonical `IsoDate` strings rather than raw timestamps. This slice should make timezone rules explicit for deriving current-day values and shared helpers without overengineering date-time parsing that the current contract does not need yet.

## Exit Criteria

This slice is done when:

- `docs/plans/7/plan.md` is checked in and matches the implemented seam
- recurrence logic lives in a dedicated service under `src/services/`
- family board state materializes tasks through that recurrence service
- Sunday board state returns empty task lists across all people
- local typecheck, lint, unit, e2e, and structural checks pass
- the branch is ready to update or open for review against `main`
