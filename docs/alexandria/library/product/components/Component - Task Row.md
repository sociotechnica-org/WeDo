# Component - Task Row

## WHAT: Definition

Task Row is the UI component that renders a single Task within a Person's list — a sketched checkbox, an emoji identifier, and the task text. It is the primary interactive element in both Dashboard View (tap to open Single List View) and Single List View (tap to toggle completion). Task Rows use watercolor-wash completion styling, not standard OS checkboxes.

## WHERE: Ecosystem

- Parent section:
  - [[Section - Single List View]] — primary context; larger size, more spacing
  - [[Section - Dashboard View]] — compact size within Person Columns
- Conforms to:
  - [[Standard - Visual Language]] — checkbox must be sketched/drawn style; completed state uses watercolor blue wash; no standard OS checkbox
  - [[Standard - Task Vocabulary]] — no text labels using off-limits terms
- Renders:
  - [[Primitive - Task]] — displays the task name, emoji, and completion state
- Enables:
  - [[Capability - Toggle Task Completion]] — tap on the row triggers this capability (in Single List View)

## WHY: Rationale

- Principle: [[Principle - Warmth Over Urgency]] — the watercolor-wash completion treatment (not a bold checkmark or alarm color) keeps the visual register warm and quiet
- Product Thesis: [[Product Thesis - Radical Simplicity]] — the row is minimal: emoji + checkbox + text, nothing more; no priority indicators, no due dates, no tags

## WHEN: Timeline

V1 core component. Emoji placement is resolved: emoji sits between the checkbox and the task text.

## HOW: Implementation

### Behavior

**Dashboard View (compact):**
- Checkbox (sketched, small) + emoji + task text on one line
- Tap row → navigates to Single List View for this Person (does not toggle)
- Completed tasks: checkbox filled with blue watercolor wash; text may show subtle treatment

**Single List View (expanded):**
- Checkbox (sketched, larger) + emoji + task text, more vertical spacing
- Tap anywhere on row → toggles completion state
- Completion change → checkbox animates to filled/empty; Completion Ring updates

### Emoji

- Required on every Task Row
- Position: between the checkbox and the task text. Layout: `[checkbox] [emoji] [task text]`
- Primary purpose: accessibility for pre-readers (Cora, age 4)
- Secondary purpose: visual warmth and fun for all family members

### Examples

- Incomplete row: empty sketched checkbox + 🎹 + "Practice piano" (normal weight text)
- Complete row: watercolor blue-filled checkbox + 🎹 + "Practice piano" (same or slightly muted)
- Cora's row: empty sketched checkbox + 🧹 + "Morning chores" — Cora identifies her task by the 🧹 emoji

### Anti-Examples

- Wrong: Using standard iOS UITableViewCell with default checkbox — must use custom sketched checkbox per [[Standard - Visual Language]]
- Wrong: Omitting emoji from any task row — emoji is required on all Tasks per accessibility decision
- Wrong: Adding priority indicators (colored dots, exclamation marks) to the row — Task Rows have no priority in WeDo
- Wrong: Showing due-date or "overdue" text on the row — Tasks are either done or not done today; there is no overdue state
