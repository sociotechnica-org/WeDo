---
id: FEAT-013
title: "Settings screen for person management"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-005]
blocks: []
cards: [Primitive - Person, Domain - Daily Board]
---

## Motivation

The family needs to add, remove, and reorder persons on the board. Without Settings, the only way to change the person list is direct database editing. Minimal but necessary.

## Description

Build a minimal Settings screen:
- Accessible via "Settings" link in top-right corner (visible on both views)
- List all persons with their name and emoji
- Reorder persons (drag or up/down arrows) — controls column order on dashboard
- Add a person (name + emoji)
- Remove a person (with all their tasks and completions)
- Save changes to D1 via a REST endpoint (not WebSocket — Settings is not real-time critical)
- Navigate back to Dashboard

## Context

See [[Primitive - Person]] for person attributes. See [[Domain - Daily Board]] for the navigation structure. Settings was referenced in wireframes but never fully specified. Keep it minimal per [[Product Thesis - Radical Simplicity]]. See release.md for full plan context.

Anti-patterns:
- Do NOT add authentication/permissions — anyone can edit settings
- Do NOT add person profiles, avatars, or preferences — name + emoji only
- Do NOT overdesign — this is a utility screen, not a showcase

## Acceptance Criteria

- [ ] Settings accessible from top-right link on both views
- [ ] All persons listed with name and emoji
- [ ] Can reorder persons (changes dashboard column order)
- [ ] Can add a new person (name + emoji)
- [ ] Can remove a person (with confirmation for this one — removes all their data)
- [ ] Changes persist to D1
- [ ] Navigate back to Dashboard after saving

## Implementation Notes

Place in `src/ui/views/Settings.tsx`. Use a simple Hono REST route for CRUD operations on persons (`src/workers/routes/persons.ts`). Reorder can be simple up/down buttons rather than drag-and-drop for v1. Removing a person should cascade-delete their tasks and completions.
