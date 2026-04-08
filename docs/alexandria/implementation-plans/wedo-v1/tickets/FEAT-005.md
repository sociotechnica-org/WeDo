---
id: FEAT-005
title: "Dashboard View with real data via WebSocket"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-004]
blocks: [FEAT-006, FEAT-008, FEAT-010, FEAT-011, FEAT-013, PROTO-001]
cards: [Section - Dashboard View, Component - Person Column, Component - Completion Ring, Component - Task Row, Domain - Daily Board, Experience Goal - Ambient Calm]
---

## Motivation

This is the product. The Dashboard View is the ambient surface the family sees in their kitchen every day. Rendering it with real data from D1 via the Durable Object proves the entire vertical stack works.

## Description

Build the Dashboard View in React:
- Connect to the family DO via WebSocket on mount
- Send `init` message, receive day state
- Render 6 equal-width columns in landscape layout (one per person)
- Each column: streak count (above name), completion ring, person name, task list
- Task rows: checkbox + emoji + task text
- Completion ring fills proportionally (completed tasks / total tasks)
- At 100%, ring shows subtle warm color shift
- Large whitespace below task lists (intentional, not placeholder)
- "WeDo" branding top-left, "Settings" link top-right
- Listen for WebSocket broadcasts and update state in real time
- Use placeholder/basic styling initially — watercolor aesthetic comes in PROTO-001/FEAT-014

## Context

See [[Section - Dashboard View]] for the full layout spec. See [[Component - Person Column]], [[Component - Completion Ring]], [[Component - Task Row]] for component specs. See [[Experience Goal - Ambient Calm]] for the emotional target ("household art, not a device"). See wireframes at `docs/alexandria/sources/dashboard-view.png`. See release.md for full plan context.

Anti-patterns:
- Do NOT use a UI component library — build custom components
- Do NOT sort or reorder completed tasks — maintain stable task order
- Do NOT add navigation chrome beyond WeDo branding and Settings link
- Do NOT show red/alarm colors — warmth over urgency

## Acceptance Criteria

- [ ] Dashboard renders 6 columns with person names from D1
- [ ] Tasks display with checkbox + emoji + task text in each column
- [ ] Completion ring shows proportional fill based on completed/total
- [ ] 100% completion shows warm visual treatment (subtle color shift)
- [ ] Streak count displays above each person's name
- [ ] WebSocket connection established on mount
- [ ] Real-time updates: toggling a task on another client updates this view within 1 second
- [ ] Layout works in landscape on iPad-sized viewport

## Implementation Notes

Place in `src/ui/views/Dashboard.tsx`. Use React hooks for WebSocket connection (`useWebSocket` or similar). Consider a `useFamilyBoard` hook that manages the WebSocket lifecycle, sends init, and provides reactive state. Tailwind for layout grid, but avoid Tailwind for visual art elements (those come later). The completion ring can be an SVG circle with stroke-dasharray for proportional fill.
