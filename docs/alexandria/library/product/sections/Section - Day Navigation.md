# Section - Day Navigation

## WHAT: Definition

Day Navigation is the persistent navigation bar that appears at the top of every WeDo screen — Dashboard View and Single List View — allowing the user to move backward through history or one day forward to tomorrow. Today is the default and is always shown centered between the navigation arrows.

## WHERE: Ecosystem

- Parent domain:
  - [[Domain - Daily Board]] — parent workspace
- Conforms to:
  - [[Standard - Visual Language]] — navigation bar styling must follow letterpress/watercolor spec; no standard OS navigation chrome
  - [[Standard - Task Vocabulary]] — uses canonical term "Day" for the time unit
- Present in sections:
  - [[Section - Dashboard View]] — appears at top of dashboard
  - [[Section - Single List View]] — appears at top of single list view
- Triggers:
  - [[System - Recurrence Engine]] — each navigation event triggers re-evaluation of task list for the target day
  - [[Capability - Navigate Days]] — the user-facing capability this section provides
- Related:
  - [[Primitive - Day]] — the time container this navigation moves between

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — the Day is the primary container; Day Navigation is the mechanism for moving between containers
- Principle: [[Principle - Constraint is the Product]] — forward navigation is constrained to one day only (tomorrow); unlimited future planning is not supported

## WHEN: Timeline

V1 core section. Navigation limits (one day forward, unlimited backward) established by founder decision in Round 2 answers. Calendar picker was considered and rejected — arrow navigation only per [[Principle - Constraint is the Product]].

## HOW: Implementation

### Behavior

Layout: Left arrow (back one day) — Today's date centered — Right arrow (forward one day).

- Left arrow: always enabled; navigates one day backward (unlimited history)
- Right arrow: enabled only when currently viewing today (navigates to tomorrow); disabled when already viewing tomorrow
- Today's date displayed in center: shows the day currently being viewed, formatted in WeDo's typographic style
- No calendar picker, no jump-to-date — if you want to see last Tuesday, tap back repeatedly
- Default state on app open: always today

Forward navigation constraint: Maximum one day into the future. Viewing more than one day forward is not supported (aligns with today-only philosophy; tomorrow is accessible for planning, but no further).

### Examples

- User on today → taps left arrow → yesterday's board loads for all persons
- User on today → taps right arrow → tomorrow's board loads (right arrow then becomes disabled)
- User on yesterday → taps right arrow → today's board loads
- User navigates 5 days back via repeated left-arrow taps → all days load correctly with historical task states

### Anti-Examples

- Wrong: Enabling right arrow when already viewing tomorrow — only one day forward is allowed per [[Principle - Constraint is the Product]]
- Wrong: Adding a calendar picker or jump-to-date shortcut — arrow navigation only; deliberate simplicity per [[Principle - Constraint is the Product]]
- Wrong: Adding a "week view" or multi-day selector to the navigation bar — day-by-day navigation only
- Wrong: Hiding day navigation on Single List View — it must persist on both screens
