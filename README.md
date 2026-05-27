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
npm run dev                  # applies local migrations + safe bootstrap seed, then starts Vite
npm run setup:local          # applies local migrations + non-destructive bootstrap seed
npm run db:seed:local        # destructive local reset to canonical seed data
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy:check
npm run deploy:prod
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run test:struct
```

## Local Setup

The repo pins Node with asdf in `.tool-versions`. From a fresh checkout:

```bash
asdf install
npm install
npm run dev
```

`npm run dev` runs `setup:local` first, so local D1 receives the existing
migrations and the canonical household seed rows if they are missing. It does
not wipe local task completions or settings. Use `npm run db:seed:local` only
when you intentionally want to reset local D1 back to the checked-in seed data.

Local dev runs the Worker with `CLOUDFLARE_ENV=local`, which uses live
Anthropic task parsing. Store the local key in `.dev.vars.local` as
`ANTHROPIC_API_KEY=...`; this file is ignored by git. Production also uses the
live parser and requires the `ANTHROPIC_API_KEY` Worker secret.

## Structure

The source tree follows the enforced layer order:

```text
types -> config -> db -> services -> workers/realtime -> ui
```

Structural tests under `tests/structural/` enforce the boundary so later feature work does not drift across layers.

## Deployment

Cloudflare deployment instructions live in
`docs/deployment/cloudflare.md`. The checked-in flow is:

```bash
npm run deploy:check
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy:prod
```
