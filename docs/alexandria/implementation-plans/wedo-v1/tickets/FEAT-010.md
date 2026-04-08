---
id: FEAT-010
title: "Streak Engine with dashboard display"
outcome: O-5
tier: should
enabler: false
blocked-by: [FEAT-007]
blocks: [FEAT-011, FEAT-015]
cards: [System - Streak Engine, Standard - Streak Calculation, Primitive - Streak, Loop - Streak Motivation]
---

## Motivation

Streaks are the engagement amplifier. Seeing "7" above your name on the family dashboard means you've hit 100% seven days running. The streak engine calculates this from task_completions, skip_days, and the Sunday exclusion rule.

## Description

Implement the streak calculation service and display:
- `calculateStreak(personId: string, date: Date): { current_count: number, best_count: number }` — walks backward from the given date counting consecutive qualifying days
- A qualifying day: 100% completion (all scheduled tasks completed). Sunday is excluded (never counts). Skip days are excluded (don't break the streak).
- Write streak results to the `streaks` table in D1 (denormalized for fast reads)
- Recalculate when: a task is toggled (could change 100% status), a skip day is toggled, on day boundary
- Display streak count above each person's name on the Dashboard (already positioned in FEAT-005)
- Bean notification: when a person hits 100% for the day, the system signals it (for now, just the visual treatment on the completion ring — beans are external)

## Context

See [[System - Streak Engine]] for the 4-step algorithm. See [[Standard - Streak Calculation]] for threshold, day classification, and retroactive recalculation rules. See [[Loop - Streak Motivation]] for the experience this enables. See release.md for full plan context.

Anti-patterns:
- Do NOT calculate streaks on every page load — denormalize in the streaks table
- Do NOT include Sunday in streak calculation — ever
- Do NOT display streak comparisons between family members — cooperative not competitive

## Acceptance Criteria

- [ ] Streak count calculates correctly for consecutive 100% days
- [ ] Sunday is excluded from streak calculation
- [ ] Skip days are excluded (don't break or extend streak)
- [ ] Streak count displays above each person's name on dashboard
- [ ] Toggling a task recalculates the affected person's streak
- [ ] Retroactive edits (past-day toggle) trigger recalculation from that date forward
- [ ] Streak data is persisted in the `streaks` table
- [ ] Unit tests cover: normal streak, streak broken by missed day, skip day preservation, Sunday exclusion, retroactive recalc

## Implementation Notes

Place in `src/services/streak.ts`. The recalculation trigger should be called from the DO after any task_toggled or skip_day_toggled write. For retroactive recalc, walk forward from the edited date re-evaluating each day. Cache the result in the `streaks` table. The dashboard already has a spot for streak count (FEAT-005) — this ticket makes it show real data instead of seed zeros.
