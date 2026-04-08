# 003. Use D1 (SQLite) as the Source of Truth

Date: 2026-04-07

## Status

Accepted

## Context

WeDo needs persistent storage for persons, tasks, task completions, skip days, and streaks. The data model maps naturally to relational primitives. The app is a single-household tool with trivially small data volumes — family task records will never approach megabytes, let alone gigabytes.

Options on the Cloudflare platform: D1 (SQLite), Workers KV (key-value), Durable Object storage (ephemeral actor storage). Options off-platform: PlanetScale, Supabase, Neon. Going off-platform contradicts ADR 001.

Streaks are read on every board load and must be fast. Recurrence rules are authored by the Anthropic API (see ADR 004) and need a flexible column format that can evolve without frequent migrations.

## Decision

Cloudflare D1 with Drizzle ORM is the source of truth. Five core tables:

- **persons** — household members, display order, emoji
- **tasks** — task definition with `schedule_rules` as a JSON column
- **task_completions** — insert/delete rows; presence means completed
- **skip_days** — declared skip days with optional reason
- **streaks** — denormalized per-person streak counts for fast reads

`schedule_rules` is stored as a JSON column rather than a normalized recurrence table. This allows the recurrence model to evolve (driven by what the Anthropic API returns) without schema migrations.

Streak counts are denormalized: cached in the `streaks` table, recalculated from `task_completions` and `skip_days` on any retroactive edit.

## Consequences

**Easier:**
- SQLite semantics are familiar, well-documented, and well-supported by AI coding tools
- Stays within Cloudflare platform (ADR 001); D1 co-locates with Workers and Durable Objects, no cross-cloud latency
- JSON column for `schedule_rules` decouples the recurrence model's evolution from schema migrations
- Denormalized streaks make board-load reads fast; the `streaks` table serves a count without aggregation queries on every request
- 10GB D1 storage limit is not a constraint — household task data is measured in kilobytes

**Harder:**
- D1 is single-threaded (SQLite); concurrent writes are serialized — not a problem at household scale, but it is a ceiling
- Denormalized streaks add write complexity: any retroactive edit (past toggle, skip day change) must trigger a streak recalculation from the affected date forward
- JSON column for `schedule_rules` is flexible but loses relational query capability over recurrence fields; acceptable because recurrence is always evaluated in application code, not via SQL predicates
- `task_completions` is insert/delete, not update; this is intentional but requires discipline from all callers

See ADR 001 for the Cloudflare platform commitment. See ADR 002 for how the Durable Object writes mutations to D1 before broadcasting. See ADR 004 for how the NL parser produces the `schedule_rules` JSON.
