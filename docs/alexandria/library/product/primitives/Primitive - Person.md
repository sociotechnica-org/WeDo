# Primitive - Person

## WHAT: Definition

Person is the core entity representing a family member in WeDo. Each Person has their own task list visible to the whole household. There are six Persons in the current household: Jess, Elizabeth, Micah, Moriah, Wells, and Cora. Person is the organizational unit for task ownership, completion tracking, streak calculation, and column display.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Task Vocabulary]] — "Person" is the canonical term; "user," "member," and "account" are off-limits
- Used by:
  - [[Section - Dashboard View]] — displays one column per Person
  - [[Section - Single List View]] — focuses on one Person's task list
  - [[Component - Person Column]] — the UI component that renders a Person's column
  - [[System - Streak Engine]] — tracks streak state per Person
  - [[System - Recurrence Engine]] — materializes tasks per Person per Day
- Related primitives:
  - [[Primitive - Task]] — tasks are owned by a Person
  - [[Primitive - Streak]] — each Person has one Streak

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — the Person primitive models the family unit; six specific known individuals, not anonymous users
- Principle: [[Principle - Cooperative Not Competitive]] — Persons are peers on the board; no Person is ranked above another

## WHEN: Timeline

V1 foundational primitive. The household currently has 6 persons. Adding persons is possible via Settings. No authentication — all persons are equal task enterers.

## HOW: Implementation

### Attributes

| Attribute | Type | Notes |
|-----------|------|-------|
| name | String | Display name (e.g., "Cora") |
| emoji_or_avatar | Emoji / Image | Used for identification in UI |
| tasks | Task[] | Recurring tasks assigned to this person |
| streak | Streak | Current streak for this person |

### Behavior

- One Person → one column in Dashboard View
- One Person → the subject of Single List View when their column is tapped
- No authentication or permission model in v1 — any household member can edit any Person's tasks
- Both parents (Jess and Elizabeth) can configure any child's tasks

### Examples

- Cora (age 4, can't read): has emoji on every task for visual identification; her column is the rightmost or a fixed position
- Micah: has school-day tasks (Mon–Fri) and weekend chores (Sat); different schedules per day
- Elizabeth: has her own tasks on the board alongside children; both parents are full participants

### Anti-Examples

- Wrong: Calling a Person a "user" in code or UI — canonical term is Person
- Wrong: Treating Person as account with login — no authentication in v1
- Wrong: Allowing a Person to have tasks without a schedule — all tasks are recurring and have a Schedule
