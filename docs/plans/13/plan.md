# Issue 13 Plan: Settings Screen For Person Management

## Goal

Implement FEAT-013 so the household can manage Persons from a minimal Settings screen: view the current list, reorder columns, add a Person, remove a Person with confirmation, persist changes to D1 through a REST endpoint, and return to the dashboard with the updated board order in place.

## Scope

This PR includes:

- a checked-in implementation plan for issue `#13`
- shared Settings navigation from both Dashboard View and Single List View
- a minimal Settings screen for person management only
- REST contracts plus worker route to save the family person list through D1
- db/service reconciliation for reordering, adding, and removing Persons while preserving D1 as source of truth
- board-state refresh after save so dashboard column order and membership update immediately
- regression tests for service reconciliation, worker routing, route rendering, and the end-to-end settings flow

## Non-Goals

This PR does not include:

- authentication, roles, or permissions
- avatars, profiles, preferences, or person-specific settings beyond `name` and `emoji`
- drag-and-drop reordering; v1 uses explicit up/down controls
- realtime settings sync over WebSocket
- broader visual redesign outside the new settings utility surface

## Current Context And Gaps

- FEAT-005 established the shared dashboard header and FEAT-006 established the focused single-list header, but both currently expose a disabled Settings button.
- The `persons` table already models `display_order`, `name`, and `emoji`, so the missing work is management UI plus persistence, not a schema redesign.
- Deleting a `persons` row already cascades through `tasks`, `task_completions`, and `streaks` via the existing foreign keys. The save flow should rely on those durable constraints rather than duplicating cleanup logic in UI code.
- `FamilyBoardState` requires at least one Person, so the save flow must reject empty families and the UI must not allow the last Person to be removed accidentally.
- The repo expects a Bridget briefing, but there is no Bridget tool and no checked-in `CONTEXT_BRIEFING.md` in this workspace. For this slice, the Alexandria cards, ADRs, checked-in ticket docs, and sanitized issue summary are the context briefing source.

## Affected Layers And Boundaries

- `src/types/`: owns REST request/response schemas for saving Persons
- `src/db/`: owns D1 reads and durable write reconciliation for the `persons` and `streaks` tables
- `src/services/`: owns validation and orchestration of the person-settings save
- `src/workers/`: owns the Hono REST route and request/response shaping
- `src/ui/`: owns Settings navigation, local draft editing, confirmation UX, and applying the refreshed board snapshot

Boundary rules preserved:

- D1 remains the durable source of truth for person membership and order
- cascading deletes remain a database concern, not a UI concern
- the UI saves through a Worker REST endpoint and does not import db code
- no right-to-left imports across `types -> config -> db -> services -> workers/realtime -> ui`

## Slice Strategy

This PR lands one reviewable seam: "replace the placeholder Settings affordance with a minimal person-management flow that persists through D1 and immediately updates the current board." That seam is small enough for one PR because it reuses the existing board-shell routing and board snapshot model, adding one REST save path and one new utility view.

Deliberately deferred:

- richer settings categories
- drag-and-drop ordering
- optimistic multi-client settings propagation
- advanced validation beyond what is required to keep the board durable and usable

## Stateful Model And Transitions

Important states:

- persisted family person list in D1, including stable ids and `display_order`
- local editable settings draft in the UI
- current viewed board date whose snapshot should be refreshed after save
- existing versus newly-added Persons during a save request

Allowed transitions:

1. current board snapshot -> open Settings -> edit local draft without mutating D1
2. draft save -> validate entries -> reconcile reordered/updated/existing Persons and inserts/deletes in D1 -> return refreshed board state for the viewed date
3. refreshed board state -> navigate back to dashboard -> dashboard renders new column order and membership immediately

Source of truth:

- `persons` in D1 determine who appears on the board and in what order
- `streaks` in D1 hold the zeroed row for each Person and cascade away when a Person is removed
- the Settings form draft is transient UI state only

Failure and edge cases to guard:

- removing the last Person must be rejected cleanly
- duplicate or blank names must not be persisted
- existing-person id spoofing outside the family must fail cleanly
- swapping names or display order between existing Persons must not trip unique constraints during save sequencing
- deleting a Person must remove their tasks/completions durably through the existing cascade behavior

## Implementation Steps

1. Add `docs/plans/13/plan.md` and keep implementation aligned with the minimal person-management seam.
2. Add person-settings REST schemas in `src/types/` for draft entries, save requests, and save responses.
3. Add db helpers to read family Persons and reconcile the submitted ordered list into D1, including zeroed streak creation for new Persons and safe sequencing for unique `name` and `display_order` updates.
4. Add a service-layer save function that validates the submitted list, writes the durable person changes, and returns a refreshed `FamilyBoardState` for the viewed date.
5. Add a Worker route for `/api/families/:familyId/persons` and register it in the app with controlled validation/error handling.
6. Extend the board UI hook with a save-persons action that calls the REST endpoint and replaces the current board snapshot on success.
7. Add a Settings route and view under the existing board shell, replace the disabled header buttons with working links, and implement minimal utility styling for reorder/add/remove/save/cancel actions plus inline removal confirmation.
8. Add regression tests across service logic, worker route handling, board-route rendering, and the end-to-end settings flow.
9. Run required checks, verify the UI in local Chrome through Playwright, review the diff, and leave the branch ready for PR update or creation.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Visual verification:

- open the local app in Chrome via Playwright at an iPad-like landscape viewport and confirm the Settings screen feels like a quiet utility surface inside the existing letterpress / watercolor system rather than a default admin form

Acceptance scenarios:

- Dashboard View and Single List View both show a working Settings link in the top-right
- Settings lists all current Persons with emoji and name
- moving a Person up or down changes dashboard column order after save
- adding a new Person with name and emoji persists and shows an empty column on the board
- removing a Person requires confirmation and removes that Person from the board after save
- saving returns to the dashboard for the same viewed date
- invalid drafts such as blank names, duplicate names, or zero Persons are rejected without corrupting persisted data

## Risks And Open Questions

- The `persons` table has unique constraints on both `display_order` and `name`, so the durable write sequencing must temporarily move existing rows out of the way before applying final values.
- Settings is not realtime-critical, but the current browser tab should still refresh its board snapshot immediately after save to avoid stale navigation back to the dashboard.
- The screen is intentionally utilitarian, but it still must not drift into generic admin-widget styling that conflicts with the project visual language.

## Exit Criteria

This slice is done when:

- `docs/plans/13/plan.md` is checked in and matches the implemented FEAT-013 seam
- the Settings screen supports reorder, add, remove-with-confirmation, and save for Persons
- D1 persists the new person list and remains the durable source of truth
- saving updates the current board snapshot and returns to the dashboard with the new column order
- local typecheck, lint, unit, e2e, and structural checks pass
- the updated UI has been visually verified in local Chrome via Playwright
- the branch is ready to update or open for review against `main`
