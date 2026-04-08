# Primitive - Streak

## WHAT: Definition

Streak is the count of consecutive qualifying Days on which a Person reached 100% task completion. A qualifying day is any non-Sunday, non-Skip-Day with at least one scheduled task. Streak is a personal metric — it tracks a Person's own consistency and is never compared against other Persons' streaks in a ranking format.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Streak Calculation]] — all streak increment, hold, and reset logic must match this standard
  - [[Standard - Task Vocabulary]] — "Streak" is the canonical term; "combo," "chain," and "score" are off-limits
- Maintained by:
  - [[System - Streak Engine]] — the system responsible for computing and updating Streak values
- Displayed in:
  - [[Section - Dashboard View]] — streak count shown at the top of each Person's column, above the Completion Ring and person name
  - [[Section - Streaks and Analytics]] — primary display for historical streak data
- Related primitives:
  - [[Primitive - Person]] — each Person has one Streak object
  - [[Primitive - Day]] — Streak counts qualifying Days

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — Streak is personal encouragement, not competitive score
- Principle: [[Principle - Warmth Over Urgency]] — streak reset is a neutral event, not a punitive one; the primitive should carry no "failure" semantics
- Principle: [[Principle - Cooperative Not Competitive]] — Streak is per-person; cross-person streak comparison is not a supported view

## WHEN: Timeline

V1 foundational primitive. Threshold is 100% (v1 decision — may become configurable). Skip Day interaction is specified at launch.

## HOW: Implementation

### Attributes

| Attribute | Type | Notes |
|-----------|------|-------|
| person | Person | Owner of this streak |
| current_count | Integer | Days in current active streak |
| best_count | Integer | All-time best streak for this person |
| last_qualifying_date | Date | Most recent day that incremented the streak |

### Behavior

- Streak increments when: non-Sunday, non-Skip-Day, Person reaches 100% completion
- Streak holds when: Sunday, Skip Day declared, or Day has no scheduled tasks
- Streak resets to 0 when: non-Sunday, non-Skip-Day ends with < 100% completion
- Bean trigger: when current streak increments (i.e., 100% is first reached on a qualifying day) → [[System - Streak Engine]] emits signal

### Examples

- Moriah completes 5/5 tasks Monday → streak = 4 (was 3); bean signal emitted
- Wells completes 4/5 tasks Tuesday → streak resets to 0; no bean signal; no alarm
- Skip Day declared for Cora Wednesday → streak holds at current value; Thursday 100% → streak increments normally
- Sunday: Micah completes all tasks → streak holds at current value (Sunday never counts)

### Anti-Examples

- Wrong: Incrementing streak for a day with 0 scheduled tasks (vacuous 100%) — per [[Standard - Streak Calculation]]
- Wrong: Displaying "YOUR STREAK IS BROKEN" with dramatic treatment — reset is a neutral event per [[Principle - Warmth Over Urgency]]
- Wrong: Providing a cross-person streak leaderboard using Streak data — Streak is personal per [[Principle - Cooperative Not Competitive]]
