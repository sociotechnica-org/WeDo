# Principle - Warmth Over Urgency

## WHAT: The Principle

WeDo's visual and verbal feedback should feel warm, quiet, and encouraging — never urgent, alarming, punitive, or guilt-inducing.

## WHERE: Ecosystem

- Product Thesis:
  - [[Product Thesis - Cooperative Household]] — warmth serves the cooperative household vision; urgency would undermine the safe, supportive home feeling
- Standards:
  - [[Standard - Visual Language]] — this principle is made testable by the visual language spec (no reds, watercolor palette, sketched elements)
  - [[Standard - Streak Calculation]] — streak reset behavior is non-punitive per this principle (Skip Days don't break streaks)
- Governs:
  - [[Domain - Daily Board]] — the entire product's emotional register
  - [[Section - Dashboard View]] — completion states must use warm visuals, not alarm colors
  - [[Section - Single List View]] — task completion feedback must be warm
  - [[Component - Task Row]] — checked/unchecked states must use warm, not urgent, treatment
  - [[Component - Completion Ring]] — ring fills warm, never alarm-red when incomplete
- Related:
  - [[Principle - Cooperative Not Competitive]] — warmth and cooperation reinforce each other; alarm/urgency and competition reinforce each other in the opposite direction
  - [[Principle - Constraint is the Product]] — the warmth principle is part of the product's identity, not a soft preference

## WHEN: Timeline

Established at founding (v1), grounded in the family's home context — an iPad in a common area seen by children and parents alike. The principle is permanent in the sense that the home context is permanent; a product that creates household anxiety is a failure regardless of feature set. Specific implementations (the watercolor palette, no red indicators) are v1 decisions and may evolve aesthetically. The principle itself could be revisited only if the household's emotional context changes significantly — for example, if the family decided they wanted more explicit accountability pressure. That would require an explicit values conversation, not just a design tweak.

## WHY: Belief

The iPad sits in a family common area. Children see it. Parents see it first thing in the morning and last thing before bed. A product that uses red indicators, "overdue" language, or guilt-producing mechanics creates low-grade anxiety in the home. That is the opposite of what a shared family tool should do.

WeDo's emotional register is: "We're doing well, and if we're not, that's okay — tomorrow is fresh." This is not softness for its own sake — it's a deliberate design choice informed by what makes family coordination sustainable versus what makes it dread-inducing.

## HOW: Application

### What Following This Looks Like

- Incomplete tasks at the end of the day: the ring simply shows how far you got, with no red indicator, no "OVERDUE" label, no guilt language
- Streak reset: the counter returns to 0 quietly; no dramatic animation, no "you broke your streak" message
- 100% completion: warm, communal acknowledgment ("We did it") rather than trophy/points fanfare
- Color palette: watercolor blues and warm neutrals; nothing in the red/orange/amber alarm range

### What Violating This Looks Like

- Using red to indicate incomplete tasks or missed days
- "You failed to complete your tasks" messaging
- A dramatic "STREAK BROKEN" animation when a streak resets
- High-contrast, high-saturation colors for anything in the UI
- Urgency language: "overdue," "late," "missed," "failed"

### Tensions

Trades off against: salience. Warm, quiet design is less attention-demanding, which is a feature for ambient use but could mean the board gets ignored when actually needed. The resolution is to rely on family habit and shared visibility, not alarm mechanics, to ensure engagement.

### Test

Ask: "If a 7-year-old saw this feedback, would they feel encouraged or ashamed?" If the latter, it violates this principle.
