---
id: FEAT-011
title: "Skip Day toggle with visual dimming"
outcome: O-5
tier: should
enabler: false
blocked-by: [FEAT-008, FEAT-010]
blocks: []
cards: [Capability - Skip Day, Primitive - Streak, Standard - Streak Calculation]
---

## Motivation

Skip days are the pressure valve. When the family goes out of town, nobody's streak should break. The skip day toggle on the date bar lets a parent say "this day doesn't count" with one tap.

## Description

Implement the Skip Day capability:
- "SKIP TODAY" toggle next to the date in the Day Navigation bar
- When toggled on: draws a line through the date text, all task rows dim/reduce opacity, tasks are still visible but clearly marked as "doesn't count"
- Write a skip_day record to D1 via the DO
- Broadcast skip_day_toggled to all clients
- Streak engine excludes skipped days (already handled in FEAT-010)
- Can be toggled off (un-skip) — removes the skip_day record
- Can be applied to past days via day navigation (retroactive skip)

## Context

See [[Capability - Skip Day]] for the behavior spec. See [[Standard - Streak Calculation]] for how skip days interact with streaks. See [[Principle - Warmth Over Urgency]] — skip days should feel forgiving, not punitive. See release.md for full plan context.

Anti-patterns:
- Do NOT hide tasks on skip days — show them dimmed
- Do NOT require a reason for skipping (reason field is optional)
- Do NOT make skip day hard to find — it's next to the date, one tap

## Acceptance Criteria

- [ ] "SKIP TODAY" toggle visible next to the date in Day Navigation
- [ ] Toggling draws a line through the date text
- [ ] All task rows dim when day is skipped
- [ ] Skip day record written to D1 and broadcast to all clients
- [ ] Streak calculation excludes skipped days
- [ ] Can un-skip (toggle off) — removes skip_day record
- [ ] Can skip past days via day navigation
- [ ] Retroactive skip triggers streak recalculation

## Implementation Notes

Place the toggle in `src/ui/components/DayNavigation.tsx`. The dim effect can be a CSS opacity reduction on the task list container. Add `skip_day_toggled` message type to the WebSocket protocol. The DO handler inserts/deletes from the `skip_days` table and triggers streak recalculation.
