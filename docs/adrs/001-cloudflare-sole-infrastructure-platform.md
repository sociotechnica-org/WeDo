# 001. Use Cloudflare as the Sole Infrastructure Platform

Date: 2026-04-07

## Status

Accepted

## Context

WeDo is a personal family application for a single household of six. It requires server-side compute, persistent storage, real-time sync, and static asset hosting. Multiple cloud options exist: AWS (Lambda + RDS + API Gateway), Vercel + Supabase, Fly.io + PlanetScale, or a single-platform provider.

The application is not a market product. It will never need to scale beyond one household. Operational simplicity and low cost are first-order constraints — not afterthoughts.

## Decision

Go all-in on Cloudflare as the sole infrastructure platform:

- **Compute**: Cloudflare Workers (Hono framework)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Real-time**: Cloudflare Durable Objects with Hibernatable WebSockets
- **Frontend hosting**: Cloudflare Workers static assets (via Vite plugin)

No AWS. No Vercel. No Supabase. No cross-platform integrations.

## Consequences

**Easier:**
- Single billing relationship, single deployment model, single CLI (`wrangler`)
- Workers, D1, and Durable Objects compose without glue code — they share one platform
- Cost is approximately $5–10/month for household-scale traffic; Workers free tier covers most request volume
- Edge-native execution means low latency for the always-on ambient iPad display
- One platform to monitor, one set of docs, one failure surface

**Harder:**
- Locked to the Cloudflare ecosystem; migrating off is non-trivial
- D1 is SQLite: single-threaded, 10GB max storage — both limitations are irrelevant at household scale but worth acknowledging
- Durable Objects have a ~500–1,000 req/sec ceiling per instance — irrelevant for six users
- Some Cloudflare primitives (D1, Durable Objects) are newer and carry some API-stability risk compared to AWS equivalents

See ADR 002 for the Durable Objects real-time decision and ADR 003 for the D1 storage decision.
