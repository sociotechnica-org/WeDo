# WeDo

Shared family daily task board. 6 users, one household, ambient iPad display.

## Stack

Cloudflare all-in: Workers (Hono) + D1 + Durable Objects + React + Tailwind.
See `docs/adrs/` for architecture decisions.

## Commands

```bash
npm run dev          # local dev server (wrangler + vite)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier --write
npm run test         # vitest (unit)
npm run test:e2e     # playwright (e2e)
npm run test:struct  # structural layer boundary tests
```

## Golden Rules

1. **TypeScript strict.** No `any`. No `@ts-ignore`. Zod for runtime validation.
2. **Layered dependencies.** `types → config → db → services → workers/realtime → ui`. Each layer imports only from layers to its left. `npm run test:struct` enforces this.
3. **Suppress passing test output.** Surface only failures. Never dump 4,000 lines of green.
4. **One Durable Object per family.** Never a global singleton DO.
5. **D1 is source of truth.** DO caches for broadcast, D1 persists. Never trust in-memory state to survive.
6. **No auth in v1.** Trusted household. Don't build login flows.
7. **Watercolor, not widgets.** The aesthetic is letterpress/handwritten/watercolor. Never use default UI toolkit components for visible elements. See `Standard - Visual Language` in the library.

## Product Context

The Alexandria library at `docs/alexandria/library/` is the product knowledge graph.
Ask Bridget for a context briefing before starting any feature work.

Key cards:
- `rationale/standards/Standard - Engineering Methodology.md` — full HARNESS methodology
- `rationale/standards/Standard - Project Structure.md` — directory layout and layer rules
- `rationale/standards/Standard - Tech Stack.md` — technology choices and rationale
- `rationale/standards/Standard - Visual Language.md` — aesthetic specification

## QA Loop

After making changes:
1. Run `npm run typecheck && npm run lint`
2. Run relevant tests (`npm run test` or `npm run test:e2e`)
3. Open local Chrome via Playwright, verify visually
4. Run code review before committing
