# Household Timezone Setting Plan

## Goal

Let the household choose the board timezone from Settings so the app's
canonical "today" rolls over at the household's local midnight instead of too
early for the family.

## Scope

- Add a durable family settings record in D1 for household timezone.
- Expose the selected timezone in board bootstrap data.
- Let Settings edit and save the timezone alongside the existing person
  settings workflow.
- Keep e2e deterministic parser behavior separate from local live parsing.
- Verify the setting in Browser and with service, route, UI, and structural
  checks.

## Non-Goals

- No multi-household account management.
- No auth or per-user timezone preferences.
- No automatic geolocation or browser-timezone detection.
- No broad Settings redesign beyond adding the timezone control.

## Current Context And Gaps

- `getBoardResponse` already calculates `todayDate` from a configured timezone,
  but the timezone is only an environment/runtime setting.
- `timezoneSchema` only permits `America/New_York`, so the type system cannot
  yet represent a user-selected household timezone.
- There is no families table in v1; family-scoped settings need their own small
  D1 source-of-truth table keyed by `family_id`.
- The Settings screen currently saves people only, so a household-level setting
  needs a route/service path that does not move persistence policy into UI.

## Affected Layers And Boundaries

- `types`: owns allowed timezone values and settings request/response contracts.
- `db`: owns the `family_settings` table, migration, and upsert/read helpers.
- `services`: owns merging runtime defaults with persisted family settings and
  saving settings with validation.
- `workers`: owns the HTTP route for saving family settings.
- `ui`: owns the visible Settings select and passing selected timezone to the
  settings save action.

The UI must not calculate the canonical day itself. D1 remains the source of
truth for the saved household timezone, and the Worker remains responsible for
deriving `todayDate`.

## Slice Strategy

This PR lands one reviewable slice: add a family timezone setting and wire it
through the existing Settings save flow. It is reviewable on its own because the
feature has a single durable field, a clear bootstrap contract, and direct
acceptance behavior.

Deferred:

- Editing household display name.
- Arbitrary IANA timezone search.
- Timezone auto-detection or onboarding prompts.

## Implementation Steps

1. Widen the timezone schema to a small supported set of household timezones.
2. Add a `family_settings` table and migration keyed by `family_id`.
3. Add repository helpers to read defaults and upsert family settings.
4. Update board bootstrap to return persisted timezone or runtime default.
5. Add settings request/response contracts and Worker route handling.
6. Extend the UI hook and Settings form to save timezone with the person draft.
7. Keep local secrets in `.dev.vars.local` and local dev in live parser mode,
   while e2e keeps the stub parser.
8. Run checks and verify Settings plus day rollover behavior in Browser.

## Tests And Acceptance Scenarios

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`
- Browser verification at `http://127.0.0.1:5173/settings`

Acceptance:

- Settings shows a home timezone control initialized from the board bootstrap.
- Saving Settings persists the selected timezone to D1.
- Board bootstrap uses the persisted timezone to compute `todayDate`.
- Local dev loads Anthropic credentials from ignored `.dev.vars.local`.
- E2E still uses deterministic stub task parsing.

## Risks And Open Questions

- Existing local D1 databases need the new migration applied before the Settings
  save route can write timezone.
- Restricting timezone choices keeps validation simple, but a future household
  outside the supported list will need the schema widened.
- Saving person settings and timezone should fail clearly if either request is
  invalid.

## Exit Criteria

- The app can save a timezone from Settings.
- The overview day no longer advances before the configured household timezone
  reaches midnight.
- Automated checks pass or any remaining blocker is named with the failing
  command.
