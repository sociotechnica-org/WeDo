# Issue 1 Plan: Project Scaffolding and HARNESS Infrastructure

## Goal

Establish the first runnable WeDo application scaffold on Cloudflare with React, Hono, and Tailwind, plus the HARNESS quality gates that future tickets depend on. The slice should leave the repository ready for feature tickets to add real data, realtime behavior, and domain logic without reworking the project foundation.

## Scope

This PR includes:

- initial package, build, and dev tooling for a Cloudflare Worker + Vite + React application
- the enforced source directory layout under `src/` matching `types -> config -> db -> services -> workers/realtime -> ui`
- baseline typed modules in each layer so the structure is real, not empty convention
- Tailwind and app shell wiring sufficient to render a minimal visible page in local dev
- HARNESS quality gates: strict TypeScript, ESLint, Prettier, Vitest, Playwright, and structural layer-boundary tests
- basic repository docs updates needed to explain how to run and validate the scaffold

## Non-Goals

This PR does not include:

- production task, person, streak, recurrence, or skip-day features
- D1 schema design beyond placeholder-safe scaffolding for future integration
- Durable Object mutation flows or websocket synchronization
- authentication, user accounts, or multi-household support
- complete visual polish for the eventual dashboard and single-list product surfaces

## Current Context And Gaps

- The repository currently contains only docs, ADRs, workflow metadata, and the planning skill. There is no existing application scaffold, package manifest, test harness, or source tree.
- The Alexandria standards and ADRs clearly define the stack and boundaries: Cloudflare Workers + Hono, D1 as source of truth, Durable Objects per family, React + Tailwind for UI, and a letterpress / watercolor visual language.
- There is no callable "Bridget" tool in this workspace, so the Alexandria cards serve as the context briefing source for this implementation.
- Product behavior for real task flows is intentionally deferred; this ticket should create the foundation those later tickets can build on safely.

## Affected Layers And Boundaries

- `src/types/`: shared runtime schemas and TypeScript types only
- `src/config/`: environment access and app configuration only
- `src/db/`: D1 binding types and placeholder data access entry points, but no business logic
- `src/services/`: simple service-level board shell data shaping only
- `src/workers/`: Worker entry point and Hono routing only
- `src/realtime/`: placeholder family-scoped Durable Object scaffold only
- `src/ui/`: React app shell, routes, styling, and minimal visual presentation

Boundary rules preserved in this slice:

- `ui` will not import `db`, `workers`, or `realtime`
- `workers` will call `services` rather than embedding business logic
- `realtime` will exist as a scaffold only and will not become a source of truth
- D1-related code stays in `db`, even if implementation is placeholder-level for now

## Slice Strategy

This PR lands one reviewable seam: "make the repo a runnable, constrained application skeleton." That is a coherent first slice because every later issue depends on the toolchain, file layout, and quality gates existing first.

Deliberately deferred:

- real schema and migrations
- real task APIs
- realtime mutation wiring
- full feature UI

Those follow-on tickets can now work within the scaffold instead of mixing foundational setup with product behavior.

## Implementation Steps

1. Create the root project manifests and configs: `package.json`, TypeScript configs, Vite config, Wrangler config, Tailwind/PostCSS config, ESLint config, Prettier config, and Vitest/Playwright config.
2. Create the layered `src/` tree with minimal compile-safe modules in every layer and explicit imports that follow the allowed dependency direction.
3. Add a Worker entry point that serves a Hono API surface and the React app through the Vite/Cloudflare integration expected by the chosen scaffold.
4. Build a small visible UI shell that reflects the WeDo aesthetic constraints well enough for visual QA without overcommitting to final product layout.
5. Add structural tests that scan project imports and fail on right-to-left layer violations.
6. Add baseline unit and e2e tests that prove the scaffold boots, renders, and exposes the intended basic route behavior.
7. Update README as needed so local development and validation steps are accurate.

## Tests And Acceptance Scenarios

Required checks for this slice:

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Acceptance scenarios:

- a fresh install can start the local dev environment with `npm run dev`
- the project typechecks under strict TypeScript with no `any` or suppression comments
- lint and formatting configuration run successfully on the new scaffold
- structural tests fail if a layer imports from a forbidden layer
- the home UI renders in local Chrome through Playwright and shows a warm, non-default visual shell rather than raw toolkit output
- the Worker-side API baseline responds successfully and the app shell can load without feature data being implemented yet

## Risks And Open Questions

- The repo has no existing generated scaffold, so the main risk is integration mismatch between current Cloudflare/Vite package expectations and the chosen file layout. The fix is to keep the scaffold minimal and verify with real commands, not assumed templates.
- The exact shape of future D1 schema, DO class behavior, and routing surface is not fully specified in this ticket. The scaffold should therefore expose only low-commitment placeholders where product semantics are still pending.
- Because the issue summary references broad "HARNESS infrastructure," there is a scope risk toward overbuilding. This plan keeps the slice at foundation-only and defers feature behavior explicitly.

## Exit Criteria

This slice is done when:

- the repo contains a runnable Cloudflare + React scaffold with the required layered directory structure
- the scaffold includes a visible, on-brand initial UI shell
- strict typing, linting, unit tests, e2e tests, and structural tests are checked in and passing locally
- repository docs accurately describe how to run and validate the scaffold
- the resulting branch is ready to open or update for review against `main`
