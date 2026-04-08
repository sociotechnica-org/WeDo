# Capability - Add Task via Natural Language

## WHAT: Definition

Add Task via Natural Language is the capability for creating new recurring Tasks by typing or speaking plain text — no calendar-style recurrence UI, no day-picker dropdowns. The input is parsed by the NL Task Parser (via Anthropic API) into a structured Schedule. This capability is available only in Single List View, via the "Add task" button at the bottom of the screen.

## WHERE: Ecosystem

- Performed in:
  - [[Section - Single List View]] — the only location; Add Task button at the bottom of this view
- Conforms to:
  - [[Standard - Task Vocabulary]] — any feedback or prompts use canonical terms (Schedule, Task, Person)
  - [[Standard - Visual Language]] — the Add Task button and input field must follow the letterpress/stationery aesthetic
- Creates/modifies:
  - [[Primitive - Task]] — creates new Task objects with parsed Schedule
  - [[Primitive - Schedule]] — creates Schedule from NL input
- Uses systems:
  - [[System - Recurrence Engine]] — receives parsed schedule and begins materializing the Task on matching Days
  - [[System - NL Task Parser]] — the system that calls the Anthropic API to convert natural language input into structured schedule_rules and an emoji suggestion
- Related capabilities:
  - [[Capability - Toggle Task Completion]] — sibling capability for completing tasks once created

## WHY: Rationale

- Product Thesis: [[Product Thesis - Radical Simplicity]] — Strategy Bet 1 (natural language recurrence control) means entry must be frictionless; a checkbox-per-day UI would be too complex and feel like software
- Principle: [[Principle - Constraint is the Product]] — the capability accepts natural language only; it does not expose the underlying recurrence rule structure to the user

## WHEN: Timeline

V1 core capability. Voice entry is resolved: there is no in-app voice feature and no separate mic button. The user taps "Add Task," a text field opens, and they type or dictate using device-level speech-to-text (iOS dictation / on-device speech-to-text). The resulting text is sent to the Anthropic API for parsing. One button, one text field.

## HOW: Implementation

### Behavior

1. User taps "Add Task" button in Single List View
2. A text field opens
3. User types a task description with schedule — or dictates via device speech-to-text (iOS dictation / on-device) — e.g., "practice piano Monday, Tuesday, Thursday, Friday"
4. Natural language input is processed by an agentic call to the Anthropic API (Sonnet 4.6). The AI interprets the user's plain-language description and populates the structured recurring task data model. No bespoke parsing UI — the AI handles ambiguity resolution, schedule inference, and emoji suggestion. The underlying data model is a standard recurring task model; the agentic layer is the interface for both entry and visualization.
5. Task created with that Schedule; emoji assigned (auto-suggested by the AI model)
6. Task appears immediately in this person's list on the days matching the Schedule
7. Input field closes

Ambiguous input (e.g., "the Wednesday Micah has school") is handled by the AI — it resolves ambiguity, infers intent, and may prompt for clarification in the input field before committing the task.

### Examples

- Input: "practice piano Monday, Tuesday, Thursday, Friday" → Task "Practice piano" with Schedule Mon/Tue/Thu/Fri created for Micah
- Input: "morning chores every day" → Task "Morning chores" with Schedule Mon–Sat created (Sunday excluded by system)
- Input: "help with dinner on weekdays" → Task "Help with dinner" with Schedule Mon–Fri created

### Anti-Examples

- Wrong: Showing a day-picker UI or checkbox grid for schedule selection — natural language only per Strategy Bet 1
- Wrong: Allowing task addition from Dashboard View — Single List View only; dashboard stays clean and read-only for task interaction
- Wrong: Creating a task with no Schedule — all tasks in WeDo are recurring and must have a Schedule
- Wrong: Requiring the user to also specify emoji manually — emoji should be auto-assigned (exact mechanism TBD)
