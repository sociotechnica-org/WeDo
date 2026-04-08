# Standard - Project Structure

## WHAT: Definition

Project Structure specifies the enforced directory layout for the WeDo codebase and the dependency rule that governs which layers may import from which. The layout maps directly to the [[Standard - Tech Stack]] components and the [[Standard - Engineering Methodology]] layered model. Violations of the import rule are caught by structural tests in CI and cannot be merged.

## WHERE: Ecosystem

- Implements:
  - [[Principle - Constraint is the Product]] — the enforced directory layout and import rule are intentional constraints that make correct choices obvious and incorrect choices detectable; the layer boundary is as much a product decision as a UI boundary
- Extends:
  - [[Standard - Engineering Methodology]] — the layered dependency model described in Engineering Methodology is made concrete by this directory structure; structural tests verify it
  - [[Standard - Tech Stack]] — each directory in `src/` corresponds to a layer of the tech stack
- Conforming systems must place code in the correct layer:
  - [[System - Data Store]] — schema, migrations, and queries live in `src/db/`
  - [[System - NL Task Parser]] — parser service logic lives in `src/services/`; Worker route lives in `src/workers/`
  - [[System - Real-Time Sync]] — Durable Object classes live in `src/realtime/`
  - [[System - Recurrence Engine]] — recurrence resolution logic lives in `src/services/`
  - [[System - Streak Engine]] — streak calculation logic lives in `src/services/`

## WHY: Rationale

- Principle: [[Principle - Constraint is the Product]] — the enforced directory layout and import rule are intentional constraints; the boundary between layers is as much a product decision as a UI boundary; removing them would make the codebase easier to write short-term and harder to maintain over time
- Standard: [[Standard - Engineering Methodology]] — the directory structure is the physical expression of the harness; it makes architectural constraints visible and testable
- Driver: In an AI-assisted development workflow, a model generating code across sessions will naturally drift toward convenient import paths unless structure prevents it. Enforced directories make the correct choice obvious and the incorrect choice detectable.
- Driver: The `types → config → db → services → workers/realtime → ui` dependency chain is not just a convention — it reflects real semantic constraints: UI should never know how data is stored; Workers should not contain business logic; types are universal. The structure enforces these semantics.

## WHEN: Timeline

Established v1. Stable for the life of the project. New directories may be added for new concerns (e.g., `src/agents/` if Agents SDK is added in a future version), but the dependency rule extends to any new layer and must be documented.

## HOW: Specification

### Directory Layout

```
src/
  types/        ← shared type definitions (Zod schemas + TypeScript types)
  config/       ← environment variables, feature flags
  db/           ← D1 schema, Drizzle migrations, typed query functions
  services/     ← business logic (streak calculation, recurrence resolution, NL parsing)
  workers/      ← Cloudflare Worker entry points, Hono route definitions
  realtime/     ← Durable Object classes (Real-Time Sync)
  ui/           ← React components, views, hooks, Tailwind styles

tests/
  unit/         ← Vitest, per-service; mirrors src/services/ structure
  e2e/          ← Playwright full browser suite
  structural/   ← Layer boundary enforcement tests
```

### Dependency Rule

```
types → config → db → services → workers/realtime → ui
```

Each layer may import only from layers to its left. The rule is:

| Layer | May import from | May NOT import from |
|-------|----------------|---------------------|
| `types/` | (nothing) | Everything to the right |
| `config/` | `types/` | `db/` and right |
| `db/` | `types/`, `config/` | `services/` and right |
| `services/` | `types/`, `config/`, `db/` | `workers/`, `realtime/`, `ui/` |
| `workers/` | `types/` through `services/` | `realtime/`, `ui/` |
| `realtime/` | `types/` through `services/` | `workers/`, `ui/` |
| `ui/` | `types/`, `config/`, `services/` (via API calls only) | `db/`, `workers/`, `realtime/` |

### Structural Tests

Tests in `tests/structural/` parse import graphs and fail CI if any import violates the dependency rule. These tests run as part of every CI check. They are not optional and are not suppressed.

### Layer Responsibilities

| Layer | Owns |
|-------|------|
| `types/` | Zod schemas, TypeScript interfaces, shared enums — the contract layer |
| `config/` | `wrangler.toml` bindings, environment variable access, feature flag definitions |
| `db/` | Drizzle schema definition, migration files, typed query functions (no business logic) |
| `services/` | Streak calculation, recurrence resolution, NL parser invocation, task creation logic |
| `workers/` | Hono app, route handlers, request/response shaping, Worker entry points |
| `realtime/` | Durable Object class, WebSocket handling, broadcast logic |
| `ui/` | React components, page views, hooks, Tailwind layout, custom CSS/Canvas art layer |

### Examples

- Streak calculation logic lives in `src/services/streak.ts` — it imports from `src/db/` for data access and `src/types/` for shared types; it does not import from `src/ui/`
- Hono route handler in `src/workers/tasks.ts` calls `src/services/nlParser.ts` for task creation; it does not import D1 query functions directly
- React component in `src/ui/` calls a Worker API endpoint via `fetch()`; it does not import from `src/db/` or `src/services/`

### Anti-Examples

- Wrong: A React component importing a Drizzle query function from `src/db/` — UI layer must go through the Worker API
- Wrong: A Durable Object class in `src/realtime/` importing from `src/workers/` — realtime and workers are siblings, not ordered
- Wrong: Business logic (e.g., recurrence resolution) written inline in a Hono route handler — services layer owns business logic; workers own routing only
- Wrong: Zod schema defined in `src/ui/` instead of `src/types/` — shared types belong in the types layer, accessible from all layers
