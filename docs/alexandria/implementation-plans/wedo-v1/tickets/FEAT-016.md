---
id: FEAT-016
title: "Deploy to Cloudflare"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-015]
blocks: []
cards: [Standard - Tech Stack]
---

## Motivation

The product needs to be accessible on the family's iPad. Deploying to Cloudflare puts WeDo on a real URL that the iPad can load as a full-screen PWA.

## Description

Deploy the complete WeDo v1 to Cloudflare:
- Configure production D1 database with migration
- Run seed script for the Martin family (or provide a first-run setup flow)
- Deploy Worker + static assets via `wrangler deploy`
- Set Anthropic API key as a Worker secret
- Configure the Durable Object namespace
- Set up a custom domain or use the workers.dev subdomain
- Add the app to the iPad home screen as a full-screen web app (PWA manifest)
- Verify real-time sync works across multiple devices (iPad + phone)

## Context

See [[Standard - Tech Stack]] for all infrastructure choices. See ADR 001 for the Cloudflare rationale. CLAUDE.md has deployment context. See release.md for full plan context.

Anti-patterns:
- Do NOT commit the Anthropic API key — use `wrangler secret put`
- Do NOT deploy without running the e2e test suite first
- Do NOT skip the iPad full-screen test — this is the primary display surface

## Acceptance Criteria

- [ ] `wrangler deploy` succeeds
- [ ] App loads on the workers.dev URL (or custom domain)
- [ ] D1 database is migrated and seeded
- [ ] Anthropic API key is set as a Worker secret
- [ ] Real-time sync works across two devices
- [ ] App loads as full-screen PWA on iPad
- [ ] Dashboard is readable from across the room on iPad

## Implementation Notes

Use `wrangler deploy` for the initial deployment. Consider a GitHub Actions workflow for CI/CD later. The PWA manifest (`manifest.json`) needs `display: standalone` and appropriate icons. Test on actual iPad — the ambient display experience is the whole point.
