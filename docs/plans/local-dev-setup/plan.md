# Local Dev Setup Plan

## Goal

Make a fresh local checkout start reliably with `npm run dev`: the repo should select a supported Node version, install current dependencies from an up-to-date lockfile, apply local D1 migrations, seed the household bootstrap data when missing, and serve a working board instead of a 500 bootstrap error.

## Scope

- Pin the repository to a modern Node version through asdf.
- Refresh package dependencies and the npm lockfile.
- Add a non-destructive local D1 bootstrap seed path for first-run setup.
- Wire local setup into the dev workflow so first launch is ready by default.
- Run local dev through a named Worker environment that can load ignored local
  Anthropic secrets from `.dev.vars.local`.
- Update README setup commands to match the actual workflow.
- Fix narrow QA issues exposed while validating the upgraded stack when they
  block the setup verification path.
- Verify with typecheck, lint, focused tests, and Browser-based local app inspection.

## Non-Goals

- No schema changes beyond applying existing migrations locally.
- No production remote D1 behavior changes except preserving the existing non-destructive remote seed path.
- No UI redesign or product behavior changes.
- No authentication, account setup, or multi-household support.

## Current Context And Gaps

- The app currently renders `Dashboard bootstrap failed with 500` in a fresh local run because `/api/board` cannot bootstrap a family from local D1.
- README lists migration and seed commands, but `npm run dev` can start before local D1 is migrated and seeded.
- The host is using Node `20.13.1`, while current Vite, npm, ESLint-related packages, and Undici declare newer Node engine requirements.
- Existing local seed is intentionally destructive for reset workflows; that should remain available, but it is the wrong default for every dev server start.
- Local `npm run dev` needs a named environment so Wrangler consistently loads
  local-only secrets while e2e can keep using deterministic stub parsing.

## Affected Layers And Boundaries

- `package.json` and `package-lock.json`: own scripts and dependency versions.
- `.tool-versions`: owns repo-local Node selection for asdf.
- `src/db/seed-cloudflare.ts`: owns D1 seed command construction and SQL mode selection.
- `src/db/seed-local.ts`: keeps the destructive local reset entrypoint.
- `src/ui/components/task-row.tsx`: owns a narrow delete affordance hitbox fix
  found by e2e after the dependency/tooling upgrade.
- `wrangler.jsonc`: owns the named local Worker environment and parser mode.
- `tests/unit/db/`: covers seed SQL and seed CLI argument behavior.
- `tests/e2e/`: keeps the browser expectations aligned with current streak
  behavior and delete interaction.
- `README.md`: documents the supported local setup path.

This slice stays in tooling and `db` setup helpers except for the e2e-discovered
delete hitbox fix. Services, workers, and realtime behavior should not absorb
setup policy.

## Slice Strategy

This PR lands one reviewable setup slice: "make local dev bootstrap deterministic and non-destructive by default." It is reviewable on its own because it fixes the broken local startup without changing product functionality.

Deferred:

- Any broader database lifecycle tooling for remote environments.
- Any migration generator changes.
- Any redesign of seed data content.

## Implementation Steps

1. Pin the repo to Node `24.16.0` with `.tool-versions` and install it through asdf when needed.
2. Bump npm dependencies and refresh `package-lock.json`.
3. Add a seed mode that can run local D1 with bootstrap SQL instead of destructive reset SQL.
4. Add scripts for `setup:local`, `db:seed:local:bootstrap`, and a pre-dev bootstrap path.
5. Keep the existing destructive `db:seed:local` reset workflow intact.
6. Add a named `local` Worker environment and run local dev scripts against it
   so task creation can use live Anthropic parsing with `.dev.vars.local`.
7. Update README so a fresh developer runs `npm install` and `npm run dev`, with explicit reset commands documented separately.
8. Fix any narrow app/test issues exposed by the dependency bump and e2e run,
   without widening into unrelated UI redesign.
9. Run local setup, start the app normally, and verify the board in Browser.

## Tests And Acceptance Scenarios

- `npm run typecheck`
- `npm run lint`
- `npm run test -- tests/unit/db/seed.test.ts tests/unit/db/seed-cloudflare.test.ts`
- `npm run test:struct`
- `npm run test:e2e`
- Browser verification at `http://127.0.0.1:5173/`

Acceptance:

- `node -v` resolves to Node `24.16.0` inside the repo.
- `npm run dev` applies migrations and non-destructive bootstrap seed before Vite starts.
- A fresh local board load renders household data instead of `Board unavailable`.
- Local add-task works with live Anthropic parsing when `.dev.vars.local`
  contains `ANTHROPIC_API_KEY`.
- `db:seed:local` still provides the destructive local reset workflow.

## Risks And Open Questions

- Major dependency bumps may require small compatibility fixes; keep fixes scoped to build/test breakage.
- Running migrations before every dev start adds startup time, but it removes the first-run failure and uses non-destructive seed SQL.
- If Cloudflare plugin behavior changes after dependency updates, verify both HTTP and Browser behavior before finishing.

## Exit Criteria

- The checked-in setup commands are deterministic on this worktree.
- The app loads successfully in the in-app Browser.
- Relevant automated checks pass or any remaining blocker is clearly documented.
