# CD Workflow Proof Plan

## Goal

Prove that WeDo has a real Cloudflare continuous deployment path: a pull request creates a preview Worker deployment, the preview is smoke-tested at its Cloudflare URL, merging the pull request deploys production, and the visible change appears at `https://wedo.sociotechnica.org`.

## Scope

- Add GitHub Actions automation for pull request validation, Cloudflare Worker preview deploys, and production deploys from `main`.
- Configure the repository with the Cloudflare credentials needed by the workflow.
- Make one small observable UI copy change that is safe to ship and easy to verify in preview and production.
- Open a PR, observe the preview deployment, test it, merge the PR, observe the production deployment, and test the live app.

## Non-Goals

- No auth, login, or multi-household work.
- No database schema changes.
- No Durable Object or D1 behavior changes beyond running existing safe migrations and bootstrap seed commands in the deploy workflow.
- No redesign of the watercolor/letterpress UI.

## Current Context

- ADR 001 requires Cloudflare as the sole infrastructure platform.
- ADR 003 makes D1 the source of truth; deployment automation must not reset production data.
- ADR 004 requires the Anthropic API key to remain server-side as a Worker secret.
- The repo currently has no `.github/workflows` automation, so merging to `main` does not deploy by itself.
- Worker version preview aliases are not usable for this app in the current account state because uploaded versions report `has_preview: false`; the PR preview should therefore use an explicit `preview` Wrangler environment with a separate Worker and D1 database.

## Affected Layers And Boundaries

- CI/CD config lives under `.github/workflows/` and uses existing package scripts.
- Deployment docs live under `docs/deployment/`.
- The observable smoke marker is a small UI copy change in the UI layer only.
- No UI code imports from workers, realtime, or db layers; structural tests remain the boundary proof.

## Slice Strategy

This is one PR because the workflow and the observable smoke marker must be tested together to prove the CD path. The workflow is reviewable on its own: it runs existing gates, uploads a preview for PRs, and deploys production only from `main`.

## Implementation Steps

1. Add a GitHub Actions workflow for validation, PR preview deploy, and production deploy.
2. Add a short deployment docs section describing the CD path and required secrets.
3. Add a small visible UI copy change for preview/production verification.
4. Set required GitHub secrets for Cloudflare deployment without committing secret values.
5. Open a PR and wait for the preview workflow to complete.
6. Smoke-test the preview Cloudflare URL.
7. Merge the PR and wait for the production workflow to complete.
8. Smoke-test `https://wedo.sociotechnica.org` and verify the copy change is live.

## Tests And Acceptance Scenarios

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:struct`
- `npm run deploy:check`
- GitHub PR workflow completes successfully.
- PR preview URL loads the app and shows the smoke-marker copy.
- Production workflow completes after merge.
- Production URL loads the app, shows the smoke-marker copy, and still supports a basic task-toggle smoke check.

## Risks And Open Questions

- GitHub Actions needs a Cloudflare token with Workers, D1, routes, and secrets-compatible deploy access.
- The preview Worker uses `https://we-do-preview.jessmartin.workers.dev`.
- Production deploys run safe migrations and bootstrap seeding; they must not destructively reseed D1.

## Exit Criteria

- A PR creates a Cloudflare preview deployment and that preview is browser-tested.
- Merging the PR triggers a production Cloudflare deployment.
- The merged visible change is verified live on `https://wedo.sociotechnica.org`.
- Repo documentation explains the CD workflow and required secrets.
