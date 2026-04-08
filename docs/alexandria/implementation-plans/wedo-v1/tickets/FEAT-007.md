---
id: FEAT-007
title: "Recurrence Engine with timezone anchor and Sunday handling"
outcome: O-3
tier: must
enabler: false
blocked-by: [FEAT-002, FEAT-003]
blocks: [FEAT-009, FEAT-010]
cards: [System - Recurrence Engine, Primitive - Schedule, Primitive - Day, Standard - Streak Calculation]
---

## Motivation

The recurrence engine determines which tasks appear on any given day. Without it, the dashboard shows all tasks every day regardless of schedule. This is the "different bit" — the thing that makes WeDo more than a static checklist.

## Description

Implement the recurrence engine as a service in `src/services/`:
- `isTaskScheduledForDate(scheduleRules: ScheduleRules, date: Date): boolean` — the 3-line evaluation function using DAY_CODES lookup
- `getTasksForDate(tasks: Task[], date: Date): Task[]` — filters a task list to those scheduled for the given date
- Timezone anchor: all date calculations use America/New_York (EST). Configure in `src/config/`.
- Sunday handling: if the date is Sunday, return an empty task list (no tasks materialize). The UI should show person columns with empty completion rings and a gentle visual state.
- Integrate with the DO's init handler: when a client requests a day's state, the DO uses the recurrence engine to filter tasks before responding.

## Context

See [[System - Recurrence Engine]] for the algorithm spec (including the 3-line evaluation function). See ADR 005 for the schedule_rules format. See [[Primitive - Day]] for day states (Active, Skip, Sunday, Future). See [[Standard - Streak Calculation]] for the Sunday exclusion rule. See release.md for full plan context.

Anti-patterns:
- Do NOT use a cron library or rrule library — the evaluation is 3 lines
- Do NOT use UTC for date calculations — anchor to EST
- Do NOT hide Sunday entirely — show the board with empty columns

## Acceptance Criteria

- [ ] `isTaskScheduledForDate` correctly evaluates RFC 5545 day codes
- [ ] Tasks with `{ "days": ["MO","TU","TH","FR"] }` appear only on those days
- [ ] Sunday returns empty task list for all persons
- [ ] Dashboard shows empty columns with completion rings on Sunday (no tasks)
- [ ] Timezone is anchored to America/New_York — "today" is correct in EST
- [ ] Unit tests cover all day-of-week combinations including Sunday edge case
- [ ] DO init response uses recurrence engine to filter tasks

## Implementation Notes

Place the service in `src/services/recurrence.ts`. The timezone anchor goes in `src/config/timezone.ts`. Use `Intl.DateTimeFormat` or `date-fns-tz` for timezone-aware date operations. The key integration point is the DO's init handler — it must call `getTasksForDate` before building the init response.
