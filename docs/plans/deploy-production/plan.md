# Production Cloudflare Deployment Plan

## Goal

Deploy WeDo to production at `https://wedo.sociotechnica.org` using the repo's Cloudflare-only architecture, with a real remote D1 database, the family-scoped Durable Object binding, static Worker assets, and a production `ANTHROPIC_API_KEY` secret.

## Scope

- Configure the production Worker route/custom domain for `wedo.sociotechnica.org`.
- Provision or select the production D1 database named `we-do`.
- Replace the top-level production D1 placeholder IDs in `wrangler.jsonc`.
- Upload the Anthropic API key as a Cloudflare Worker secret.
- Apply remote D1 migrations and seed the canonical household bootstrap data.
- Deploy through Wrangler and verify the production URL, persistence, realtime behavior, and natural-language task creation.

## Non-Goals

- No auth or login flow; v1 remains a trusted-household app.
- No schema redesign or data reset beyond applying checked-in migrations and safe bootstrap seed data.
- No UI redesign beyond whatever is already in the current app.
- No off-Cloudflare infrastructure.

## Current Context

- ADR 001 and the Tech Stack standard require Cloudflare Workers, D1, Durable Objects, and Worker static assets as the sole infrastructure platform.
- ADR 003 makes D1 the source of truth; the Durable Object can coordinate realtime updates but must not be the durable store.
- ADR 004 requires the Anthropic API key to stay server-side in the Worker environment.
- `wrangler.jsonc` points production at the remote `we-do` D1 database and the `wedo.sociotechnica.org` Workers custom domain.
- The `sociotechnica.org` Cloudflare zone is active on the Jess Personal account.
- Namecheap has been updated to the assigned Cloudflare nameservers: `harlee.ns.cloudflare.com` and `razvan.ns.cloudflare.com`.
- The production Worker custom domain is attached at `wedo.sociotechnica.org`.

## Affected Layers And Boundaries

- Deployment config only: `wrangler.jsonc` and Cloudflare-side resources.
- Database migrations remain in `src/db/migrations`; no application-layer code should change unless deployment verification exposes an actual production bug.
- Runtime secret handling stays in Cloudflare; the Anthropic key must not be committed.
- The existing layer order remains unchanged: `types -> config -> db -> services -> workers/realtime -> ui`.

## Slice Strategy

This is one reviewable deployment slice: make the checked-in production config point at real Cloudflare resources, then deploy and verify. It is reviewable on its own because it does not mix feature behavior, schema authoring, or visual work with infrastructure activation.

## Implementation Steps

1. Confirm Wrangler authentication and permissions for Workers, routes, D1, zones, and secrets.
2. Create or identify the remote D1 database named `we-do`.
3. Add the `wedo.sociotechnica.org` production route/custom domain to `wrangler.jsonc`.
4. Replace the top-level D1 `database_id` and `preview_database_id` placeholders with the real production database ID, leaving the `e2e` placeholders unchanged.
5. Run `npm run deploy:check`.
6. Upload `ANTHROPIC_API_KEY` via `wrangler secret put ANTHROPIC_API_KEY`.
7. Run remote migrations and remote seed.
8. Deploy with `npm run deploy:prod`.
9. Verify the deployed app at `https://wedo.sociotechnica.org`.

## Tests And Acceptance Scenarios

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`
- `npm run deploy:check`
- `npm run db:migrate:remote`
- `npm run db:seed:remote`
- `npm run deploy:prod`
- Browser verification against `https://wedo.sociotechnica.org`:
  - dashboard loads
  - six household people are present
  - data persists after reload
  - realtime update propagates across two browser contexts
  - natural-language task creation succeeds through the live Anthropic-backed Worker route

## Risks And Open Questions

- DNS delegation and Cloudflare certificate issuance for the new custom domain may take time after deploy.
- The production Anthropic key must be supplied out-of-band during the deploy flow; it must not be written to disk or committed.
- Real iPad home-screen validation cannot be fully completed from this workspace.

## Exit Criteria

- `wrangler.jsonc` points production at the real D1 database and `wedo.sociotechnica.org`.
- Remote D1 migrations and seed complete successfully.
- The Worker deploy completes successfully.
- `https://wedo.sociotechnica.org` serves the app and passes the production smoke checks above.
