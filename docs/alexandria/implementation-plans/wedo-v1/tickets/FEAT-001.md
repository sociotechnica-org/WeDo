---
id: FEAT-001
title: "Project scaffolding and HARNESS infrastructure"
outcome: O-1
tier: must
enabler: false
blocked-by: []
blocks: [FEAT-002, FEAT-003, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, FEAT-009, FEAT-010, FEAT-011, FEAT-012, FEAT-013, PROTO-001, FEAT-014, FEAT-015, FEAT-016]
cards: [Standard - Engineering Methodology, Standard - Project Structure, Standard - Tech Stack]
---

## Motivation

Every subsequent ticket depends on the project existing. This ticket creates the Cloudflare Worker project with Vite + React + Tailwind, establishes the layered directory structure, and sets up the HARNESS quality gates (TypeScript strict, ESLint, Prettier, pre-commit hooks, structural tests).

## Description

Initialize a Cloudflare Workers project with the full HARNESS scaffolding:
- Cloudflare Worker entry point with Hono router
- React frontend via Cloudflare Vite plugin
- Tailwind CSS configured
- TypeScript strict mode (`strict: true`, no `any`, no `@ts-ignore`)
- Directory structure per Standard - Project Structure: `src/{types,config,db,services,workers,realtime,ui}` + `tests/{unit,e2e,structural}`
- Pre-commit hooks via Husky + lint-staged (tsc --noEmit, ESLint, Prettier)
- Structural test that validates the layered dependency rule
- `wrangler.toml` with D1 database binding and Durable Object binding configured
- Vitest for unit tests, Playwright installed for e2e

## Context

See [[Standard - Engineering Methodology]] for the full HARNESS framework. See [[Standard - Project Structure]] for the directory layout and layer dependency rules. See [[Standard - Tech Stack]] for all technology choices. The CLAUDE.md at the repo root has the golden rules. See release.md for the full plan context.

Anti-patterns:
- Do NOT use a UI component library (Material, Chakra, etc.) — the visual layer is custom
- Do NOT use Next.js or other SSR frameworks — this is Cloudflare Workers + Vite
- Do NOT skip the structural test — it's the mechanical enforcement of layer boundaries

## Acceptance Criteria

- [ ] `npm run dev` starts a local dev server (wrangler + Vite) that renders a blank React page
- [ ] `npm run typecheck` passes with zero errors (TypeScript strict)
- [ ] `npm run lint` passes with zero errors (ESLint)
- [ ] `npm run format` passes (Prettier)
- [ ] `npm run test:struct` passes — structural test validates layer dependency rule
- [ ] Pre-commit hook runs typecheck + lint + format on staged files
- [ ] Directory structure matches Standard - Project Structure
- [ ] `wrangler.toml` has D1 and Durable Object bindings configured

## Implementation Notes

Start with `npm create cloudflare@latest` or `wrangler init`. Add Vite plugin per Cloudflare docs. The structural test can use a simple import-graph checker (e.g., dependency-cruiser or a custom script that checks import paths against allowed layers). Keep it simple — this test is the foundation of the HARNESS.
