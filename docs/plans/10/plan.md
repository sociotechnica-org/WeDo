# Issue 10 Plan: Streak Engine With Dashboard Display

## Goal

Implement FEAT-010 so streak counts are calculated from D1-backed completion history, persisted in the `streaks` table for fast current-day reads, recalculated when completion history changes, and surfaced on the dashboard using the existing streak UI seam.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#10`
- a dedicated streak-calculation service in `src/services/`
- the db-layer queries and persistence needed to read streak inputs and write denormalized streak rows back to D1
- recalculation wiring for task-completion mutations so the affected person's streak row stays current
- day-boundary sync logic so streak rows do not stay stale across midnight
- dashboard data-path updates so person columns render real streak values instead of seed zeros
- regression tests for streak rules, persistence updates, realtime/task-toggle integration, and dashboard rendering

## Non-Goals

This PR does not include:

- the Skip Day UI, route, or websocket mutation flow from FEAT-011
- a new cross-person streak ranking, leaderboard, or comparative display
- a separate analytics/history screen beyond the existing dashboard streak label
- bean ledgers, reward accounting, or new reward protocol messages
- auth, family switching, or broader dashboard redesign

## Current Context And Gaps

- The dashboard UI already renders streak copy in [`src/ui/components/person-column.tsx`](/Users/jessmartin/Documents/scratch/we-do-scratch/.tmp/workspaces/sociotechnica-org_WeDo_10/src/ui/components/person-column.tsx), so the visible seam already exists.
- D1 already has a `streaks` table and zeroed seed rows, but there is no calculation service and no mutation path updates those rows after task toggles.
- The repo expects a Bridget context briefing, but there is no Bridget tool and no checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, ADRs, checked-in ticket docs, and sanitized issue summary are the available context briefing sources.
- The product docs contain a mismatch around Skip Day granularity: some cards describe per-person Skip Days, but the shipped schema and current board state only support one family-scoped `skip_days` row per date. This PR will implement FEAT-010 against the actual D1 schema already in the repo and leave per-person Skip Day expansion to a later explicit schema change.
- Day navigation already allows past-day browsing and tomorrow viewing. The denormalized `streaks` table should remain the source for current-day streak reads; past-day streak display may need on-demand calculation because the table stores only one live row per person.

## Affected Layers And Boundaries

- `src/db/`: owns historical streak input queries and durable row updates for `streaks`
- `src/services/`: owns streak rules, day classification, recalculation, and when current rows must be refreshed
- `src/realtime/`: continues to serialize task toggles and will invoke the service-layer recalculation after successful writes
- `src/ui/`: consumes the existing `streak` field already present in board state; no direct D1 logic moves into UI

Boundary rules preserved:

- D1 remains the durable source of truth; the Durable Object orders writes and broadcasts after the streak row is updated
- streak rules live in `services`, not inline in the Durable Object or React components
- current board reads stay fast via the denormalized `streaks` table rather than aggregating history on every default dashboard load
- no right-to-left imports across `types -> config -> db -> services -> workers/realtime -> ui`

## Slice Strategy

This PR lands one reviewable seam: "make streaks a real, persisted service instead of seeded placeholder data." That seam is reviewable on its own because it covers the calculation engine, current dashboard display, and task-toggle recalculation without widening into Skip Day UI or a separate analytics surface.

Deliberately deferred:

- FEAT-011 Skip Day controls and websocket mutation messages
- any schema expansion needed for per-person Skip Days
- richer "bean earned" eventing beyond the existing completion-ring complete treatment

## Stateful Model And Transitions

Important states in this slice:

- scheduled tasks for a person on a day
- completed scheduled tasks for that day
- family-level Skip Day hold for that date
- denormalized streak row persisted in D1
- requested board date versus the canonical current day in the configured timezone

Day classification rules in this slice:

1. Sunday: hold
2. family Skip Day: hold
3. no scheduled tasks: hold
4. qualifying day with 100% completion: increment
5. past incomplete qualifying day: reset to `0`
6. current-day incomplete state: hold until the day is fully complete or becomes a past day
7. tomorrow view: hold; pre-completion should not advance the live streak before the day arrives

Source of truth:

- `tasks`, `task_completions`, and `skip_days` in D1 determine streak history
- the `streaks` table stores the current denormalized row per person for fast reads
- board state and dashboard UI consume derived streak data; they do not own streak correctness

Failure and edge cases to guard:

- Sunday must never increment or reset the streak
- a day with zero scheduled tasks must hold, not increment
- retroactive toggles on past days must recalculate forward to today
- current-day partial completion must not quietly break an in-progress streak before the day has passed
- tomorrow toggles must not prematurely increment the live streak

## Implementation Steps

1. Add `docs/plans/10/plan.md` and keep implementation aligned with this FEAT-010-only slice.
2. Add the streak service in `src/services/streak.ts` with explicit day-classification helpers and calculation logic driven by recurrence, completions, skip days, and current-day semantics.
3. Extend the db layer with streak-history queries plus streak-row upsert/update helpers; add any minimal internal schema support needed to detect stale current-day rows at day boundaries without exposing that internal field to the UI contract.
4. Recalculate and persist the affected person's current streak row after successful task toggles in the family service / Durable Object path.
5. Refresh current streak rows on board reads when a new day has started so the dashboard does not keep yesterday's streak state forever.
6. Keep dashboard rendering on its existing `PersonColumn` seam, updating only the data path and any minimal tests required for real streak values.
7. Add unit coverage for normal streak growth, missed-day reset, Sunday exclusion, skip-day hold, retroactive recalculation, and current-day hold behavior.
8. Run required checks, verify the dashboard in local Chrome via Playwright, review the diff, and leave the branch ready for PR update or creation.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport and confirm the dashboard shows non-placeholder streak copy in the existing letterpress/watercolor styling without introducing generic widget treatment

Acceptance scenarios:

- consecutive qualifying days increase `current_count`
- a missed past day resets `current_count` to `0`
- Sunday never increments or resets the streak
- a family Skip Day holds the streak rather than breaking it
- a day with no scheduled tasks holds the streak
- a current incomplete day does not break the streak until it becomes a past day
- a retroactive completion edit recalculates forward and updates the current row in `streaks`
- the dashboard shows the recalculated streak count above each person's name
- task-toggle realtime updates return board state with updated streak values for the affected family view

## Risks And Open Questions

- The checked-in product library is inconsistent about per-person versus family-level Skip Days. This slice follows the actual schema already present in D1, which is family-scoped.
- The denormalized `streaks` table stores a live row per person, not a per-day history. Past-day board browsing may therefore require on-demand calculation for historical display if that behavior proves important.
- There is no existing scheduled midnight job in this repo. Day-boundary correctness therefore needs a service-driven sync point on read or mutation rather than an external cron.

## Exit Criteria

This slice is done when:

- `docs/plans/10/plan.md` is checked in and matches the implemented FEAT-010 seam
- streak calculation logic exists in `src/services/streak.ts` and matches the Alexandria rules used by this repo
- D1 `streaks` rows are updated after relevant task-history changes and stay current across day boundaries
- the dashboard renders real streak values from board state instead of seed placeholders
- local typecheck, lint, unit, e2e, and structural checks pass
- the dashboard has been visually verified in local Chrome via Playwright
- the branch is ready to update or open for review against `main`
