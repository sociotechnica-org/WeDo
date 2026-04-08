# Issue 16 Plan: Cloudflare Deployment Readiness

## Goal

Make WeDo deployable to a real Cloudflare environment with a reviewable, repo-backed deployment seam: production-ready Wrangler configuration structure, repeatable remote database bootstrap commands, PWA metadata required for iPad home-screen install, and an operator runbook that documents the remaining account-specific steps and validation flow.

## Scope

This plan covers:
- checked-in deployment configuration changes in `wrangler.jsonc` and supporting runtime/config files needed to distinguish local/e2e vs production deployment concerns
- repeatable scripts or utilities to apply D1 migrations remotely and seed the Martin household into a remote D1 database non-destructively without introducing a browser-side bootstrap path
- checked-in PWA assets/metadata needed for standalone home-screen install on iPad
- deployment documentation that explains secret setup, D1 database creation/binding, deploy commands, post-deploy validation, and known manual checks
- automated tests for the new deployment/PWA/bootstrap seams where they are practical in-repo

## Non-Goals

This slice does not cover:
- inventing authentication or any multi-tenant deployment model
- replacing D1 seed bootstrap with a first-run product UI
- adding CI/CD automation or GitHub Actions deployment pipelines unless the implementation reveals a tiny necessary config seam
- changing the real-time architecture, persistence semantics, or visible product flows beyond the minimal PWA/install metadata needed for deployment
- account-specific production values that cannot be safely checked into the repo, such as real D1 database IDs, Cloudflare account identifiers, secret values, custom-domain bindings, or device-specific install confirmations

## Current Context And Gaps

- `wrangler.jsonc` still contains placeholder `database_id` and `preview_database_id` values, so the repo is not safely production-deployable as checked in.
- Local migration and seed support already exists (`npm run db:migrate:local`, `npm run db:seed:local`), but there is no equivalent checked-in remote bootstrap workflow for FEAT-016.
- The ticket explicitly requires an Anthropic Worker secret, Durable Object namespace config, a workers.dev or custom-domain deploy target, and iPad home-screen install support.
- The current app shell has no checked-in `manifest.webmanifest`, icons, or iOS home-screen metadata in `index.html`.
- The repository asks for a Bridget briefing, but there is no Bridget tool in this workspace and `docs/alexandria/implementation-plans/wedo-v1/CONTEXT_BRIEFING.md` is not present. For this slice, the Alexandria library, ADRs, ticket doc, and current code are the available context briefing source.
- A true production deploy may still be blocked by missing operator credentials or Cloudflare account resources. The implementation must make those blockers explicit rather than pretending they are solved in code.

## Affected Layers And Boundaries

- `config/`: runtime/deployment configuration parsing only; no business logic
- `db/`: owns remote seed/bootstrap helpers and any reusable seed SQL generation; D1 remains the only durable source of truth
- repo root config/docs (`wrangler.jsonc`, `package.json`, `README.md`, `docs/plans/16/plan.md`, deployment docs): owns operator workflow and environment binding documentation
- static app shell (`index.html`, checked-in public assets if added): owns PWA metadata only; no UI-layer persistence logic moves here
- `tests/`: may cover manifest/bootstrap/config seams, but must not require hidden production credentials

What does not belong in this slice:
- direct D1 or Wrangler logic in `ui/`
- account-specific secrets or IDs committed to source
- Durable Object behavior changes unrelated to deployment readiness

## Slice Strategy

This PR lands one reviewable seam: "make the repo production-deployable once account-specific values are supplied, and document the exact operator steps." That seam is reviewable on its own because it hardens configuration, bootstrap, and install metadata without mixing in new product behavior or a broader infrastructure automation stack.

Deferred follow-up seam if needed:
- actual Cloudflare account provisioning and final deploy execution once credentials/resources are available
- optional CI/CD automation after the manual deployment path is stable
- actual on-device iPad validation notes captured after physical-device testing

## Implementation Steps

1. Inspect the existing Wrangler/dev setup and decide how production config should be represented without committing real database IDs or secrets.
2. Add a checked-in remote database bootstrap path that can:
   - apply D1 migrations to the bound remote database
   - seed the Martin family dataset remotely in a repeatable, non-destructive way
   - avoid browser-initiated bootstrap or any violation of the D1 source-of-truth rule
3. Harden deployment ergonomics in `package.json`/docs so operators have explicit commands for local vs remote migrate/seed/deploy flows.
4. Add PWA install metadata and required static assets so the deployed site can be added to the iPad home screen in standalone mode.
5. Add tests for any new config/manifest/bootstrap helpers that can be verified locally.
6. Update README and/or dedicated deployment docs with:
   - required Cloudflare resources and secret setup
   - exact command sequence for create DB -> set IDs -> migrate -> seed -> deploy
   - post-deploy checks for workers.dev load, realtime sync sanity, and iPad home-screen install
   - explicit manual checks that still require Cloudflare access or a physical iPad
7. If credentials are available in this workspace, attempt the real deploy flow; otherwise leave the repo in a ready state and document the concrete missing external prerequisites.

## Tests And Acceptance Scenarios

Planned checks:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run test:struct`

Acceptance scenarios to cover:
- a developer can identify every required Cloudflare binding/secret from checked-in docs and config
- a developer can run a documented remote migration and seed path without inventing ad hoc SQL
- the built app exposes a manifest/home-screen metadata path suitable for standalone iPad install
- local regression checks still pass after deployment-readiness changes
- if Cloudflare credentials are available, `wrangler deploy` can be attempted with the documented flow; if not, the remaining blocker is explicit and external

## Risks And Open Questions

- The repo cannot safely store real Cloudflare database IDs or secret values; documentation and validation need to make this obvious so `wrangler deploy` does not silently target placeholder config.
- PWA icon requirements for iPad are partly aesthetic and partly platform-specific. The minimal checked-in asset set should satisfy installability without introducing a large visual-design detour.
- Production deploy verification, secret creation, workers.dev/custom-domain routing, and multi-device realtime checks may depend on credentials and hardware not present in this workspace.
- If the current Wrangler config shape makes “placeholder-safe by default, deployable when configured” awkward, the implementation should favor explicit failure with clear docs over implicit misconfiguration.

## Exit Criteria

This slice is done when:
- the repo contains a checked-in plan at `docs/plans/16/plan.md`
- the repo has a documented, repeatable remote migration + seed workflow for Cloudflare D1
- the app has checked-in PWA metadata for standalone home-screen install
- deployment docs explain secrets, bindings, deploy order, and manual validation clearly
- all relevant local quality gates pass
- any remaining inability to perform the final real Cloudflare deploy is explicitly attributable to external credentials/resources, not missing repository support
