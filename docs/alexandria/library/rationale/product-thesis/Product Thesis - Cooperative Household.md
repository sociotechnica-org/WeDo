# Product Thesis - Cooperative Household

## WHAT: The Thesis

WeDo is a cooperative household tool — the "we" in the name is the thesis: family members support each other toward collective completion, not compete against each other for individual recognition.

Counter-thesis: Individual achievement tracking (leaderboards, personal scores, comparative ranking) is more motivating than cooperative framing, especially for children.

## WHERE: Ecosystem

- Type: Product Thesis (Problem + Solution)
- Principles:
  - [[Principle - Cooperative Not Competitive]] — the principle that operationalizes this thesis in design decisions
  - [[Principle - Warmth Over Urgency]] — the emotional register that makes cooperation feel genuine rather than coerced
- Standards:
  - [[Standard - Task Vocabulary]] — vocabulary standard that forbids competitive language (points, score, leaderboard)
  - [[Standard - Streak Calculation]] — streak mechanics designed to be personal/non-comparative
- Domains:
  - [[Domain - Daily Board]] — the shared board is the physical manifestation of this thesis

## WHY: Belief

The household of six has a specific relational dynamic: two parents (Jess and Elizabeth) and four children (Micah, Moriah, Wells, Cora) with different ages, abilities, and schedules. The family's stated values center on mutual support, not competition. A leaderboard or comparative scoring system would create winners and losers within the family unit — exactly the dynamic the parents want to avoid.

Beyond values, there's a practical argument: the family members are interdependent. A parent being ill means tasks get reassigned. A child struggling needs help, not a worse score. The household functions as a unit, and the product should model that unit, not atomize it into competing individuals.

The name "WeDo" is the thesis in two syllables: these are things the family does together. The "we" is not incidental.

## WHEN: Timeline

This thesis was established at founding (v1) — it is the problem statement the product was built to answer. The name "WeDo" and the six-person household framing were present from the first design session; cooperative framing was never in question. It is permanent in the sense that shifting to competitive mechanics would mean building a different product for a different family. The thesis may be refined (e.g., cooperative mechanics could evolve with the children's ages) but its core — "support, don't rank" — is durable as long as the family's stated values hold.

## Validation Criteria

- Parents report that the board doesn't create sibling rivalry or comparison pressure
- Children naturally reference each other's boards with curiosity, not judgment ("Did Micah do his?")
- Celebration moments (100% days) feel like family wins, not individual wins
- Invalidation signal: Family members regularly ask "who has the highest streak?" with a competitive intent

## HOW: Application

### What Following This Looks Like

- Dashboard layout shows all six members in equal-width columns — no ranking, no ordering by score
- Celebration mechanics (beans, completion ring) are personal and individual, not comparative
- Skip Days are household-level decisions made by parents, not individual escapes from competition
- Streak visibility is present but framed as personal encouragement, not family ranking

### What Violating This Looks Like

- Adding a leaderboard or "top performer" highlight
- Sorting family columns by completion percentage
- Showing "Moriah has a longer streak than you" comparisons
- Designing celebrations that feel like one child won and others lost

### Decision Heuristic

When evaluating a motivation mechanic: does it make individuals feel good about their own progress, or does it make them feel good by comparison to others? The first is cooperative. The second is competitive. Build the first.
