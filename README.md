# WeDo

WeDo is a shared family daily task board for one household and an ambient iPad display.

## Stack

- Cloudflare Workers + Hono
- React + Vite + Tailwind CSS
- Zod for runtime validation
- Vitest + Playwright

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run test:struct
```

## Structure

The source tree follows the enforced layer order:

```text
types -> config -> db -> services -> workers/realtime -> ui
```

Structural tests under `tests/structural/` enforce the boundary so later feature work does not drift across layers.
