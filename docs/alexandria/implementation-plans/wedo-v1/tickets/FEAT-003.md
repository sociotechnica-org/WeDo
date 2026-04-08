---
id: FEAT-003
title: "D1 schema, migrations, and seed data"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-002]
blocks: [FEAT-004, FEAT-007, FEAT-009, FEAT-010]
cards: [System - Data Store, Primitive - Person, Primitive - Task]
---

## Motivation

The database is the source of truth. Before the Durable Object can broadcast state or the UI can render tasks, D1 needs tables and seed data. Seed data lets the roller-skate phase work before NL task entry exists.

## Description

Create the D1 schema using Drizzle ORM and seed it with the Martin family:
- `persons` table: Jess, Elizabeth, Micah, Moriah, Wells, Cora (with display_order and emoji)
- `tasks` table: seed with representative recurring tasks (vacuum M-Sa, piano M/Tu/Th/Fr, schoolwork M/Tu/Th/Fr, etc.) using RFC 5545 schedule_rules format
- `task_completions` table: empty initially
- `skip_days` table: empty initially
- `streaks` table: all zeros initially
- Migration script that creates all tables
- Seed script that populates persons and tasks

## Context

See [[System - Data Store]] for the full schema specification. See ADR 003 for the D1 rationale. See ADR 005 for the schedule_rules JSON format. The `schedule_rules` column stores `{ "days": ["MO","TU","TH","FR"] }` per ADR 005. See release.md for full plan context.

Anti-patterns:
- Do NOT use raw SQL strings — use Drizzle ORM for type-safe queries
- Do NOT store schedule_rules as a string — it's a JSON column parsed by Zod on read
- Do NOT seed with fake/lorem data — use real Martin family names and real task examples from the wireframes

## Acceptance Criteria

- [ ] All 5 tables created via Drizzle migration
- [ ] Seed script creates 6 persons with correct display_order
- [ ] Seed script creates 8-12 representative tasks with valid schedule_rules
- [ ] `schedule_rules` column stores JSON matching the ScheduleRules Zod schema
- [ ] Drizzle schema types align with Zod schemas from FEAT-002
- [ ] `wrangler d1 migrations apply` runs cleanly

## Implementation Notes

Place schema in `src/db/schema.ts`, migrations in `src/db/migrations/`, seed script in `src/db/seed.ts`. Use Drizzle's `sqliteTable` for D1 compatibility. The seed data should include tasks for multiple persons with different schedules to exercise the recurrence engine later.
