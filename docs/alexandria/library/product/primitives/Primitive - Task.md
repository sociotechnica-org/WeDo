# Primitive - Task

## WHAT: Definition

Task is the recurring item that appears on a Person's daily list according to their Schedule. A Task is not a to-do item — it does not persist until completed, does not roll over, and does not accumulate. It recurs fresh each applicable day and resets whether or not it was completed yesterday. Each Task has an emoji for visual identification and belongs to exactly one Person.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Task Vocabulary]] — "Task" is the canonical term; "todo," "item," "chore," and "action" are off-limits
- Used by:
  - [[Component - Task Row]] — the UI component that renders one Task
  - [[System - Recurrence Engine]] — evaluates Schedule rules to materialize Tasks per Day
  - [[Capability - Toggle Task Completion]] — the action that marks a Task done/not-done
  - [[Capability - Add Task via Natural Language]] — the capability that creates new Tasks
- Related primitives:
  - [[Primitive - Person]] — each Task belongs to one Person
  - [[Primitive - Schedule]] — each Task has one Schedule specifying when it appears
  - [[Primitive - Day]] — Tasks exist within a Day, not independently of time

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — Tasks exist inside Days; they are not free-floating items with due dates
- Product Thesis: [[Product Thesis - Radical Simplicity]] — the Task primitive is deliberately simple: no sub-tasks, no dependencies, no priority levels, no tags

## WHEN: Timeline

V1 foundational primitive. V1 supports recurring Tasks only. The data model is designed to be robust for future task types (one-off, project-linked) even though they are not exposed in v1.

## HOW: Implementation

### Attributes

| Attribute | Type | Notes |
|-----------|------|-------|
| name | String | Task display text (e.g., "Practice piano") |
| emoji | Emoji | Visual identifier; required on all tasks |
| person | Person | Owner; exactly one per task |
| schedule | Schedule | Recurrence rules for this task |
| completion_state | Boolean (per Day) | Done / not-done for today |

### Behavior

- A Task appears on a Person's list on days matching its Schedule
- A Task's completion state is per-Day — completing it today does not affect tomorrow
- No rollover: if not completed today, it is gone when the day ends; tomorrow has a fresh instance
- Past-day completions can be toggled (catch-up entry supported)
- Emoji is required on every task — primary identification for pre-readers (Cora) and fun for everyone

### Examples

- "Practice piano" (Micah): emoji 🎹, Schedule = Monday/Tuesday/Thursday/Friday → appears on those days; if Micah forgets Monday, Tuesday starts fresh
- "Morning chores" (Cora): emoji 🧹, Schedule = Monday–Saturday → appears daily except Sunday; emoji is Cora's primary way to identify this task

### Anti-Examples

- Wrong: Carrying an incomplete Task from yesterday into today — no rollover per [[Product Thesis - The Day as Primary Frame]]
- Wrong: A Task with no emoji — emoji is required on all Tasks per accessibility decision for Cora
- Wrong: A Task with a due date or future-date assignment — Tasks recur; they don't have due dates
- Wrong: A Task with sub-tasks or dependencies — Task is a leaf primitive; no nesting
