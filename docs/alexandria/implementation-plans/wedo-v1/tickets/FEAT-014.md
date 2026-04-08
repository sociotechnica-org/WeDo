---
id: FEAT-014
title: "Watercolor aesthetic implementation"
outcome: O-1
tier: must
enabler: false
blocked-by: [PROTO-001]
blocks: [FEAT-015]
cards: [Standard - Visual Language, Experience Goal - Ambient Calm, Principle - Warmth Over Urgency]
---

## Motivation

After the prototype establishes the visual direction, this ticket applies it across the entire app. Every visible element should feel like letterpress stationery, not software.

## Description

Apply the winning watercolor aesthetic from PROTO-001 across all views:
- Dashboard View: watercolor completion rings, sketched checkboxes, handwritten typography, translucent task rows
- Single List View: same treatment, larger scale
- Day Navigation: date text and arrows styled to match
- Settings: lighter treatment (utility screen, not showcase, but still consistent)
- Checked task state: watercolor blue highlight
- 100% completion: warm subtle glow or watercolor fill
- Skip day: dimmed with appropriate visual treatment
- Ensure readability from 8 feet away (iPad across the room)

## Context

See [[Standard - Visual Language]] for the spec. PROTO-001 results inform the specific implementation choices. See [[Experience Goal - Ambient Calm]] — "glanceable from 8 feet" is a testable criterion. See release.md for full plan context.

Anti-patterns:
- Do NOT use default browser form elements for visible UI
- Do NOT apply the aesthetic inconsistently — all visible elements must match
- Do NOT sacrifice readability for style — 8-foot legibility test

## Acceptance Criteria

- [ ] All visible elements use the watercolor/letterpress aesthetic
- [ ] Typography is handwritten/letterpress style throughout
- [ ] Completion rings use watercolor fill effect
- [ ] Checkboxes are sketched/hand-drawn style
- [ ] Checked tasks show watercolor highlight
- [ ] No standard OS controls visible in the main UI
- [ ] Readable from 8 feet on iPad-sized display
- [ ] Visual consistency across Dashboard, Single List, Day Navigation
- [ ] Skip day dimming looks intentional, not broken

## Implementation Notes

This is a CSS/Canvas pass across all existing components. Work from PROTO-001's winning approach. Touch every component: TaskRow, CompletionRing, PersonColumn, DayNavigation. Test on actual iPad if possible. The "8 feet away" test means: render the dashboard, step back, can you see who's done and who isn't?
