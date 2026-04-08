# Primitive - Day

## WHAT: Definition

Day is the primary organizational container in WeDo — everything lives inside a Day. A Day represents a single calendar day (midnight to midnight) and contains the task instances for all Persons on that day. The Day is not a to-do list timeframe; it is the frame itself. There is no view of WeDo that is not anchored to a specific Day.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Task Vocabulary]] — "Day" is the canonical term for the time container
  - [[Standard - Streak Calculation]] — streak rules are evaluated per Day
- Used by:
  - [[Section - Dashboard View]] — displays the board for one Day at a time
  - [[Section - Day Navigation]] — navigates between Days
  - [[System - Recurrence Engine]] — evaluates Schedule rules for a given Day
  - [[System - Streak Engine]] — calculates streak incrementing per Day
- Related primitives:
  - [[Primitive - Task]] — Tasks exist within a Day
  - [[Primitive - Person]] — each Person has completion state per Day
  - [[Primitive - Streak]] — streak tracks consecutive qualifying Days

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — the Day primitive is the direct implementation of this thesis; it is not a technical convenience but a design commitment
- Principle: [[Principle - Warmth Over Urgency]] — the Sunday-is-Sabbath choice (Sunday never counts for or against streaks) is a direct expression of this principle; rest is built into the Day model, not treated as an absence of compliance
- Principle: [[Principle - Constraint is the Product]] — day navigation limits (today ± 1 only; no unlimited future access) are enforced at the Day primitive level; the navigation constraint is a first-class product decision, not a missing feature

## WHEN: Timeline

V1 foundational primitive. The Day-as-primary-frame concept is permanent — it is the product identity, not a v1 limitation.

Special case: Sunday is a designated non-counting day. Sabbath is observed; tasks may exist on Sunday (rare) but Sunday never counts toward or against streaks.

## HOW: Implementation

### Attributes

| Attribute | Type | Notes |
|-----------|------|-------|
| date | Date | Calendar date (YYYY-MM-DD) |
| is_sunday | Boolean | Derived from date; affects streak calculation |
| skip_day | Boolean (per Person) | Whether this day is declared a Skip Day for a Person |
| task_instances | Task[] (per Person) | Tasks materialized for this day by Recurrence Engine |

### Day States

| State | Description |
|-------|-------------|
| Today | The current calendar day; default app state |
| Past | Any day before today; supports catch-up toggle |
| Tomorrow | One day forward; accessible for viewing/toggling |
| Future (>1 day) | Not accessible; navigation stops at tomorrow |

### Examples

- Monday, March 23: all Persons' Schedules evaluated → task lists materialized; Cora has 3 tasks, Micah has 5
- Sunday: even if Schedules technically cover Sunday, streak calculation treats Sunday as neutral; tasks may be shown (if scheduled) but not counted
- A declared Skip Day for Cora on Friday: Friday's Day record has skip_day=true for Cora; Cora's streak holds

### Anti-Examples

- Wrong: Allowing navigation to a Day more than one day in the future — constraint is tomorrow maximum
- Wrong: Treating the Day as a task container that persists tasks between days — each Day generates its own task instances fresh
- Wrong: Allowing the absence of a Day record to cause missing task data — Days must be materialized reliably
