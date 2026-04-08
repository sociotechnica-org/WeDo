# Founder Wireframes & Visual Direction — 2026-03-20

Source type: Wireframe sketches + solicitation prompt responses
Context: Gap analysis solicitation for Prototypes/Mockups (4.3) and Design System (4.1)

## Wireframes Provided

Two wireframe sketches were provided as images during conversation. They use a hand-drawn / letterpress style that represents the intended visual direction, not just placeholder art.

### Dashboard View Wireframe

Layout:
- Equal-width columns, side by side, one per family member
- Columns auto-shrink to fit up to 6 members
- Top-left: "WeDo" branding
- Top-right: "Settings" link
- Each column has: completion ring + member name at top, then task list below
- Tasks are: checkbox + task text (emoji planned but not shown in wireframe)
- Checked tasks show a blue/filled checkbox with checkmark
- Completion ring next to name shows progress (partial fill proportional to tasks completed)
- Large amount of whitespace below task lists — intentional, not placeholder

### Single List View Wireframe

Layout:
- Full screen expansion of one member's column
- "< Back" button top-left (below "WeDo")
- "Settings" persistent top-right
- Centered: completion ring + member name (larger than dashboard)
- Tasks listed below, larger and more spaced out than dashboard
- Same checkbox + text format, checked items have blue checkmarks
- Bottom of screen: big "Add task" button (accepts plain text input)

### Day Navigation (applies to both views)

- Top of screen, above member content
- Left arrow (backwards) on far left
- Right arrow (forwards) on far right
- Today's date centered between the arrows
- Calendar picker available to quickly jump between dates

### Emoji on Tasks

- Emoji on every task is still planned
- Position relative to checkbox/text: "emoji on tasks for now" — exact placement TBD
- Primary purpose: accessibility for pre-readers (Cora, age 4) + fun for everyone

### Adding Tasks

- Happens in Single List View only (not dashboard)
- Big "Add task" button at bottom of the screen
- Accepts plain text input
- Voice entry mentioned in earlier sessions but not shown in wireframes — status TBD

### 100% Completion

- Not specified in wireframes
- The completion ring fills proportionally as tasks are completed
- What happens at 100% (celebration, color change, animation) is still TBD

## Visual Direction

Overall feel: **letterpress handwritten notes, subtle watercolor highlights and opacity**

Key implications:
- Typography: hand-drawn / handwritten style, NOT standard system fonts
- Checkboxes: sketched/drawn style, not standard UI checkboxes
- Color application: watercolor washes with varying opacity, not flat solid fills
- The blue on checked tasks should feel like a watercolor highlight, not a UI accent color
- Translucency and layering rather than hard edges and borders
- This is a physical stationery / art aesthetic, explicitly NOT a standard UI toolkit look
- Aligns with Aesthetic - Ambient Presence ("art in the space")
- Aligns with Anti-Pattern Catalog ("no harsh, software-like appearance")

## Additional Product Decisions (from solicitation session)

### Recurring Tasks Only (for now)
- V1 only handles recurring-type tasks (daily/weekly scheduled tasks)
- The underlying data model should be robust, complete, and standard — design for future task types even though they're not exposed yet
- UI won't show much about recurrence configuration for now — keep it simple on the surface
- This is a "simple surface, rich foundation" decision: don't limit the data model to match the v1 UI

### Market Requirements
- The founder did not provide external validation beyond personal family experience
- This is accepted as sufficient for v1 — personal-scale product built for one family first
- Treat the 4 Need cards as founder-observed problems, not research-backed requirements

## Open Questions from Wireframes

1. Exact emoji placement relative to checkbox and task text
2. What happens visually at 100% completion (ring behavior, celebration)
3. Voice entry affordance — mic button location in Single List View
4. Streak indicator — does it appear on dashboard at all?
5. Calendar picker style — modal? Dropdown? Inline?
6. How does "Add task" button interact with voice entry? Same button, or separate?
