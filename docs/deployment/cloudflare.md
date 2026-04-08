# Cloudflare Deployment

WeDo deploys as a single Cloudflare Worker with static assets, one D1 database,
and one family-scoped Durable Object namespace.

## Prerequisites

- Cloudflare account access for the target project
- Wrangler authenticated locally:
  - `npm exec wrangler -- login`
- Anthropic production API key available for secret upload

## One-Time Setup

1. Create the shared remote D1 database:
   - `npm exec wrangler -- d1 create we-do`
2. Copy the returned `database_id` into both D1 binding blocks in
   `wrangler.jsonc`:
   - top-level `d1_databases[0].database_id`
   - top-level `d1_databases[0].preview_database_id`
   - `env.e2e.d1_databases[0].database_id`
   - `env.e2e.d1_databases[0].preview_database_id`
3. Upload the Anthropic API key:
   - `npm exec wrangler -- secret put ANTHROPIC_API_KEY`

## Deploy Flow

1. Validate the checked-in deploy configuration:
   - `npm run deploy:check`
2. Apply the remote schema:
   - `npm run db:migrate:remote`
3. Seed the Martin household into remote D1:
   - `npm run db:seed:remote`
4. Deploy the Worker and static assets:
   - `npm run deploy:prod`

If you need to inspect the preview database separately, use:

- `npm run db:seed:preview`

## Post-Deploy Checks

1. Open the generated `workers.dev` URL and confirm the dashboard loads.
2. Verify the Martin household is present:
   - 6 person columns
   - seeded recurring tasks such as `Kitchen reset` and `Vacuum`
3. Confirm realtime sync across two devices:
   - open the board on two browsers or devices
   - toggle a task on one device
   - confirm the second device updates within one second
4. Confirm natural-language task creation works in production:
   - create a task from the single-list view
   - verify the task persists after reload

## iPad Install Checks

1. Open the deployed URL in Safari on the household iPad.
2. Use `Share -> Add to Home Screen`.
3. Launch the installed app and confirm:
   - it opens without Safari browser chrome
   - the dashboard fills the screen in landscape orientation
   - the board remains readable from across the room
   - sleep/wake returns to a live board without requiring a manual refresh

## Known Manual Steps

- Custom domain setup is optional and must be configured in Cloudflare, not in
  the repo.
- Real device validation for the iPad home-screen flow cannot be completed from
  this workspace.
- The deploy scripts intentionally fail while `wrangler.jsonc` still contains
  placeholder D1 IDs, so production deploys do not silently target invalid
  bindings.
