# Section - Single List View

## WHAT: Definition

Single List View is the full-screen expansion of one person's task list. It is the place where tasks are toggled done/not-done, and the only place where new tasks are added. It is accessed by tapping any person's column on the Dashboard View and exited via a Back button.

## WHERE: Ecosystem

- Parent domain:
  - [[Domain - Daily Board]] — parent workspace
- Conforms to:
  - [[Standard - Visual Language]] — task rows, completion ring, checkboxes, and Add Task button must follow letterpress/watercolor spec
  - [[Standard - Task Vocabulary]] — all copy uses canonical terms
- Contains components:
  - [[Component - Completion Ring]] — displayed centered above the task list, larger than dashboard version
  - [[Component - Task Row]] — task rows are larger and more spaced out than in Dashboard View
- Adjacent sections:
  - [[Section - Dashboard View]] — origin view; Back button returns here
  - [[Section - Day Navigation]] — day navigation bar persists in this view
- Capabilities performed here:
  - [[Capability - Toggle Task Completion]] — tap anywhere on a task row to toggle
  - [[Capability - Add Task via Natural Language]] — Add Task button at bottom of screen
- Uses systems:
  - [[System - Recurrence Engine]] — provides the task list for this person on the displayed day

## WHY: Rationale

- Product Thesis: [[Product Thesis - Radical Simplicity]] — task entry is here only (not on dashboard) to keep the dashboard clean and glanceable; entry friction is contained to an intentional interaction
- Principle: [[Principle - Warmth Over Urgency]] — the full-screen single-person view allows deliberate, calm interaction rather than dense multi-column interaction
- Reference: See wireframe sketch at `docs/alexandria/sources/single-list-view.png`

Tension: restricting task entry to Single List View only is deliberate friction — you must tap into a person's column before you can add a task. This keeps the dashboard ambient and read-only, but it means task entry requires an extra navigation step. That friction is the point: it prevents impulsive task creation from the overview surface and keeps the Dashboard View in passive monitoring mode.

## WHEN: Timeline

V1 core screen. No predecessor. Design TBDs from wireframes are now resolved: emoji sits between checkbox and task text; 100% celebration is a simple warm visual treatment (iterated post-v1); voice entry uses device-level dictation, no in-app mic button.

## HOW: Implementation

### Behavior

Layout (top to bottom):
- WeDo branding (top-left) + Back/X button (top-left below branding)
- Settings (top-right, persistent)
- Day Navigation bar
- Completion ring + person name (centered, larger than dashboard)
- Task list: each row is checkbox + emoji + task text, larger spacing than dashboard
- Add Task button at bottom (large, accessible) — opens a text field; user types or uses device-level speech-to-text (iOS dictation); no in-app mic button

Tap anywhere on a task row → toggles completion state (done ↔ not-done).

Tasks on past days can be toggled (catch-up entry is supported).

Tasks on tomorrow (one day forward) can be toggled.

### Examples

- Moriah has 4 tasks; she taps the third task row → checkbox fills with blue watercolor checkmark; completion ring advances to 75%
- Elizabeth taps "Add task" button → types "practice piano Monday, Tuesday, Thursday, Friday" → task is parsed by [[Capability - Add Task via Natural Language]] and added to recurring schedule
- Jess navigates back to yesterday via [[Section - Day Navigation]] in this view → Wells' tasks for yesterday appear; Jess taps 2 tasks as done for catch-up

### Anti-Examples

- Wrong: Allowing task addition from the Dashboard View — task entry is Single List View only to keep the dashboard clean
- Wrong: Showing task recurrence configuration in the UI (dropdowns, day pickers) — entry is natural language only per [[Capability - Add Task via Natural Language]]
- Wrong: Disabling toggle on past days — past-day editing is explicitly supported for catch-up
