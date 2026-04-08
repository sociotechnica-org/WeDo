# Capability - Toggle Task Completion

## WHAT: Definition

Toggle Task Completion is the primary daily interaction in WeDo — tapping anywhere on a Task Row marks it done (or undone). It is the action that advances the Completion Ring, triggers the bean signal at 100%, and feeds the Streak Engine at day's end. It is available in Single List View for the current day, past days (catch-up), and tomorrow.

## WHERE: Ecosystem

- Performed in:
  - [[Section - Single List View]] — the only place this capability is performed; tapping a task row in this view triggers the toggle
- Conforms to:
  - [[Standard - Visual Language]] — the completion state change must render as a watercolor-wash checkmark, not a standard OS checkbox
  - [[Standard - Task Vocabulary]] — completion state uses "done / not done" language, not "checked / unchecked" in any user-facing copy
- Affects:
  - [[Component - Task Row]] — visual state changes (checked/unchecked treatment) are rendered by this component
  - [[Component - Completion Ring]] — ring fill updates after each toggle
  - [[System - Streak Engine]] — completion state feeds streak calculation at day end
  - [[Primitive - Task]] — updates the completion_state attribute on the Task for that Day
- Related capabilities:
  - [[Capability - Add Task via Natural Language]] — the sibling capability for creating tasks

## WHY: Rationale

- Product Thesis: [[Product Thesis - Radical Simplicity]] — tap-to-toggle is the simplest possible completion interaction; no swipe gesture, no confirmation dialog, no progress entry
- Principle: [[Principle - Warmth Over Urgency]] — the toggle feedback should be warm and immediate (watercolor wash fills the checkbox); no harsh audio, no dramatic animation

## WHEN: Timeline

V1 core capability. Past-day editing explicitly supported (founder decision, Round 2 answers).

## HOW: Implementation

### Behavior

- Tap anywhere on a Task Row in Single List View → toggles completion state
- Toggling to done: checkbox fills with blue watercolor checkmark; task text may show subtle cross-through treatment (TBD)
- Toggling to not-done: checkbox returns to empty sketched state
- Completion Ring updates proportionally after each toggle
- At 100% completion: bean signal emitted by [[System - Streak Engine]]; ring shows full with simple visual treatment (filled ring with subtle color shift) — warm, not gamified; will be prototyped and iterated post-v1 per [[Principle - Warmth Over Urgency]]
- Past days: toggle works on any past day — catch-up entry is supported
- Tomorrow: toggle works for pre-completion

### Examples

- Moriah has 5 tasks; taps task 3 → checkbox 3 fills blue; ring advances from 40% to 60%
- Moriah taps task 3 again → checkbox 3 empties; ring retreats to 40%
- Jess navigates to yesterday → taps two of Wells' incomplete tasks → they are marked done retroactively; streak is not retroactively recalculated for past days (TBD — flag)
- Cora taps her last task → ring hits 100%; bean signal fires; all 3 checkboxes show filled; ring appears complete

### Anti-Examples

- Wrong: Requiring a swipe gesture to complete — tap anywhere on the row is the interaction, per wireframe direction
- Wrong: Showing a confirmation dialog ("Are you sure?") before toggling — frictionless is the design intent
- Wrong: Disabling toggle on past days — catch-up entry is explicitly supported
