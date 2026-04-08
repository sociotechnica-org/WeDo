# Force - No Rollover Freshness

## WHAT: Definition

No Rollover Freshness is the emergent behavioral effect of WeDo's no-rollover design: because incomplete tasks never carry forward, each day begins with a clean slate. This produces a distinctive psychological relief — the board does not accumulate guilt — which makes the product sustainably usable in a way that to-do apps often are not. The force is the felt absence of accumulation.

## WHERE: Ecosystem

- Produced by systems:
  - [[System - Recurrence Engine]] — the system that generates each day's tasks fresh, without reading yesterday's incomplete items
- Reinforced by:
  - [[Product Thesis - The Day as Primary Frame]] — the Day-as-frame thesis is the architectural decision that enables this force; tasks exist inside days, not across them
  - [[Primitive - Day]] — the contributing mechanism; the Day primitive's independence from prior days is the structural reason freshness is possible
- Shapes experience:
  - [[Experience Goal - Ambient Calm]] — the fresh board each morning contributes to the calm ambient feeling; no accumulated burden
  - [[Loop - Daily Completion Rhythm]] — the experience vehicle; each loop iteration starts fresh, so the freshness force is felt once per daily cycle; prior failures don't compound

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — no-rollover is a direct consequence of the Day-as-frame thesis; if the Day is the container, then yesterday's container is closed
- The force is emergent rather than designed: the designer did not set out to produce "freshness" — they set out to model time correctly for a household. Freshness is what emerges.

## WHEN: Timeline

V1 design decision — no rollover is explicitly specified (founder answer: "No to-dos roll over. Everything starts fresh each day."). This is a v1 decision but aligns with the core product thesis; it is likely permanent.

Noted as scoping decision: not modeled as permanent technical constraint; if a future household use case genuinely requires some form of carry-forward, the decision can be revisited. But the default and v1 behavior is no rollover.

## HOW: Behavior Description

### How the Force Manifests

- Every morning: six empty rings, fresh task lists; no red "overdue" pile from yesterday
- A bad day (few tasks completed) is fully contained to that day; tomorrow is unmarked
- The board never shows "7 overdue tasks" — it shows "3 tasks today"
- Family members who miss a day can simply resume the next day without any visual judgment

### Contrast: What Without This Force Looks Like

In to-do apps without this design: tasks stack up, accumulate visual debt, and create a "pile" that is demoralizing. Users develop guilt associations with the app and eventually stop opening it. The no-rollover force is what prevents WeDo from following this pattern.

### Examples

- Cora doesn't complete her tasks Wednesday (illness). Thursday morning: Cora's board shows today's 3 tasks fresh; no trace of Wednesday's incompleteness
- Micah has a busy Monday and only finishes 2 of 5 tasks. Tuesday morning: 5 fresh tasks, no "3 still to do from yesterday" message

### Anti-Examples

- Wrong: Adding a "carried forward" section for incomplete tasks — this would negate the force and reintroduce accumulation guilt
- Wrong: Showing yesterday's incomplete count anywhere in the UI — the whole point is that yesterday is closed
