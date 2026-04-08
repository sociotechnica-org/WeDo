---
id: FEAT-008
title: "Day Navigation with arrow-based browsing"
outcome: O-6
tier: could
enabler: false
blocked-by: [FEAT-005]
blocks: [FEAT-011]
cards: [Section - Day Navigation, Capability - Navigate Days]
---

## Motivation

Day navigation lets the family review past days and do catch-up entry. The primary interaction is "today" but life happens — sometimes yesterday's tasks need to be entered the next morning.

## Description

Build the Day Navigation bar:
- Persistent bar at the top of both Dashboard and Single List views
- Left arrow: navigate back one day (unlimited history)
- Right arrow: navigate forward one day (max: tomorrow). Disabled/hidden when at tomorrow.
- Centered date display showing the currently viewed date
- Navigating to a different day sends a new `init` message to the DO with that date
- Past-day tasks are toggleable (same WebSocket flow — DO doesn't care about the date)
- Tomorrow's tasks are visible (based on recurrence) but read-only or toggleable (TBD)
- When navigating away from today and back, state refreshes from DO

## Context

See [[Section - Day Navigation]] for the full spec. See [[Capability - Navigate Days]] for behavior rules. No calendar picker — arrows only (per Principle - Constraint is the Product). See release.md for full plan context.

Anti-patterns:
- Do NOT add a calendar picker or date input — arrows only
- Do NOT allow navigation more than 1 day into the future
- Do NOT show a different UI for past days — same layout, tasks are toggleable

## Acceptance Criteria

- [ ] Left arrow navigates back one day
- [ ] Right arrow navigates forward one day, disabled at tomorrow
- [ ] Date display shows the currently viewed date
- [ ] Navigating to a past day shows that day's tasks and completions
- [ ] Past-day tasks can be toggled (catch-up entry)
- [ ] Navigating back to today shows current state
- [ ] Day navigation bar appears on both Dashboard and Single List views

## Implementation Notes

Place in `src/ui/components/DayNavigation.tsx`. Manage the current viewed date in app state (React context or URL param). When the date changes, send a new `init` message to the DO — the DO returns the state for the requested date. Consider using the URL to encode the date (`/day/2026-04-06`) so refreshing preserves the viewed day.
