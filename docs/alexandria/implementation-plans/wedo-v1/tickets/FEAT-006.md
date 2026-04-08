---
id: FEAT-006
title: "Single List View with tap-to-toggle"
outcome: O-2
tier: must
enabler: false
blocked-by: [FEAT-005]
blocks: [FEAT-009, FEAT-012]
cards: [Section - Single List View, Capability - Toggle Task Completion, Loop - Daily Completion Rhythm]
---

## Motivation

Single List View is where task completion happens. Tapping a person's column on the dashboard expands to their full task list. Tapping a task toggles it. This is the primary daily interaction for every family member.

## Description

Build the Single List View:
- Tap a Person Column on dashboard → navigate to Single List View for that person
- Full-screen expansion: larger completion ring, larger task rows, more spacing
- Tap anywhere on a task row to toggle done/not-done
- Toggle sends `task_toggled` via WebSocket → DO writes to D1 → broadcasts to all clients
- Back button (top-left, below "WeDo") returns to Dashboard
- "Add task" button at bottom (text field implementation comes in FEAT-009)
- Optimistic UI: update local state immediately, confirm via DO broadcast

## Context

See [[Section - Single List View]] for the layout spec. See [[Capability - Toggle Task Completion]] for toggle behavior. See wireframe at `docs/alexandria/sources/single-list-view.png`. The toggle is the core interaction of [[Loop - Daily Completion Rhythm]]. See release.md for full plan context.

Anti-patterns:
- Do NOT add complex gestures — tap to toggle is the entire interaction
- Do NOT show a confirmation dialog on toggle — instant, reversible
- Do NOT navigate away from Single List View on toggle — stay in the view

## Acceptance Criteria

- [ ] Tapping a column on Dashboard navigates to that person's Single List View
- [ ] Task rows are larger and more spaced than dashboard
- [ ] Tapping a task row toggles its completion state
- [ ] Toggle is reflected on all connected clients within 1 second
- [ ] Completion ring updates immediately on toggle
- [ ] Back button returns to Dashboard View
- [ ] "Add task" button is visible at bottom (non-functional until FEAT-009)
- [ ] Optimistic UI: toggle feels instant locally

## Implementation Notes

Place in `src/ui/views/SingleList.tsx`. Use React Router for dashboard ↔ single list navigation. The toggle sends a `task_toggled` WebSocket message; the `useFamilyBoard` hook handles optimistic state + broadcast reconciliation. Checked tasks should show a filled checkbox with blue/watercolor accent (per Standard - Visual Language).
