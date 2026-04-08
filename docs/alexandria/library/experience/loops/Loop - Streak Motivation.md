# Loop - Streak Motivation

## WHAT: Definition

Streak Motivation is the cross-day engagement loop where each successful daily completion extends a Person's streak, making future daily completions slightly more motivating due to momentum. The loop operates across multiple Days rather than within a single Day. It is a secondary loop that amplifies the [[Loop - Daily Completion Rhythm]] without replacing it.

## WHERE: Ecosystem

- Plays out in sections:
  - [[Section - Streaks and Analytics]] — where streak history is visible and the loop's cumulative progress is displayed
  - [[Section - Single List View]] — where individual completion happens that feeds the streak
- Supported by systems:
  - [[System - Streak Engine]] — the mechanism that maintains streak state and emits the bean signal
- Anchors to:
  - [[Loop - Daily Completion Rhythm]] — each successful daily loop increments the streak that powers this loop
- Governed by:
  - [[Standard - Streak Calculation]] — exact rules for what counts as a qualifying day
  - [[Principle - Warmth Over Urgency]] — streak reset must be quiet, not punitive; the loop must not create anxiety
  - [[Principle - Cooperative Not Competitive]] — streaks are personal; this loop must not become a cross-person competition
- Relates to experience goals:
  - [[Experience Goal - Mutual Accountability]] — streak visibility contributes to gentle household accountability

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — streak momentum is personal; it encourages each Person to keep their own momentum, which collectively supports the household
- Principle: [[Principle - Warmth Over Urgency]] — the loop should create mild positive momentum, not anxiety about breaking a streak; Skip Days exist specifically to defuse streak anxiety

## WHEN: Timeline

V1 secondary engagement loop. The 100% threshold is a v1 decision. Streak Motivation loop effectiveness depends on how consistently family members actually reach 100% — if 100% is too hard, the loop may not fire often enough to be motivating.

## HOW: Implementation

### Loop Steps

1. **Day N complete (100%):** Streak increments by 1. Bean signal fires. Ring shows complete.
2. **Day N+1:** Person sees their streak count (in Streaks view or on ring). Mild motivation to maintain it.
3. **Day N+1 complete:** Streak increments again. Bean fires again. Momentum builds.
4. **Streak reset:** Person misses a qualifying day. Streak returns to 0 quietly. No dramatic event. New loop can begin.
5. **Skip Day:** Loop is paused, not broken. Streak holds. Loop resumes next qualifying day.

### Examples

- Micah has a 7-day streak; he's aware of it; on Day 8 he completes his tasks somewhat because he wants to extend to 8
- Cora has a 3-day streak; her parent mentions it ("Cora, you've had 3 great days!"); Cora is encouraged to complete today
- Family travel breaks Moriah's 12-day streak; parents declare Skip Days; streak holds at 12; Moriah resumes and the loop continues

### Anti-Examples

- Wrong: Showing a "STREAK BROKEN" alert when a person misses a day — streak reset is a quiet neutral event per [[Principle - Warmth Over Urgency]]
- Wrong: Displaying family streaks in a comparative ranking ("Micah: 8 days, Moriah: 5 days") — streaks are personal per [[Principle - Cooperative Not Competitive]]
- Wrong: Making the 100% threshold feel oppressive — if partial completion never triggers the loop, the loop may become demoralizing; the Skip Day safety valve is essential
