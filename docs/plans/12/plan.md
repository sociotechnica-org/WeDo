# Issue 12 Plan: Task Deletion Via Swipe Or Hover

## Goal

Implement FEAT-012 so a task can be deleted from Single List View through a touch-first swipe reveal or a desktop hover reveal, with the deletion persisted in D1 through the family Durable Object, broadcast to connected clients, and reflected immediately across dashboard and focused views.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#12`
- realtime mutation support for deleting a task from the family-scoped board
- db and service wiring to remove the task row and its `task_completions`, then resync streaks
- client-side action wiring so Single List View can request deletion and optimistically remove the task locally
- single-list-only delete affordances: swipe-left reveal for touch layouts and hover/focus reveal for pointer layouts
- regression tests across contracts, service mutations, realtime behavior, optimistic state updates, route rendering, and end-to-end deletion flow
- review-driven hardening for the existing delete slice: atomic D1 delete batching, optimistic rollback on rejected realtime deletes, hidden-control focus safety, and locked swipe-direction handling

## Non-Goals

This PR does not include:

- task editing or rename flows
- a confirmation dialog, undo toast, or trash bin history
- delete affordances on the Dashboard View
- a schema redesign or new task archival state
- broader visual restyling beyond the deletion affordance itself

## Current Context And Gaps

- FEAT-006 and FEAT-009 already established Single List View as the only task-interaction and task-entry surface, so deletion belongs there and nowhere else.
- On `main`, the realtime protocol supports task toggle and skip-day toggle, but not task deletion yet.
- The Durable Object already fans out refreshed `state_update` snapshots after mutations, so this slice should reuse full-board broadcasts instead of inventing a bespoke server event.
- D1 is already the source of truth for tasks and task completions. Deletion must remove durable rows first, then broadcast refreshed state.
- The current `TaskRow` component renders the entire single-list row as one full-width button. That structure needs to be reshaped so row tap-to-toggle and trash tap/click can coexist without invalid nested buttons.
- Review feedback on the current branch identified a final hardening pass to keep aligned with the delete slice: preserve the atomic D1 batch while documenting the raw D1 tradeoff and cache invalidation, distinguish validation closes from unexpected realtime failures, remove now-obsolete delete helpers, and keep swipeable task rows visually aligned with the non-swipe card treatment.
- The deletion broadcast intentionally refreshes every viewed date, not just dates at or after the current view, because removing a recurring task changes board composition across the full family timeline.
- The repo expects a Bridget briefing, but there is no Bridget tool and no checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, ADRs, checked-in ticket docs, and sanitized issue summary are the context briefing source.

## Affected Layers And Boundaries

- `src/types/`: owns delete mutation contracts for the websocket protocol
- `src/db/`: owns D1 delete queries for task rows and associated completions
- `src/services/`: owns deletion validation, durable mutation sequencing, and streak resync
- `src/realtime/`: owns websocket handling and broadcasting refreshed board snapshots after deletion
- `src/ui/`: owns optimistic removal, gesture/hover affordances, and preserving row toggle behavior in Single List View

Boundary rules preserved:

- D1 remains the durable source of truth; the Durable Object broadcasts only after durable deletion succeeds
- task deletion business rules stay in services, not in `ui/` or `realtime/`
- UI consumes board snapshots and sends mutation requests without importing persistence code
- no right-to-left imports across `types -> config -> db -> services -> workers/realtime -> ui`

## Slice Strategy

This PR lands one reviewable seam: "delete an existing recurring task from Single List View with the approved gesture model, and keep every connected board view consistent." That is narrow enough for one PR because it reuses the existing board snapshot pipeline and only adds one mutation path plus the single-list affordance needed to trigger it.

Deliberately deferred:

- any richer edit-mode model
- undo support
- delete affordances for keyboard-only dashboard navigation beyond standard button focus/activation in Single List View
- broader task-row animation polish beyond what is needed to make the reveal understandable and testable

## Stateful Model And Transitions

Important states:

- the persisted task row exists or does not exist in D1
- task-completion rows for that task may exist on zero or more dates
- connected clients may be viewing today, past days, or tomorrow for the same family
- local ready-state snapshots in the UI may temporarily remove a task optimistically before the server broadcast arrives

Allowed transitions:

1. task exists -> delete requested from Single List View -> remove task completions -> remove task row -> resync streaks -> broadcast refreshed board state
2. optimistic client snapshot removes the task immediately -> server `state_update` confirms or corrects the board snapshot
3. other clients viewing the same family receive refreshed board snapshots and drop the deleted task from dashboard and focused views

Source of truth:

- `tasks` and `task_completions` in D1 determine whether a task exists and whether historical completions still count
- `streaks` in D1 remains the denormalized streak cache after recalculation
- websocket snapshots and optimistic UI state are derived views only

Failure and edge cases to guard:

- deleting a task that does not belong to the family must fail cleanly
- deleting a task with historical completions must remove those completions before streak resync
- optimistic removal must target only the requested task and leave other people/tasks untouched
- swipe and hover reveal must not break the primary tap-to-toggle affordance
- dashboard rows must remain read-only launch affordances with no trash icon leakage

## Implementation Steps

1. Add `docs/plans/12/plan.md` and keep the implementation aligned with the task-deletion seam.
2. Extend realtime type contracts with a `task_deleted` client message and keep server responses on the existing `state_update` snapshot path.
3. Add a db helper to delete a task's completion rows and task row from D1 in one durable write.
4. Add a service-layer delete mutation that validates family ownership, performs durable deletion, and triggers streak resync.
5. Update the family Durable Object websocket handler to process task deletion and broadcast refreshed board state for every affected viewed date.
6. Extend the board UI hook and optimistic-state helpers with a delete action that removes the task from the current snapshot immediately while preserving realtime-degraded safeguards.
7. Refactor the single-list `TaskRow` structure so row toggle and trash affordance can coexist, then implement touch swipe reveal plus desktop hover/focus reveal in the existing watercolor / letterpress language.
8. Harden the delete path by batching the task-row delete, completion cleanup, and streak-cache invalidation into one D1 write, restoring the last confirmed board snapshot when validation rejects an optimistic delete, using a server-error close code for unexpected realtime failures, documenting the raw D1 batch tradeoff, removing obsolete delete helpers, and keeping swipeable rows visually consistent with the base task card.
9. Add regression tests across contracts, services, realtime, optimistic helpers, route rendering, and the end-to-end focused-list delete flow.
10. Run required checks, verify the UI in local Chrome via Playwright, review the diff, and leave the branch ready for PR update or creation.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at desktop and touch-sized viewports and confirm the trash affordance reveals clearly, does not appear on the dashboard, and does not collapse the existing task-row watercolor treatment into generic widget styling

Acceptance scenarios:

- hovering a single-list task row on desktop reveals a trash affordance on the right
- swiping left on a single-list task row on touch reveals the trash affordance and allows delete by tap
- deleting a task removes it from the focused list immediately
- returning to the dashboard shows the deleted task gone there as well
- D1 deletion removes both the task row and any task-completion rows tied to that task
- connected clients receive refreshed board state after deletion
- dashboard rows never expose delete controls
- a server-rejected delete restores the last confirmed board snapshot instead of leaving the optimistic removal stuck on screen
- keyboard focus cannot land on the hidden delete control before the row reveal state makes it visible and interactive

## Risks And Open Questions

- Deleting a recurring task also removes its historical completions. That follows the ticket text, but it is still a meaningful product tradeoff because it affects past streak calculations; this slice follows the issue direction and existing D1/streak model.
- Pointer and touch affordances need to coexist without accidental deletes or broken toggles. The row structure must separate toggle hit area from trash hit area cleanly.
- The visual language forbids generic destructive UI. The trash affordance must stay muted and handcrafted rather than introducing bright red alarm styling.
- The delete write needs to stay atomic without introducing a broader persistence refactor. This pass keeps the atomicity boundary narrow: batch the task/completion deletes together with streak-cache invalidation in D1, then resync streaks as the follow-up durable recalculation step.

## Exit Criteria

This slice is done when:

- `docs/plans/12/plan.md` is checked in and matches the implemented FEAT-012 seam
- task deletion persists through D1 via the family Durable Object and removes associated completions
- the board UI supports swipe/hover delete only in Single List View while preserving row toggle behavior
- other connected clients receive refreshed board snapshots after deletion
- local typecheck, lint, unit, e2e, and structural checks pass
- the updated UI has been visually verified in local Chrome via Playwright
- the branch is ready to update or open for review against `main`
