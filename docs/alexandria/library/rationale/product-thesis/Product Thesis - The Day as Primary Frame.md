# Product Thesis - The Day as Primary Frame

## WHAT: The Thesis

WeDo organizes everything around the Day, not the task — the day is the container, and tasks exist inside it, not the other way around.

Counter-thesis: Task-centric organization (like traditional to-do apps) is more flexible and scales to any time horizon. Day-centric framing is artificially limiting.

## WHERE: Ecosystem

- Type: Product Thesis (Plank)
- Parent: [[Product Thesis - Cooperative Household]] — the Day frame enables the family to coordinate around a shared present, which is the vehicle for the cooperative vision
- Principles:
  - [[Principle - Constraint is the Product]] — the Day frame is the primary constraint; this thesis generates that principle
- Standards:
  - [[Standard - Task Vocabulary]] — the canonical term "Day" and its definition as "primary frame" derive from this thesis
  - [[Standard - Streak Calculation]] — streak logic is day-gated, not task-gated, because days are the frame
- Domains:
  - [[Domain - Daily Board]] — the entire product domain is organized around this thesis

## WHY: Belief

The Day-as-frame thesis emerges from a specific family coordination problem: not "what tasks need doing eventually?" but "what is our household doing today?" These are fundamentally different questions. Task-centric tools answer the first question well — they give you organized lists, priorities, due dates. But a family common-area display needs to answer the second: right now, on this day, who is doing what, and how are we doing?

Framing the Day as primary produces several downstream benefits:
1. **No accumulation anxiety.** When the day ends, it ends. Nothing rolls over. The next morning the board resets fresh. This prevents the guilt-stack dynamic that makes to-do apps feel oppressive.
2. **Natural recurrence.** Household tasks (chores, school routines) are inherently rhythmic. Day-framing makes recurrence the default model, not an add-on feature.
3. **Shared present.** Six people can all be "on the same day" simultaneously in a way they can't be on the same task list. The Day is the shared surface.

## WHEN: Timeline

This thesis was established at founding (v1) as the organizing principle for the entire product. It is not a v1 constraint to be relaxed later — the Day-as-frame concept is WeDo's identity; removing it would make WeDo a different product. No predecessor: WeDo was designed from the start against task-centric tools, so the Day-frame commitment was explicit before any code was written. It may be worth revisiting if the household genuinely needs multi-day planning affordances in a future version, but that would represent a product pivot, not a feature addition.

## Validation Criteria

- Family members refer to the board as "today's board" not "our list"
- No one asks "where are my tasks from last week" — the day boundary feels natural
- Removing rollover (v1 decision) does not feel like a missing feature to the family
- Invalidation signal: Family regularly wants to see tasks across multiple days in a single view

## HOW: Application

### What Following This Looks Like

- Dashboard shows one day at a time; previous/next day navigation is present but the default view is always today
- Tasks recur — they don't get "moved" or "rescheduled" to a future day
- The app has no calendar view, no multi-day overview, no project timeline
- Completion is evaluated per-day per-person; there is no lifetime task completion count shown by default

### What Violating This Looks Like

- Adding a "backlog" or "someday" list — tasks without a day belong in a different product
- Allowing tasks to be scheduled to specific future dates (not recurrence patterns)
- Showing a week view or calendar grid alongside the daily view
- Implementing rollover so yesterday's undone tasks appear today

### Decision Heuristic

When a feature request implies seeing tasks across multiple days at once, or implies carrying tasks forward from one day to the next — that is a sign the feature belongs in a different product. Ask: "Does this serve what we're doing today, or does it serve accumulation?"
