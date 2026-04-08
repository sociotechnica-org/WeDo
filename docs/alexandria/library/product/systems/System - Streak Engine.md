# System - Streak Engine

## WHAT: Definition

The Streak Engine is the cross-cutting mechanism that tracks each Person's consecutive 100%-completion days, applies Sunday exclusion and Skip Day rules, and produces the current streak count and bean-trigger signal. It is the system that makes the Streak primitive meaningful as a live, updating value.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Streak Calculation]] — must implement exactly the threshold, day-classification, and Skip Day rules in this standard
  - [[Standard - Task Vocabulary]] — uses canonical terms "Streak," "Skip Day," "Person," and "Day"
- Dependents:
  - [[Section - Streaks and Analytics]] — displays streak counts produced by this system
  - [[Component - Completion Ring]] — ring reaching 100% triggers the bean signal this system produces
  - [[Loop - Streak Motivation]] — the motivation loop is driven by streak values from this system
- Dependencies:
  - [[System - Recurrence Engine]] — provides the task-set-for-day and completion-state data this system evaluates
  - [[Primitive - Streak]] — the data object this system maintains and updates
  - [[Primitive - Day]] — the time unit this system evaluates per person
  - [[Primitive - Person]] — the entity whose streak is tracked
- Related:
  - [[Capability - Skip Day]] — creates the Skip Day records this system respects when calculating streaks

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — streaks are personal, not comparative; the engine tracks per-person streaks independently without ranking
- Principle: [[Principle - Warmth Over Urgency]] — streak reset must be quiet/non-punitive; the engine should not emit alarm signals or "streak broken" messages
- Standard: [[Standard - Streak Calculation]] — the calculation logic is specified in the standard and this system implements it exactly

## WHEN: Timeline

V1 system. The 100% threshold is a v1 decision — may become configurable in a future version if the household finds 100% too strict or wants per-person thresholds.

## HOW: Implementation

### Behavior

For each Person, at any point during or after a Day:
1. Check if the Day is Sunday → if yes, hold streak (neither increment nor reset)
2. Check if a Skip Day is declared for this Day and Person → if yes, hold streak
3. Evaluate completion: did Person complete 100% of scheduled tasks for this Day?
   - 100% → increment streak by 1; check bean trigger
   - < 100% at day end → reset streak to 0
4. Bean trigger: when 100% is first reached during the day (not just at day end) → emit bean signal for that Person
5. Retroactive recalculation: when any past Day record is modified (task toggled, Skip Day declared or removed), re-run the streak calculation from that Day forward through the present. The streak should always reflect current Day state, not a cached value.

The streak count is the number of consecutive qualifying days (non-Sunday, non-Skip) where 100% was reached.

### Examples

- Person has 5-day streak (Mon–Fri), completes all tasks Saturday → streak becomes 6; Sunday follows → streak holds at 6; Monday 100% → streak becomes 7
- Person has 4-day streak, misses 1 task on Wednesday → streak resets to 0; Thursday 100% → new streak of 1 begins
- Person has 3-day streak, parents declare Skip Day on Friday for travel → Skip Day holds streak at 3; Saturday 100% → streak becomes 4
- Cora has 2 tasks on Tuesday, completes both at 3pm → bean signal emitted at 3pm; streak will increment when day ends
- Wells' streak shows 3 days (Mon–Wed). On Friday, Elizabeth retroactively toggles Wells' unchecked task from Wednesday → Wednesday now shows 100%; streak engine recalculates from Wednesday forward → streak count updates to reflect the corrected history

### Anti-Examples

- Wrong: Displaying "STREAK BROKEN" in a dramatic or punitive way — the engine emits a reset event; UI must render it warmly per [[Standard - Visual Language]]
- Wrong: Allowing Sunday completions to increment the streak — Sunday is always excluded
- Wrong: Tracking beans internally or maintaining a bean ledger — the engine only emits a "100% reached" signal; bean management is external
- Wrong: Using < 100% (e.g., 80%) as a streak increment threshold — the threshold is exactly 100% per [[Standard - Streak Calculation]]
