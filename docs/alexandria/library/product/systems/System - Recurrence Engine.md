# System - Recurrence Engine

## WHAT: Definition

The Recurrence Engine is the cross-cutting mechanism that evaluates each Person's Schedule rules each day and materializes the correct set of Tasks on the Day's board. It processes natural-language schedule definitions, applies day-of-week rules, handles Sunday exclusion, and produces the task list for any given day — present, past within history, or one day forward.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Task Vocabulary]] — uses canonical term "Schedule" for recurrence rules, "Task" for items, "Day" for time container
- Dependents:
  - [[Section - Dashboard View]] — uses this system's output to populate each person's column for the displayed day
  - [[Section - Single List View]] — uses this system's output to populate the full-screen task list for one person
  - [[Capability - Navigate Days]] — navigation triggers this system to re-evaluate for the target day
  - [[System - Streak Engine]] — consumes this system's task/completion data to calculate streaks
- Dependencies:
  - [[Primitive - Schedule]] — the recurrence rule objects this system evaluates
  - [[Primitive - Task]] — the task definitions this system instantiates per day
  - [[Primitive - Day]] — the time container this system operates within
- Related:
  - [[Capability - Add Task via Natural Language]] — the capability that creates/updates Schedule objects this system reads

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — implements the day-frame by computing what tasks belong to today rather than maintaining a persistent task list
- Product Thesis: [[Product Thesis - Radical Simplicity]] — natural language schedule entry (Bet 1) requires an engine that can resolve "every weekday" or "Monday, Wednesday, Friday" into concrete daily task sets
- Driver: Household schedules are complex (different days per child, school vs. non-school weeks, Sunday exclusion) and must be expressed without a calendar-style recurrence UI

## WHEN: Timeline

V1 core system. Supports recurring task types only in v1. The data model is designed to be robust for future task types (one-off, project-linked) even though v1 only exposes recurring tasks.

Enables: future support for non-recurring task types when those are added to the product.

## HOW: Implementation

### Behavior

Given a target Day and a Person, the Recurrence Engine:
1. Loads all active Schedules for that Person
2. For each Schedule, evaluates whether the target Day matches the `schedule_rules.days` array using RFC 5545 day codes
3. If Sunday: no tasks are materialized regardless of rules
4. Returns the set of Tasks that are active for that Person on that Day

The engine does not carry state between days — each day evaluation is independent. Tasks that were not completed yesterday are not added to today's list (no rollover).

### Evaluation Algorithm

The core evaluation is zero-dependency, using the RFC 5545 day code lookup defined in ADR 005:

```typescript
const DAY_CODES = ["SU","MO","TU","WE","TH","FR","SA"] as const;
function isTaskScheduledForDate(rules: { days: string[] }, date: Date): boolean {
  return rules.days.includes(DAY_CODES[date.getDay()]);
}
```

`date.getDay()` returns 0–6 (Sunday=0). `DAY_CODES` maps that index to the RFC 5545 code. The engine checks whether that code appears in `schedule_rules.days`.

### Examples

- `schedule_rules: { "days": ["MO","TU","TH","FR"] }` + target Day = Wednesday → `DAY_CODES[3]` = "WE" not in array → task does not appear
- `schedule_rules: { "days": ["MO","TU","WE","TH","FR","SA"] }` + target Day = Sunday → Sunday exclusion rule fires → no tasks materialized
- `schedule_rules: { "days": ["MO","TU","WE","TH","FR"] }` + target Day = Monday → "MO" in array → task appears
- NL input "every weekday" → NL Task Parser returns `{ "days": ["MO","TU","WE","TH","FR"] }` → engine evaluates against that array each day

### Anti-Examples

- Wrong: Carrying yesterday's uncompleted tasks forward onto today's list — no rollover is a core design decision
- Wrong: Materializing tasks on Sunday even if a schedule covers 7 days — Sunday is always excluded
- Wrong: Limiting Schedule rules to a fixed UI (e.g., checkbox-per-day of week) rather than supporting NL input — the natural language bet requires flexible rule expression
