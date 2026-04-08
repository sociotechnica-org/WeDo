# Primitive - Schedule

## WHAT: Definition

Schedule is the recurrence rule set for a Task — it specifies which days of the week the Task appears, for which Person, and any special exceptions. A Schedule is expressed in natural language ("every weekday," "Monday, Wednesday, Friday") and resolved by the Recurrence Engine into concrete day-of-week rules. The Schedule is the mechanism that makes WeDo a recurrence-first product rather than a task-list product.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Task Vocabulary]] — "Schedule" is the canonical term; "recurrence," "repeat settings," and "cadence" are off-limits in UI copy
- Used by:
  - [[System - Recurrence Engine]] — evaluates Schedule rules to materialize Tasks on each Day
  - [[Capability - Add Task via Natural Language]] — creates and updates Schedule objects from NL input
- Related primitives:
  - [[Primitive - Task]] — each Task has exactly one Schedule
  - [[Primitive - Person]] — Schedule is scoped to a Person's Tasks
  - [[Primitive - Day]] — Schedule rules are evaluated against Days

## WHY: Rationale

- Product Thesis: [[Product Thesis - Radical Simplicity]] — natural language schedule entry (Strategy Bet 1) requires a flexible Schedule primitive that can represent real household patterns without a calendar-style UI
- Principle: [[Principle - Constraint is the Product]] — Schedules support recurring patterns only; one-off future-dated tasks are not a Schedule concept in v1

## WHEN: Timeline

V1 foundational primitive. Natural language resolution is the v1 entry mechanism. The underlying data model should be robust for future schedule types (irregular, exception-based, one-off) even though v1 UI only exposes recurring patterns.

Known household schedule patterns:
- Monday–Saturday (daily chores)
- Monday–Friday (school and work tasks)
- Special Wednesday rule (in-person school vs. other Wednesdays)
- No tasks on Sunday (Sabbath)

## HOW: Implementation

### Attributes

| Attribute | Type | Notes |
|-----------|------|-------|
| days_of_week | Day[] | Which days this schedule is active (e.g., [Mon, Tue, Wed, Thu, Fri]) |
| exceptions | Exception[] | Override rules (future: travel weeks, one-off skips) |
| nl_source | String | Original natural language input that created this schedule |
| person | Person | Owner; schedule is scoped to one person |

### Behavior

- NL input → parsed into day-of-week array + any exception rules
- Schedule evaluates against a target Day → returns Boolean (does this task appear today?)
- Sunday is never active regardless of schedule rules (handled by Recurrence Engine + Day primitive)

### Examples

- NL: "every weekday" → days_of_week = [Mon, Tue, Wed, Thu, Fri]
- NL: "Monday, Wednesday, Friday" → days_of_week = [Mon, Wed, Fri]
- NL: "Monday through Saturday" → days_of_week = [Mon, Tue, Wed, Thu, Fri, Sat]
- NL: "the Wednesday Micah has school" → complex case; may require exception handling or clarification prompt

### Anti-Examples

- Wrong: Storing schedules as free-text strings without parsing — Recurrence Engine needs structured day-of-week data
- Wrong: Supporting one-off future-date tasks via Schedule in v1 — Schedule is recurrence-only until that feature is added
- Wrong: Showing day-picker UI in the schedule entry flow — entry is natural language only per [[Capability - Add Task via Natural Language]]
