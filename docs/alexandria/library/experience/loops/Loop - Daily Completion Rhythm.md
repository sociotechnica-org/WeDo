# Loop - Daily Completion Rhythm

## WHAT: Definition

Daily Completion Rhythm is the core engagement loop of WeDo — the repeating daily cycle where family members glance at the board, complete their tasks throughout the day, reach 100%, and experience the quiet satisfaction of a completed household day. The loop resets fresh every morning. It is the loop WeDo is built around.

## WHERE: Ecosystem

- Plays out in sections:
  - [[Section - Dashboard View]] — the ambient glance surface where family members check household progress
  - [[Section - Single List View]] — where individuals complete their tasks
- Driven by capabilities:
  - [[Capability - Toggle Task Completion]] — the action that advances the loop each step
  - [[Capability - Navigate Days]] — used to access the loop for the current day
- Supported by systems:
  - [[System - Recurrence Engine]] — materializes a fresh task set each morning to start the loop
  - [[System - Streak Engine]] — converts loop completion into streak momentum across days
- Triggers:
  - [[Loop - Streak Motivation]] — successful daily loops accumulate into streaks
- Governed by experience goals:
  - [[Experience Goal - Ambient Calm]] — the daily loop should feel ambient and unforced, not demanding
  - [[Experience Goal - Mutual Accountability]] — the shared visibility of the loop creates gentle family accountability
- Governed by:
  - [[Principle - Cooperative Not Competitive]] — the loop is a household completion event, not a race between persons

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — the loop is structured around the Day container; it begins each morning and ends each night
- Product Thesis: [[Product Thesis - Cooperative Household]] — the loop culminates in household completion, not individual winning; the goal is "we did it" not "I won"

## WHEN: Timeline

V1 core loop. This is the daily heartbeat of the product.

## HOW: Implementation

### Loop Steps

1. **Morning:** Recurrence Engine materializes today's tasks for each Person. Dashboard View shows empty/partial rings.
2. **Throughout the day:** Family members glance at the board. Individuals complete tasks and toggle them in Single List View. Rings advance.
3. **Accumulation:** As the day progresses, more rings fill. The shared visibility lets the family see household progress without checking in verbally.
4. **Completion:** Person reaches 100% → bean signal fires → ring is full → quiet satisfaction moment.
5. **Day end:** Loop resets. Tomorrow's tasks generate fresh. No carryover.

### Examples

- Morning: Jess glances at the board while making coffee — all six rings are empty; she goes to her Single List View and checks off two morning tasks
- Afternoon: Cora and Wells come home from school; they each open their Single List View and complete remaining tasks; their rings fill; Moriah's ring is already full
- Evening: All six rings are full; the family's day is done; bean distribution happens physically; the board sits quietly complete

### Anti-Examples

- Wrong: The loop demands attention (push notifications, alarms) — the loop should be ambient; people engage on their own initiative per [[Experience Goal - Ambient Calm]]
- Wrong: The loop creates competition (who finished first, who got the most done) — the loop is cooperative; the goal is household completion per [[Principle - Cooperative Not Competitive]]
- Wrong: Yesterday's incomplete tasks appear in today's loop — the loop is fresh each day; no rollover per [[Product Thesis - The Day as Primary Frame]]
