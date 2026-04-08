---
name: technical-planning
description: Create or refine implementation plans for WeDo changes so every implementation PR has a checked-in plan under docs/plans before substantial coding begins.
---

# Technical Planning

Use this skill before substantial implementation work for WeDo.

The goal is to create a concrete, reviewable plan that:

- explains the user or product goal clearly,
- preserves the repo's layer boundaries,
- keeps one PR to one narrow slice where possible,
- names tests and validation up front,
- and leaves a checked-in system-of-record artifact in `docs/plans/`.

## Sources Of Truth

Read only what is needed, but do not plan blind.

Required sources:

1. `CLAUDE.md`
2. `README.md`
3. relevant files under `docs/adrs/`
4. relevant cards under `docs/alexandria/library/`
5. the current implementation in the touched layers
6. the issue text and comments

## Plan Output

Write the plan to:

- `docs/plans/<issue-number-or-short-slug>/plan.md`

Use the GitHub issue number when one exists. If there is no issue number yet, use a short descriptive slug.

Examples:

- `docs/plans/42-task-recurring-rule-editing/plan.md`
- `docs/plans/day-navigation-polish/plan.md`

## Planning Standard

Every substantial implementation plan should cover:

1. goal
2. scope
3. non-goals
4. current context or gaps
5. affected layers and boundaries
6. slice strategy and why it fits one PR
7. implementation steps
8. tests and acceptance scenarios
9. risks or open questions
10. exit criteria

Do not stop at a loose task list. The plan should explain what changes, what does not, and how you will know the slice is done.

## WeDo-Specific Boundaries

Plans should preserve the checked-in repo rules:

- keep the dependency order `types -> config -> db -> services -> workers/realtime -> ui`
- treat D1 as the durable source of truth
- keep Durable Objects scoped per family, never as a global singleton
- avoid auth or login work in v1 unless the issue explicitly changes that product direction
- keep visible UI aligned with the watercolor / letterpress / handwritten visual language

When a plan touches one layer, say what does not belong there. Examples:

- UI should not absorb persistence policy that belongs in `db` or `services`
- Durable Object coordination should not become the only source of durable state
- product behavior should not quietly drift away from Alexandria cards or ADRs without naming that decision

## Slice Strategy

Default to one issue / one PR / one reviewable seam.

The plan should explicitly say:

1. what lands in the current PR
2. what is deliberately deferred
3. why the current seam is reviewable on its own

If the work would mix schema changes, service rules, realtime coordination, and a broad UI redesign in one patch, narrow the slice before coding.

## Stateful Features

If the change affects synchronization, recurrence, task completion semantics, day rollover, or other stateful behavior, include:

1. the important states
2. the allowed transitions
3. the source of truth for each state
4. failure or edge cases that must not corrupt family data

This does not need Symphony's full recovery matrix unless the feature truly needs it, but stateful work should still make its transitions explicit.

## Tests And Acceptance Scenarios

Do not just say "add tests."

Name the exact checks that prove the slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Use the narrowest real set that matches the touched files, but widen when the change crosses layers or affects visible flows.

For UI work, include a note to verify the result visually in local Chrome through Playwright.

## Implementation Workflow

Before substantial coding:

1. create or update the relevant `docs/plans/.../plan.md`
2. make sure it is specific to the current PR slice
3. keep implementation aligned with that plan
4. if scope changes materially, update the plan before continuing

Every implementation PR should have a corresponding checked-in plan. Small typo-only or trivial docs-only changes can skip this when they clearly do not represent implementation work.
