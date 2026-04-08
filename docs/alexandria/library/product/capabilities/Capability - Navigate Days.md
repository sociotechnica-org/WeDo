# Capability - Navigate Days

## WHAT: Definition

Navigate Days is the capability that moves the board's displayed Day forward or backward, triggering the Recurrence Engine to materialize the correct task list for the target Day. Forward navigation is limited to one day (tomorrow). Backward navigation is unlimited through history. This capability is available on both Dashboard View and Single List View via the persistent Day Navigation bar.

## WHERE: Ecosystem

- Performed in:
  - [[Section - Day Navigation]] — the UI section that provides navigation controls
  - [[Section - Dashboard View]] — navigation bar present here
  - [[Section - Single List View]] — navigation bar present here
- Conforms to:
  - [[Standard - Task Vocabulary]] — the day display uses canonical term "Day"; date labels use warm WeDo typography
  - [[Standard - Visual Language]] — navigation arrows and date display must follow letterpress/stationery style
- Triggers:
  - [[System - Recurrence Engine]] — each navigation event triggers re-evaluation of task list for the target Day
- Affects:
  - [[Primitive - Day]] — the currently viewed Day changes
  - [[Capability - Toggle Task Completion]] — toggle behavior adapts to the day type (today / past / tomorrow)

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — navigation moves between Day containers; the Day is still the frame even when viewing history
- Principle: [[Principle - Constraint is the Product]] — forward navigation is constrained to one day; unlimited future planning is explicitly excluded

## WHEN: Timeline

V1 core capability. Navigation constraint (one day forward) established by founder decision. Calendar picker was considered and rejected — arrow navigation only per [[Principle - Constraint is the Product]].

## HOW: Implementation

### Behavior

- Left arrow: navigate one day back; always enabled; no minimum limit
- Right arrow: navigate one day forward; enabled only when viewing today; disabled when viewing tomorrow
- No calendar picker, no jump-to-date — arrow taps only
- Default on app launch: always today
- URL/state: current viewed Day is persisted in app state; navigating away and returning should restore the last viewed day (or default to today)

### Examples

- User on today (Monday) → taps left arrow → Sunday loads; taps left again → Saturday loads; continues back through history
- User on today → taps right arrow → tomorrow loads; right arrow becomes disabled/grayed
- User on tomorrow → taps left arrow → today loads; right arrow becomes enabled again
- User wants last Tuesday → taps left arrow repeatedly until that date appears

### Anti-Examples

- Wrong: Enabling right arrow when already on tomorrow — maximum forward is one day per [[Principle - Constraint is the Product]]
- Wrong: Hiding navigation on Single List View — navigation must persist on both screens per wireframe spec
- Wrong: Adding a calendar picker or jump-to-date shortcut — arrow navigation only per [[Principle - Constraint is the Product]]
