---
id: FEAT-012
title: "Task deletion via swipe or hover"
outcome: O-2
tier: must
enabler: false
blocked-by: [FEAT-006]
blocks: []
cards: [Primitive - Task, Section - Single List View]
---

## Motivation

Wrong tasks will be created during initial setup and ongoing use. Without deletion, mistakes are permanent. This is the minimum viable task management — create via NL, delete via gesture.

## Description

Add task deletion to the Single List View:
- Mobile/touch: swipe left on a task row reveals a trash icon. Tap trash to delete.
- Desktop/mouse: hover over a task row reveals a trash icon on the right. Click to delete.
- Deletion removes the task from D1 (and all its task_completions) via the DO
- Broadcast `task_deleted` to all clients
- No confirmation dialog — deletion is immediate (task can be re-created via NL entry)
- Only available in Single List View, not on the Dashboard

## Context

See [[Primitive - Task]] for task attributes. See [[Section - Single List View]] for the view context. Deletion is a v1 necessity that has no library card — it emerged from the planning gap analysis. See release.md for full plan context.

Anti-patterns:
- Do NOT add an edit/modify flow — deletion only for v1 (re-create via NL to "edit")
- Do NOT add confirmation dialogs — immediate, reversible by re-creation
- Do NOT show delete affordance on the Dashboard — only in Single List View

## Acceptance Criteria

- [ ] Swipe left on task row reveals trash icon (touch devices)
- [ ] Hover over task row reveals trash icon (mouse/desktop)
- [ ] Tapping/clicking trash deletes the task
- [ ] Task and its completions removed from D1
- [ ] Deletion broadcast to all connected clients
- [ ] Deleted task disappears from dashboard and single list view immediately
- [ ] Delete is only available in Single List View

## Implementation Notes

The swipe gesture can use a CSS transform with touch event handling, or a lightweight library like `react-swipeable`. For hover, a simple CSS `opacity: 0 → 1` on hover. The DO needs a `task_deleted` handler that deletes from both `tasks` and `task_completions` tables, then broadcasts.
