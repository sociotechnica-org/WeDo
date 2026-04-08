# Capability - Skip Day

## WHAT: Definition

Skip Day is the capability that designates a Day as non-counting for one or more Persons — typically triggered by travel, illness, or unusual household circumstances. A declared Skip Day does not count against streaks. It is a first-class feature designed to make the product feel forgiving rather than rigid.

## WHERE: Ecosystem

- Performed in:
  - TBD — likely [[Section - Dashboard View]] Settings panel or a long-press gesture on [[Section - Day Navigation]]; UI surface not yet specified in wireframes
- Conforms to:
  - [[Standard - Streak Calculation]] — Skip Day behavior is specified in the streak rules; this capability creates the records that standard evaluates
  - [[Standard - Task Vocabulary]] — "Skip Day" is the canonical term; "vacation mode," "pause," and "off day" are off-limits
- Modifies:
  - [[Primitive - Day]] — sets skip_day flag on the Day record for specified Persons
  - [[Primitive - Streak]] — streak engine will hold (not reset) the streak for skip-day persons
- Respects rules from:
  - [[System - Streak Engine]] — the engine reads Skip Day flags when calculating streaks

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — families have irregular weeks; Skip Day acknowledges that reality and prevents the product from feeling punitive during travel or illness
- Principle: [[Principle - Warmth Over Urgency]] — the absence of a forgiving Skip Day mechanism would make missed days feel like streak failures; Skip Day turns irregular weeks into neutral events

## WHEN: Timeline

V1 capability. Exact UI for declaring a Skip Day is not specified in wireframes (TBD — likely in Settings or via a long-press / contextual action on the Day).

## HOW: Implementation

### Behavior

- Any parent can declare a Skip Day for any Person (or all Persons) on any Day
- Skip Day can be declared retroactively for past days
- Skip Day affects streak calculation only — tasks are still shown and can still be completed if desired
- Streak hold: Streak Engine treats the Skip Day as neutral; streak count carries forward unchanged

### Examples

- Family leaves for a camping trip Friday; Jess declares Skip Day for all 6 Persons on Friday and Saturday → Friday and Saturday don't count against any streaks; streaks resume Sunday (which also doesn't count) and Monday
- Cora is sick on Wednesday; Elizabeth declares Skip Day for Cora only → Cora's streak holds; other Persons unaffected
- Family forgets to declare Skip Day during vacation; Elizabeth goes back and retroactively marks two past days as Skip Days → streaks recalculated accordingly

### Anti-Examples

- Wrong: Calling it "vacation mode" or "pause" in UI — canonical term is "Skip Day" per [[Standard - Task Vocabulary]]
- Wrong: Hiding tasks on a Skip Day — tasks still show; Skip Day only affects streak calculation
- Wrong: Preventing retroactive Skip Day declaration — catch-up entry (including Skip Day) is explicitly supported
