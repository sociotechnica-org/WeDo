# Domain - Daily Board

## WHAT: Definition

Daily Board is the entire product domain for WeDo — the shared household task board that lives on an iPad in the family's common area and shows every person's tasks for the current day. All WeDo functionality lives within this domain. The domain is named for its core artifact: a board for today.

Cognitive mode: ambient monitoring (Dashboard View — glancing at family progress) shifting to active task execution (Single List View — toggling tasks and adding new ones).

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Task Vocabulary]] — all domain language uses canonical terms
  - [[Standard - Visual Language]] — the entire domain's visual presentation follows this spec
- Contains sections:
  - [[Section - Dashboard View]] — primary multi-person view where the board lives most of the time
  - [[Section - Single List View]] — zoomed-in single-person view for task interaction and entry
  - [[Section - Day Navigation]] — mechanism for moving between days, present on all screens
  - [[Section - Streaks and Analytics]] — secondary view showing completion history
- Core systems:
  - [[System - Recurrence Engine]] — foundational mechanism generating each day's task lists
  - [[System - Streak Engine]] — cross-cutting system tracking consecutive completion days
- Governed by theses:
  - [[Product Thesis - The Day as Primary Frame]] — the organizing thesis for the entire domain
  - [[Product Thesis - Cooperative Household]] — the relational thesis shaping how members interact
  - [[Product Thesis - Radical Simplicity]] — the scope thesis defining what this domain excludes
- Governed by principles:
  - [[Principle - Cooperative Not Competitive]] — shapes all motivation mechanics in the domain
  - [[Principle - Warmth Over Urgency]] — shapes all feedback and visual treatment
  - [[Principle - Constraint is the Product]] — defines the domain's deliberate boundaries

## WHY: Rationale

- Product Thesis: [[Product Thesis - The Day as Primary Frame]] — the domain exists to serve the daily household coordination use case, not a general task management use case
- Product Thesis: [[Product Thesis - Cooperative Household]] — six specific people (Jess, Elizabeth, Micah, Moriah, Wells, Cora) are the entire user population; the domain is shaped to their household, not a hypothetical general user

## WHEN: Timeline

V1 — new product. No predecessor domain. The domain is scoped to today-only in v1; future versions may add lightweight history views but the daily-board concept is permanent.

## HOW: Implementation

### Behavior

The Daily Board domain presents one day at a time to all household members. The default state is today. The iPad is on a common surface in landscape mode, showing all six family members' task columns simultaneously. Anyone can tap to toggle tasks. Anyone can navigate to yesterday or tomorrow. Anyone can drill into a single-person view to add tasks.

### Examples

- Family morning routine: iPad shows today's board; each person checks off their morning tasks as they complete them; parents glance at the board to see household progress
- Adding a task: Jess taps Micah's column → Single List View → taps "Add task" → speaks or types "practice piano Monday, Tuesday, Thursday, Friday" → task appears in Micah's recurring schedule
- Catch-up entry: Elizabeth realizes she forgot to mark yesterday's tasks as done → navigates back one day → toggles the completed tasks

### Anti-Examples

- Wrong: Building a calendar view within this domain — the domain is today-only by design
- Wrong: Adding a "projects" or "backlog" section — the domain covers only day-scheduled tasks
- Wrong: Supporting task assignment between people — tasks belong to persons; this is not a delegation tool
