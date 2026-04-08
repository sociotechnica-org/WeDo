---
id: PROTO-001
title: "Watercolor aesthetic prototype"
outcome: O-1
tier: must
enabler: prototype
blocked-by: [FEAT-005]
blocks: [FEAT-014]
cards: [Standard - Visual Language, Experience Goal - Ambient Calm, Principle - Warmth Over Urgency]
---

## Motivation

The letterpress/watercolor aesthetic is central to WeDo's identity — "art in the living space, not a software product." This is custom rendering territory that can't be specified fully in a ticket. A prototype explores typography, watercolor effects, sketched checkboxes, and translucency to find the right visual treatment before committing to a full implementation pass.

## Description

Build a standalone prototype page (or Storybook-like sandbox) that explores:
- Handwritten/letterpress typography options (web fonts or custom)
- Watercolor-style completion ring (varying opacity fill, not flat solid)
- Sketched checkbox style (hand-drawn appearance, not OS default)
- Watercolor highlight on checked tasks (blue wash, not solid blue)
- Translucency and layering effects (no hard edges or borders)
- Color palette: warm, muted, no reds or harsh colors
- How the whole thing looks on an iPad-sized viewport from across the room

Test with actual dashboard data (6 columns, real task names). Evaluate: does it feel like household art or like styled software?

## Context

See [[Standard - Visual Language]] for the full aesthetic spec (typography, color, UI elements tables). See [[Experience Goal - Ambient Calm]] for the emotional target. See wireframes at `docs/alexandria/sources/dashboard-view.png` and `single-list-view.png` — the hand-drawn style IS the direction. See release.md for full plan context.

Anti-patterns:
- Do NOT use a CSS framework's component styles — custom only
- Do NOT optimize for pixel-perfection — aim for organic, hand-crafted feel
- Do NOT use red, orange, or any alarm colors

## Acceptance Criteria

- [ ] Prototype renders a dashboard-like layout with watercolor visual treatment
- [ ] At least 2-3 typography options explored
- [ ] Completion ring uses watercolor/opacity fill (not flat)
- [ ] Checkboxes appear hand-drawn/sketched
- [ ] Checked tasks have a watercolor highlight effect
- [ ] No hard edges, borders, or standard UI toolkit appearance
- [ ] Looks good on iPad-sized viewport in landscape
- [ ] Screenshots captured for review

## Implementation Notes

Can be a separate route (`/prototype/watercolor`) or a standalone HTML page. Explore CSS approaches: `mix-blend-mode`, SVG filters for watercolor texture, `@font-face` with handwritten fonts, CSS `opacity` and `filter` for translucency. Canvas rendering is an option for the completion ring if CSS alone can't achieve the watercolor effect. This is exploratory — try things, screenshot, iterate.
