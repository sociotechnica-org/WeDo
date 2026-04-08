# We Do — Foundation Source Material

**Status:** Raw source. For card-building use only. Do not treat as canonical documentation.
**Date captured:** 2026-04-07
**Coverage:** Foundation knowledge areas 1.1, 1.2, 2.2, 3.2, 3.5

---

## 1.1 Product Vision

We Do is a shared family daily task board designed for a household of approximately six people: Jess, Elizabeth, Micah, Moriah, Wells, and Cora. It is not a to-do list. The distinction matters and shapes every design decision: We Do is a daily coordination surface where everyone in the household can see what needs doing today, track progress across the day, and celebrate completion together as a family unit.

The core organizational unit is the Day, not the task. Everything is framed around today: what is happening now, who is doing what, how the household is moving through this day together. This is a deliberate departure from task-management thinking, where tasks accumulate, stack, and carry forward.

The emotional and relational tone is explicitly cooperative. The product vision centers on supporting and building each other up, working toward mutual good. It is not about celebrating individual winners or ranking family members against each other. The name "We Do" carries this meaning directly: these are things we do together, things we do to support each other, things we accomplish as a group. The "we" is not incidental — it is the product thesis.

---

## 1.2 Product Strategy

We Do is being built as a custom personal application for a small, known user base. It is not designed for scale, for a general audience, or for a market. This shapes the strategic posture significantly: technical simplicity is a feature, not a constraint to overcome. The right amount of complexity is as little as possible.

Three strategic bets define the product:

**Bet 1: Natural language control over flexible recurrence rules.** Scheduling recurring tasks should be expressible in plain language — "every weekday," "Monday, Wednesday, Friday," "the Wednesday Micah has school." And when life happens — travel, illness, irregular weeks — the rules should be easy to override or fudge without breaking the schedule logic permanently. Rigid recurrence (like a calendar) is the wrong model; expressive recurrence that accommodates real life is the goal.

**Bet 2: Whole-family-at-a-glance shared visibility.** We Do is not a collection of individual task lists that happen to live in the same app. It is a single family surface. The ideal display is a shared iPad mounted or placed in a common area, showing the whole household's day at once. The family glances at it together. Visibility is collective by design.

**Bet 3: Radical simplicity as the product.** There is no calendar. There are no due dates. There is no future-day planning. There is no project management. Everything is about today. The constraint is not a limitation — it is the product. Narrowing ruthlessly to a single day creates the aesthetic and functional character that makes We Do worth building.

The explicit trade-offs: We Do sacrifices generality, scale, and feature breadth in exchange for family-specific fit and aesthetic quality. It will never be the right tool for a business, a team, or a general-purpose user. That is fine. It is built to be exactly right for one household.

---

## 2.2 Noun Vocabulary

These are the core nouns of the We Do domain, drawn from elicitation sessions. They define the conceptual vocabulary that all cards, interfaces, and technical decisions should use consistently.

**Person.** A family member with their own daily list within the shared board. Each person has tasks that belong to them, visible to everyone.

**Task.** A recurring item with rules. A task specifies: which days it appears, for which person, what happens if it is missed (rollover behavior), and whether it carries a reward. Critically, a task in We Do is not a traditional to-do item — it is not something you add once and check off. It recurs according to a schedule and resets each applicable day.

**Day.** The primary frame. Everything in We Do lives inside a day. You view one day at a time. There is no multi-day view, no week view, no calendar. The day is the container.

**Schedule.** The recurrence rules governing when a task appears. Schedules specify which days of the week a task is active, for which person, and any exceptions. Known schedules from the household context include: Monday through Saturday for chores, Monday through Friday for school and work tasks, a special Wednesday rule for kids who have in-person school (as distinct from other Wednesdays), and no tasks at all on Sunday (observed as Sabbath).

**Streak.** A count of consecutive days at or above a completion threshold — likely around 90%. Streaks are visible and meant to be motivating. They are explicitly not punitive: missing a day should not produce guilt or harsh feedback, it simply ends the streak and a new one can begin.

**Reward.** Something tied to completion percentage or to specific task completion. Rewards accumulate. Children earn rewards for hitting their tasks. The reward system is meant to be encouraging and age-appropriate, not gamified in a competitive sense.

**Skip Day.** A snoozed day that does not count against streaks. Intended for travel, illness, unusual household circumstances, or any day where normal expectations are suspended. Skip Days are a first-class concept — the ability to say "today doesn't count" is a feature, not a workaround.

The metaphor family for We Do is domestic, collaborative, and warm. Not productivity-tool language. Not project management language. The vocabulary should feel like it belongs in a home, not an office.

One important behavioral note on recurrence: tasks do not stack. If a task was missed yesterday, it does not appear twice today. Each day presents its own tasks fresh. This is a deliberate design choice that keeps the day's surface clean and prevents the guilt-accumulation dynamic common in to-do apps.

---

## 3.2 Emotional and Aesthetic Goals

We Do should be beautiful and subtle. The aesthetic aspiration is closer to ambient art than to software. It should be possible for the display — an iPad in a common living area — to sit in the background of daily life without demanding attention. Family members glance at it throughout the day rather than "opening" and "using" it as a tool.

The visual language should feel warm. No reds. No harsh colors. No colors associated with urgency, failure, or alarm. The palette and typography should be quiet and considered — something that fits on a wall alongside other objects in a home.

Celebration of completion should feel warm and communal, not gamified or competitive. When the family has a good day, the response should feel like a quiet acknowledgment of something done together, not a points tally or a leaderboard result. The emotional register is: "We did it" rather than "You won."

The product should not feel technical. A parent or child should be able to glance at it and understand it immediately without any learning curve. The interface should disappear in favor of the information it carries.

---

## 3.5 Anti-Patterns

Understanding what We Do is not is as important as understanding what it is. The following anti-patterns should be treated as explicit design constraints — if a proposed feature or decision pushes toward any of these, that is a signal to reconsider.

We Do is not a to-do list app. It is not Things, not Todoist, not Reminders, not any variant of the capture-organize-review workflow. Tasks in We Do recur and reset; they do not accumulate.

We Do is not complicated or feature-rich. Complexity is not a selling point. Every feature should justify its existence by serving the specific household use case, not by rounding out a feature matrix.

We Do is not a project management tool. There are no projects, no milestones, no dependencies, no sub-tasks.

We Do is not a calendar app. There is no calendar integration. There is no scheduling tasks to future days. There are no due dates. The constraint of today-only is not a missing feature — it is a core design choice.

We Do is not competitive. It does not rank family members against each other. It does not produce winners and losers. All motivation mechanics should be cooperative or personal, not comparative.

We Do is not harsh or demanding. No red indicators. No guilt mechanics. No "you failed" language or visual treatment. If someone does not complete their tasks, the response is neutral or gently encouraging, never punitive.

We Do is not a general-purpose productivity tool. It serves one household with a known set of people, schedules, and values. Decisions that would make it more general will usually make it worse for its actual users.

Entry must be extremely easy. Acceptable entry methods include tap, voice, and text paste from tools like Obsidian. Friction at the point of entry undermines the whole premise.

The constraint is the product. "We don't do that" is not a gap — it is the answer.

---

*End of foundation source material.*
