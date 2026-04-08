---
id: FEAT-002
title: "Shared Zod types and WebSocket message protocol"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-001]
blocks: [FEAT-003, FEAT-004, FEAT-005, FEAT-006, FEAT-007, FEAT-008, FEAT-009, FEAT-010, FEAT-011, FEAT-012]
cards: [Primitive - Person, Primitive - Task, Primitive - Day, Primitive - Schedule, Primitive - Streak, System - Real-Time Sync, System - Data Store]
---

## Motivation

The shared type definitions are the contract between every layer. The Zod schemas validate data at runtime (API responses, DB reads, WebSocket messages). The WebSocket message protocol defines how clients and the Durable Object communicate. Everything else depends on these types being correct.

## Description

Define all shared types in `src/types/`:
- `Person` schema (id, family_id, name, display_order, emoji)
- `Task` schema (id, family_id, person_id, title, emoji, schedule_rules, created_at)
- `ScheduleRules` schema using RFC 5545 day codes per ADR 005: `{ days: ("MO"|"TU"|"WE"|"TH"|"FR"|"SA"|"SU")[] }`
- `TaskCompletion` schema (id, task_id, date, completed_at)
- `SkipDay` schema (id, family_id, date, reason, created_at)
- `Streak` schema (person_id, current_count, best_count, last_qualifying_date)
- `DayCode` enum: `["MO", "TU", "WE", "TH", "FR", "SA", "SU"]`
- WebSocket message types: `InitRequest`, `InitResponse`, `TaskToggled`, `TaskCreated`, `TaskDeleted`, `SkipDayToggled`, `StateUpdate`
- Config type for timezone anchor (EST)

## Context

See [[Primitive - Person]], [[Primitive - Task]], [[Primitive - Day]], [[Primitive - Schedule]], [[Primitive - Streak]] for entity definitions. See [[System - Real-Time Sync]] for the WebSocket protocol (init message, mutation broadcast). See ADR 005 for the schedule_rules format. See release.md for full plan context.

Anti-patterns:
- Do NOT use `any` — every type must be explicit
- Do NOT put business logic in the types layer — pure data shapes only
- Do NOT use full day names ("monday") — use RFC 5545 codes ("MO") per ADR 005

## Acceptance Criteria

- [ ] All entity schemas defined as Zod objects in `src/types/`
- [ ] `ScheduleRules` uses DayCode enum with min(1) max(7) constraint
- [ ] WebSocket message types cover: init request/response, task toggled, task created, task deleted, skip day toggled
- [ ] All types are importable from `src/types/index.ts`
- [ ] Unit tests validate Zod schemas accept valid data and reject invalid data
- [ ] Timezone config defaults to "America/New_York" (EST)

## Implementation Notes

Place in `src/types/`. Export everything from `src/types/index.ts`. Use Zod's `.infer<>` to derive TypeScript types from schemas. The WebSocket message protocol should use a discriminated union on `type` field for type-safe message handling.
