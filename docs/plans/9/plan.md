# Issue 9 Plan: Natural-Language Task Entry via Anthropic API

## Goal

Land FEAT-009 in a reviewable, production-safe state by keeping the existing natural-language task-entry seam intact while addressing the current PR rework feedback around Anthropic request shape, Durable Object post-write behavior, Worker error exposure, and UI state reconciliation.

## Scope

This PR includes:

- the existing FEAT-009 end-to-end natural-language task entry slice already on the branch
- a checked-in plan update that reflects the rework-required feedback for this PR
- Anthropic parser cleanup so the Worker request matches Anthropic `tool_use` expectations
- Durable Object task-creation hardening so a successful D1 write is not reported back to the caller as a failed create because a later broadcast step had trouble
- UI reconciliation fixes so HTTP task creation does not reset degraded realtime state and does not overwrite a newer board view after navigation
- Worker-route hardening so unexpected server failures return controlled user-facing responses instead of internal error text
- regression tests covering the above fixes in parser, worker, realtime, and UI-state helpers

## Non-Goals

This PR does not include:

- a recurrence picker, calendar control, or any schedule-editing UI
- in-app voice capture, microphone buttons, or speech-processing features beyond device dictation into a text field
- multi-turn clarification UX with conversational follow-up prompts
- editing or deleting created tasks beyond the existing or future dedicated issue slices
- a model/provider choice other than Anthropic Sonnet 4.6 already defined by ADR 004
- auth, household selection, or multi-family management work
- broad refactors of the family-board hook, realtime protocol, or worker routing structure beyond what is required to close the review feedback safely

## Current Context And Gaps

- The current Single List View already renders a disabled `Add task` button placeholder in the correct location, so the UI seam exists but has no task-entry behavior.
- The repo already has family-scoped realtime task toggles flowing through the Durable Object, which is the correct mutation path to preserve for task creation per ADR 002.
- The current branch already contains the Worker task-creation route, Anthropic parser client, Durable Object mutation path, and Single List task-entry UI for FEAT-009.
- The remaining work is rework, not greenfield implementation: several review comments identify correctness and hardening issues in the already-landed slice.
- The release/ticket docs expect a Bridget context briefing, but there is no Bridget tool or checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the context briefing source is the Alexandria library cards, ADRs, founder notes already in-repo, and the sanitized GitHub issue summary.
- The system card mentions a possible clarification request for ambiguous input, but the issue acceptance criteria only requires a reasonable best-guess parse instead of an error. This slice will implement best-guess creation, not a clarification loop.
- Current validated rework items:
  - `src/services/nl-parser.ts` sends `strict: true` inside the Anthropic tool definition even though that field is not part of Anthropic's Messages API tool schema.
  - `src/realtime/family-board.ts` can currently convert a successful D1 task write into an HTTP error if a later state-refresh or broadcast step throws.
  - `src/realtime/family-board.ts` also re-fetches board state for the requester's viewed date even after already fetching it for the HTTP response.
  - `src/workers/routes/tasks.ts` returns raw unexpected error text to the client.
  - `src/ui/hooks/use-family-board.ts` rebuilds ready state from the HTTP create response in a way that resets degraded realtime status to `live`, and the async callback can still apply stale results after the viewed day changes.

## Affected Layers And Boundaries

- `src/types/`: owns request, response, parser-output, and mutation schemas for natural-language task entry
- `src/config/`: owns runtime binding access for the Anthropic API key and any parser-related configuration constants
- `src/db/`: owns typed task creation queries only; no parsing or routing logic
- `src/services/`: owns Anthropic invocation, parser validation, and task-creation business rules that validate family and person relationships
- `src/workers/`: owns the HTTP route that accepts raw text, invokes the parser service, and forwards the structured mutation to the family Durable Object
- `src/realtime/`: owns serialized task-creation persistence plus per-socket state broadcasts after the D1 write
- `src/ui/`: owns the Single List entry affordance, submit lifecycle, and reconciliation of returned or broadcast state

Boundary rules preserved:

- Anthropic calls stay server-side in Worker/service code; the browser only sends plain text
- D1 remains the durable source of truth; the Durable Object serializes writes and broadcasts but does not become the durable record
- recurrence interpretation remains the shared `schedule_rules` contract from `types`, not ad hoc UI logic
- UI does not import db, workers, or realtime code directly

## Slice Strategy

This PR still lands one reviewable seam: "create a recurring task from one plain-language input in Single List View and propagate it through the existing board/realtime architecture," but the active work is now the narrow rework pass needed to make that seam safe to merge. That is reviewable on its own because it tightens behavior without changing the user-facing product contract or widening scope into follow-up features.

Deliberately deferred:

- clarification prompts returned from the model
- retry/backoff policy beyond a simple user-visible error
- dashboard-specific creation affordances
- non-recurring or one-off task types

## Stateful Model And Transitions

Important states in this slice:

- entry form closed: Single List shows only the `Add task` button
- entry form open: user can type or dictate one plain-language description
- submission pending: UI prevents duplicate submits while the Worker parses and the DO persists
- parse result: structured `{ title, emoji, schedule_rules }` validated by Zod
- durable task state: inserted `tasks` row in D1
- visible board state: refreshed board snapshots broadcast to connected sockets for each affected viewed day

Allowed transitions:

1. User opens the add-task form from Single List View.
2. User submits non-empty natural-language text for the current person.
3. Worker validates the request and calls the Anthropic API with the tool schema.
4. Parsed task data is validated with Zod before any write occurs.
5. Worker forwards the structured create-task mutation to the family Durable Object.
6. Durable Object serializes the mutation, writes the task to D1, and computes updated board state for connected sockets by viewed day.
7. UI closes the form after a successful create and reflects the returned or broadcast board state.
8. If parsing or persistence fails, the form stays available and shows a calm inline error instead of silently dropping the task.

Source of truth:

- Worker/service validation is authoritative for parser output correctness
- D1 is authoritative for the created task record
- the family Durable Object is authoritative only for mutation ordering and broadcast timing
- realtime board snapshots remain derived state rebuilt from D1

Failure and edge cases to guard:

- empty or whitespace-only input
- parser output with invalid or duplicate day codes
- person IDs that do not belong to the target family
- API/network failure when calling Anthropic
- creating a task while some sockets are viewing different board dates
- duplicate submit attempts before the first request completes

## Implementation Steps

1. Update `docs/plans/9/plan.md` so the plan matches the current rework-required slice instead of the earlier greenfield implementation framing.
2. Remove the non-Anthropic `strict` tool field from the parser request and update parser tests accordingly.
3. Harden the family Durable Object task-creation path so the response state for the requester's viewed day is computed once, reused for broadcast when possible, and not converted into an HTTP error by best-effort broadcast failures after the D1 write.
4. Harden the Worker task route so unexpected failures return controlled generic text, while preserving explicit validation behavior for bad client requests.
5. Adjust the family-board UI reconciliation path so task creation applies only to the still-current board view and preserves the latest realtime degradation state rather than resetting to `live`.
6. Remove any now-unused hook dependencies introduced by the above reconciliation changes.
7. Add regression coverage for parser payload shape, DO post-write broadcast resilience, Worker error sanitization, and the UI-state helper behavior used by the hook.
8. Run required checks, verify the visible task-entry flow in local Chrome via Playwright, review the diff, and leave the branch ready for PR update.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport, enter Single List View, open the add-task form, confirm the stationery-style form feels native to the current screen, submit a task, and verify the created task appears without exposing recurrence controls

Acceptance scenarios:

- Single List View opens a text field from the `Add task` button
- submitting `practice piano Monday Tuesday Thursday Friday` creates a task titled for that activity, with an emoji suggestion and `schedule_rules.days` of `["MO","TU","TH","FR"]`
- the browser never receives the Anthropic API key
- invalid parser output is rejected before any D1 write
- the created task is persisted through the family Durable Object, not by UI-side direct data access
- clients viewing the affected family board receive updated board state after creation
- if the created task is scheduled for the currently viewed day, it appears immediately in Single List and on the dashboard
- ambiguous but parseable input results in a best-guess task instead of a hard product error
- if the board is already in degraded realtime mode, a successful HTTP task create preserves that degraded status instead of silently marking the session `live`
- if the user changes to another viewed day while a create request is still in flight, the old response does not overwrite the newer board view
- if the D1 write succeeds but a later broadcast refresh fails for another viewed date, the create caller still receives a success response for the created task
- unexpected Worker failures return a generic task-creation failure message rather than raw internal error text

## Risks And Open Questions

- Task creation affects many dates, not one. Broadcasting by the socket's currently viewed date is the safest current strategy, but it adds more state-refresh work than the existing single-date toggle flow.
- There is no existing secret-management note in `wrangler.jsonc` for Anthropic. This slice should type the binding and rely on Worker secrets at runtime, but local setup may still require manual secret configuration outside this PR.
- The issue note suggests `src/workers/routes/tasks.ts`, but the current repo does not yet have a route-module structure. If route extraction becomes noisy, this slice should still keep worker routing factored cleanly without forcing a broader file-organization refactor.
- The system card allows clarification prompts, but the UI has no conversational follow-up seam today. This slice intentionally follows the narrower acceptance path of best-guess parsing only.

## Exit Criteria

This slice is done when:

- `docs/plans/9/plan.md` is checked in and matches the implemented FEAT-009 seam
- Single List View can open a natural-language task-entry form and submit it successfully
- the Worker parses text through Anthropic with schema-constrained structured output validated by Zod
- the family Durable Object persists created tasks to D1 and broadcasts updated board state
- the created task appears in the visible board when scheduled for the currently viewed day
- local typecheck, lint, unit, e2e, and structural checks pass
- the UI has been visually verified in local Chrome via Playwright
- the branch is ready to update or open for review against `main`
