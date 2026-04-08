# Issue 9 Plan: Natural-Language Task Entry via Anthropic API

## Goal

Implement FEAT-009 so Single List View can create recurring tasks from plain-language text, the Worker parses that text through the Anthropic API into structured task data, the family Durable Object persists the new task to D1 and broadcasts updated board state, and the UI reflects the new task without exposing a recurrence picker.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#9`
- shared request/response and parser-output contracts for natural-language task entry
- a Worker-side Anthropic parser service that uses a stateless `tool_use` call and validates the result with Zod
- a family-scoped mutation path that persists created tasks to D1 through the Durable Object and broadcasts updated board state to connected clients
- Single List UI for opening a text field, submitting natural-language input, and surfacing pending or failure states in the existing watercolor / stationery style
- unit coverage for parser and mutation contracts, worker route behavior, realtime broadcast behavior, and UI flow
- e2e coverage for opening the add-task form and creating a task through the visible product flow

## Non-Goals

This PR does not include:

- a recurrence picker, calendar control, or any schedule-editing UI
- in-app voice capture, microphone buttons, or speech-processing features beyond device dictation into a text field
- multi-turn clarification UX with conversational follow-up prompts
- editing or deleting created tasks beyond the existing or future dedicated issue slices
- a model/provider choice other than Anthropic Sonnet 4.6 already defined by ADR 004
- auth, household selection, or multi-family management work

## Current Context And Gaps

- The current Single List View already renders a disabled `Add task` button placeholder in the correct location, so the UI seam exists but has no task-entry behavior.
- The repo already has family-scoped realtime task toggles flowing through the Durable Object, which is the correct mutation path to preserve for task creation per ADR 002.
- There is no current Worker task-creation route, no Anthropic parser client, no task-creation repository method, and no realtime protocol for task creation.
- The release/ticket docs expect a Bridget context briefing, but there is no Bridget tool or checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the context briefing source is the Alexandria library cards, ADRs, founder notes already in-repo, and the sanitized GitHub issue summary.
- The system card mentions a possible clarification request for ambiguous input, but the issue acceptance criteria only requires a reasonable best-guess parse instead of an error. This slice will implement best-guess creation, not a clarification loop.

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

This PR lands one reviewable seam: "create a recurring task from one plain-language input in Single List View and propagate it through the existing board/realtime architecture." That seam is reviewable because it delivers the full FEAT-009 user behavior without mixing in clarification-chat UX, schedule editing, or unrelated board redesign.

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

1. Add `docs/plans/9/plan.md` and keep implementation aligned with this FEAT-009 seam.
2. Add shared task-entry schemas for the UI request, parser result, DO mutation payload, and Worker response envelopes.
3. Extend runtime bindings and Worker config to include the Anthropic API key while keeping it server-only.
4. Add repository support for inserting a task row and validating the family/person association needed for creation.
5. Add a service that calls the Anthropic API with the `tool_use` schema from ADR 004/005, validates the structured output, and returns parsed task data.
6. Add Worker task-creation routing that accepts raw input, invokes the parser service, and forwards the structured mutation to the family-scoped Durable Object.
7. Extend the family Durable Object to handle task-creation mutation requests, persist the task to D1, and broadcast refreshed board state to sockets grouped by viewed day.
8. Extend the family-board UI state/hooks so Single List can submit task text, show pending/error states, and reconcile the returned or broadcast board update.
9. Add unit and e2e coverage for contracts, route behavior, realtime broadcasting, and the visible add-task flow.
10. Run required checks, verify visually in local Chrome via Playwright, review the diff, and update or open the PR against `main`.

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
