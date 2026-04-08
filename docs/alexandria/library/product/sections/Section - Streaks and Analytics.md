# Section - Streaks and Analytics

## WHAT: Definition

Streaks and Analytics is a secondary view in WeDo showing each person's completion history over time — their current streak count and a simple completion trend. It is not the primary app view; the app defaults to Dashboard View and this section is accessed intentionally.

Access mechanism: TBD — the wireframes do not specify how a user navigates to this view. The most likely entry points are a button or link on the Dashboard View (e.g., in the top navigation bar alongside Settings) or a dedicated section within Settings. This gap should be resolved before v1 implementation; until then, treat navigation to this view as an open design question.

## WHERE: Ecosystem

- Parent domain:
  - [[Domain - Daily Board]] — parent workspace
- Conforms to:
  - [[Standard - Visual Language]] — all visual display of streaks and history must follow the watercolor/letterpress spec
  - [[Standard - Streak Calculation]] — all streak values displayed here must be computed per this standard
  - [[Standard - Task Vocabulary]] — uses canonical term "Streak" and "Skip Day"
- Uses systems:
  - [[System - Streak Engine]] — provides streak count and history data this section displays
- Accessed via:
  - TBD — likely [[Section - Dashboard View]] (top navigation bar or persistent link) or Settings; access mechanism not yet specified in wireframes
- Related sections:
  - [[Section - Dashboard View]] — primary view; this is the secondary/supplementary view
- Related experience:
  - [[Loop - Streak Motivation]] — the engagement loop this section reinforces by making streak progress visible

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — streak history is personal encouragement, not comparative ranking; this section shows each person's own history
- Principle: [[Principle - Warmth Over Urgency]] — completion history should feel encouraging and reflective, not evaluative or shame-inducing
- Principle: [[Principle - Cooperative Not Competitive]] — no cross-person ranking; no "who has the best streak this month" summary

## WHEN: Timeline

V1 secondary feature. The app "stays in dashboard mode" most of the time per the founder's description. This section is present but not the default.

## HOW: Implementation

### Behavior

Shows per-person streak data: current streak count and historical completion. Exact layout is not specified in wireframes — this is a secondary area.

Key constraints:
- No cross-person ranking or sorting by streak
- Skip Days are shown as neutral holds (not gaps or failures)
- Sundays are excluded from the display (not shown as misses)
- Tone is warm and encouraging — "Moriah's best streak: 12 days" not "Moriah missed 3 days"

### Examples

- Cora's panel: current streak 4 days, small completion history showing recent weeks; Skip Day shown as a neutral marker (not a red gap)
- Micah's panel: current streak 0 (just reset), previous best streak shown as an achievement ("Your best: 14 days") — reset is displayed neutrally

### Anti-Examples

- Wrong: Showing all family members sorted by streak count — violates [[Principle - Cooperative Not Competitive]]
- Wrong: Using red to mark days where completion was below 100% — must use warm neutral treatment per [[Standard - Visual Language]]
- Wrong: Labeling Skip Days as "missed" or showing them as failures in the history timeline
