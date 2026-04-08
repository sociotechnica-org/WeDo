# Standard - Task Vocabulary

## WHAT: Definition

Task Vocabulary specifies the canonical names for WeDo's core domain objects (Person, Task, Day, Schedule, Streak, Skip Day, Reward) and the terms that are explicitly off-limits. It exists so that code, UI copy, documentation, and team discussion all use the same words — preventing drift toward generic productivity-tool language that would erode WeDo's domestic identity.

## WHERE: Ecosystem

- Implements:
  - [[Principle - Constraint is the Product]] — vocabulary boundaries enforce WeDo's identity and prevent feature-creep through language drift
  - [[Principle - Cooperative Not Competitive]] — forbidden terms (points, score, leaderboard) enforce the cooperative framing at the language level
- Conforming:
  - [[Section - Dashboard View]] — all UI copy must use canonical terms
  - [[Section - Single List View]] — task entry copy, labels, and feedback must use canonical terms
  - [[Primitive - Person]] — entity name and attributes must match this vocabulary
  - [[Primitive - Task]] — entity name and attributes must match this vocabulary
  - [[Primitive - Day]] — entity name must match this vocabulary
  - [[Primitive - Schedule]] — entity name and recurrence language must match this vocabulary
  - [[Primitive - Streak]] — entity name and display copy must match this vocabulary
- Related:
  - [[Standard - Visual Language]] — visual language standard that pairs with vocabulary for full UX coherence

## WHY: Rationale

- Principle: [[Principle - Constraint is the Product]] — the vocabulary standard makes the product's identity durable. WeDo is not a to-do app; if the codebase calls tasks "todos" and people "users," the product drifts toward to-do-app patterns in every downstream decision.
- Driver: The source material explicitly defines the noun vocabulary as a design artifact. These names were chosen deliberately and carry semantic weight.

## WHEN: Timeline

Established at project start, v1. Vocabulary is stable — changes require deliberate decision, not casual refactoring.

## HOW: Specification

### Canonical Terms

| Canonical Term | Definition | Off-Limits Alternatives |
|----------------|------------|------------------------|
| Person | A family member with tasks on the board | User, member, account, player |
| Task | A recurring item with a schedule | Todo, item, chore, assignment, action |
| Day | The primary time container | Date, session, period |
| Schedule | The recurrence rules for a task | Recurrence, repeat settings, cadence |
| Streak | Consecutive 100%-completion days | Combo, chain, score, progress |
| Skip Day | A declared non-counting day | Vacation mode, pause, off day |
| Reward / Bean | External physical reward for 100% | Points, score, badge, achievement |

### App Name

- Canonical: WeDo (one word, capital W, capital D, no space)
- Wrong: We Do, wedo, WEDO, we-do

### Tone Guidance

Vocabulary tone should feel domestic and warm, not productivity-tool or gamified:

- Right: "Cora finished all her tasks" not "Cora completed 5/5 objectives"
- Right: "Take a Skip Day" not "Pause your streak" or "Enable vacation mode"
- Right: "WeDo" in all interface copy — never "the app" in UI-facing text

### Anti-Examples

- Wrong: Labeling the completion circle "Progress Score" — use "completion" language
- Wrong: Calling a family member a "user" in UI copy — they are a Person
- Wrong: Calling a recurring task a "to-do" or "todo" anywhere in code or UI
- Wrong: Referring to the reward as "points" — beans are physical, external, and not a points system
- Wrong: Writing the product name as "We Do" (with space) in any interface copy or documentation
