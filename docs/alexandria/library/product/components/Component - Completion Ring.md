# Component - Completion Ring

## WHAT: Definition

Completion Ring is the circular progress indicator shown at the top of each Person's column in Dashboard View and centered prominently in Single List View. It fills proportionally as tasks are completed and uses a watercolor wash fill style — not a flat progress bar or standard OS gauge. The ring is the household's primary at-a-glance signal for each person's daily progress.

## WHERE: Ecosystem

- Parent sections:
  - [[Section - Dashboard View]] — one ring per Person column; compact size
  - [[Section - Single List View]] — one ring for the focused Person; larger, more prominent
- Conforms to:
  - [[Standard - Visual Language]] — ring fill must be watercolor wash, proportional; no flat fills, no red indicators
  - [[Standard - Streak Calculation]] — ring reaching 100% is the trigger for the bean signal
- Renders state from:
  - [[Primitive - Task]] — completion_state of each Task in the Day feeds the ring percentage
  - [[Primitive - Person]] — the ring displays one Person's aggregate completion
- Triggers:
  - [[System - Streak Engine]] — when ring reaches 100%, bean signal is emitted

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — the ring makes each Person's progress visible to the whole family at a glance without ranking; six rings side by side in Dashboard View communicate household state cooperatively
- Principle: [[Principle - Warmth Over Urgency]] — the ring uses warm watercolor fill; it does not turn red or alarm-color when low; incomplete is neutral, complete is warm

## WHEN: Timeline

V1 core component. 100% celebration treatment is resolved: V1 uses a simple visual treatment at 100% (e.g., filled ring with a subtle color shift). Celebration treatment is intentionally minimal for v1 — will be prototyped and iterated. Must feel warm per [[Principle - Warmth Over Urgency]], not gamified.

## HOW: Implementation

### Behavior

- Ring fills from 0% to 100% proportionally as Tasks are toggled complete
- Each task completion → ring advances by 1/N (where N = total scheduled tasks for that Person on that Day)
- At 0%: ring is empty (unfilled circle outline in sketched style)
- At 100%: ring is fully filled; bean signal fired; simple visual treatment (filled ring with subtle color shift) — warm, not gamified; will be iterated post-v1
- Fill color: watercolor blue wash at varying opacity — not flat solid color
- Ring style: letterpress/sketched border, not standard OS gauge

### Size variants

| Context | Size |
|---------|------|
| Dashboard View (per column) | Compact — proportional to column width |
| Single List View (focused person) | Large — prominent, centered above task list |

### Examples

- Micah has 5 tasks, 2 done → ring is 40% filled; warm blue watercolor wash covers 40% of the circle
- Cora has 3 tasks, all done → ring is 100% filled; bean signal fires; all watercolor blue
- Dashboard shows 6 rings: two fully filled (blue), two at ~50%, one at ~20%, one empty; family state visible at a glance without anyone having to read numbers

### Anti-Examples

- Wrong: Using standard UIProgressView or SwiftUI ProgressView with default styling — must be custom sketched ring per [[Standard - Visual Language]]
- Wrong: Turning the ring red or orange when completion is low — ring is always neutral/warm regardless of fill level
- Wrong: Showing a number percentage inside the ring (e.g., "60%") — the ring is a visual fill, not a numeric readout
- Wrong: Showing comparative rings (e.g., "Moriah is at 80%, you're at 60%") — rings are independent personal progress indicators
