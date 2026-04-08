# Standard - Streak Calculation

## WHAT: Definition

Streak Calculation specifies the exact rules for incrementing, holding, and resetting a person's streak counter, including the 100% completion threshold, Skip Day handling, and Sunday exclusion. It defines what counts as a "streak day" so the [[System - Streak Engine]] and any display components produce consistent, predictable results.

## WHERE: Ecosystem

- Implements:
  - [[Principle - Warmth Over Urgency]] — makes streak behavior non-punitive by specifying that Skip Days don't break streaks and that Sunday never counts
  - [[Principle - Cooperative Not Competitive]] — ensures streak mechanics motivate personal completion, not comparison
- Conforming:
  - [[System - Streak Engine]] — must implement exactly this calculation logic
  - [[Component - Completion Ring]] — ring-fill-to-100% triggers bean notification per this spec
  - [[Section - Streaks and Analytics]] — display of streaks must reflect values computed per this standard
- Related:
  - [[Standard - Visual Language]] — how streaks and completion are rendered visually

## WHY: Rationale

- Principle: [[Principle - Warmth Over Urgency]] — without a precise spec, ad-hoc streak logic tends toward punitive behavior (partial days breaking streaks, missing Sundays counting against you). A written spec enforces the warmth constraint structurally.
- Driver: The founder specified 100% threshold explicitly and named Sunday as a no-count day. These are non-obvious choices that must be codified so they survive refactoring.

## WHEN: Timeline

Established v1. The 100% threshold is a v1 decision — it may become configurable in a future version if household needs change.

## HOW: Specification

### Threshold

| Rule | Value |
|------|-------|
| Completion threshold for streak increment | 100% of scheduled tasks for that person on that day |
| Partial completion (e.g., 80%) | Does NOT increment streak; does NOT break streak in progress |
| Bean trigger | Any time during the day when a person reaches 100% for the first time |

### Day Classification

| Day Type | Streak Behavior |
|----------|-----------------|
| Regular day, 100% complete | Streak increments by 1 |
| Regular day, < 100% complete | Streak resets to 0 |
| Sunday | Never counts against or for streak regardless of completion |
| Skip Day (declared) | Does not count against streak; streak count holds |
| Day with no scheduled tasks | Does not count; streak holds |

### Bean Notification Rule

The app signals 100% completion for a child — the external bean system (managed by Elizabeth) handles the physical reward. The app does not track bean counts or manage the reward ledger.

- Trigger: Person reaches 100% completion on any non-Sunday, non-Skip-Day
- Signal: Visual/UI acknowledgment (exact treatment TBD — open question from wireframes)
- App responsibility: Signal only. Not ledger.

### Retroactive Recalculation

When past days are edited — tasks toggled after the day has passed, or Skip Days declared retroactively — the streak recalculates from the edited day forward. This is expected behavior: the family sometimes enters results from previous days later (catch-up entry), and retroactive Skip Days are explicitly supported. The streak value at any point in time should reflect the current state of all Day records, not a cached snapshot.

Example: Person has a 6-day streak (Mon–Sat). On Sunday, Elizabeth retroactively toggles a previously-unchecked task for Thursday. Thursday now shows 100% completion. The streak engine recalculates from Thursday forward — Thursday becomes a streak day, and the streak may increase.

Example: Person's 4-day streak breaks because Wednesday shows incomplete. Parent later declares a Skip Day for Wednesday (illness, logged retroactively). Wednesday is now neutral. The streak engine recalculates — the streak holds through Wednesday and continues from Thursday.

### Anti-Examples

- Wrong: Counting Sunday completion toward streaks — Sunday is Sabbath and explicitly excluded
- Wrong: Breaking a streak because a Skip Day was declared — Skip Days are designed to be penalty-free
- Wrong: Tracking beans or reward counts inside the app — the reward system is entirely external
- Wrong: Using a threshold other than 100% — the founder specified this explicitly; partial-completion streaks are not the design intent
- Wrong: Incrementing streak for a day with zero scheduled tasks — a vacuous 100% shouldn't pad streak counts
