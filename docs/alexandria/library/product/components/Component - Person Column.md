# Component - Person Column

## WHAT: Definition

Person Column is the UI component that renders one Person's daily task list within Dashboard View — a vertical strip containing a Completion Ring, the Person's name, and their Task Rows for the day. Up to six columns are shown side by side in landscape mode. Columns auto-shrink to fit all household members. Tapping the column navigates to Single List View for that Person.

## WHERE: Ecosystem

- Parent section:
  - [[Section - Dashboard View]] — Person Columns are the primary building block of Dashboard View
- Conforms to:
  - [[Standard - Visual Language]] — column width, typography, and spacing must follow letterpress/watercolor spec; no standard OS list cell treatment
  - [[Standard - Task Vocabulary]] — Person's name is displayed as-is; no "user" or "account" labels
- Contains components:
  - [[Primitive - Streak]] — streak count displayed at the very top of each column, above the Completion Ring and person name
  - [[Component - Completion Ring]] — below the streak count
  - [[Component - Task Row]] — one per scheduled Task for this Person today
- Renders:
  - [[Primitive - Person]] — name and identity information
  - [[Primitive - Task]] — task list for this Person today (via Recurrence Engine)

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — the side-by-side equal-width column layout is the physical expression of family equality; no column is larger or more prominent than another
- Principle: [[Principle - Cooperative Not Competitive]] — columns are always in a fixed order (not sorted by completion), and no column is visually elevated above others

## WHEN: Timeline

V1 core component. Column order (which person appears in which position) is likely fixed/configured in Settings — not dynamically ranked.

## HOW: Implementation

### Behavior

- Equal-width columns: divide available landscape width by number of Persons (up to 6)
- Column structure (top to bottom): Streak count → Completion Ring → Person name → Task Rows → large intentional whitespace at bottom
- Tapping anywhere on the column → navigates to Single List View for that Person
- Columns do not sort, reorder, or resize based on completion state
- If a Person has no tasks today (rare — e.g., Sunday), column may be empty or show a quiet placeholder

### Examples

- 6 Persons → 6 equal-width columns; Cora's column has emoji-rich task rows; Jess's column has adult task rows; all columns are the same width
- Moriah's column at mid-morning: ring at 50%, 2 tasks checked, 2 unchecked; no special visual treatment for the unchecked tasks

### Anti-Examples

- Wrong: Sorting columns by completion percentage (highest left, lowest right) — violates [[Principle - Cooperative Not Competitive]]
- Wrong: Making a fully-complete column visually larger or more prominent — all columns remain equal size
- Wrong: Showing a red or amber border on a low-completion column — neutral treatment for all completion states per [[Standard - Visual Language]]
- Wrong: Allowing task addition from within the Person Column — task entry is Single List View only
