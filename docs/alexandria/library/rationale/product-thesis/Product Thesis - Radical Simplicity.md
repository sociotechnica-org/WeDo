# Product Thesis - Radical Simplicity

## WHAT: The Thesis

WeDo's constraint is its product: the deliberate absence of due dates, calendars, project management, and general-purpose task management is not a limitation — it is what makes WeDo work.

Counter-thesis: More features serve more needs; a product constrained to one use case leaves obvious value on the table and will be replaced by a richer tool.

## WHERE: Ecosystem

- Type: Product Thesis (Plank)
- Parent: [[Product Thesis - Cooperative Household]] — simplicity serves the cooperative household vision; complexity would fragment attention and undermine the shared surface
- Principles:
  - [[Principle - Constraint is the Product]] — the principle that operationalizes this thesis
- Standards:
  - [[Standard - Task Vocabulary]] — vocabulary constraints enforce simplicity at the language level
  - [[Standard - Visual Language]] — visual constraints enforce the aesthetic simplicity that reflects this thesis
- Domains:
  - [[Domain - Daily Board]] — the product domain is defined by what it excludes as much as what it includes

## WHY: Belief

WeDo is a custom personal application for one known household. It is not a market product, not a startup, not a platform. This means the usual pressures toward feature breadth (differentiation, retention, upsell, edge-case coverage) simply don't apply. The founder has the unusual freedom to build exactly what the household needs and nothing else.

The strategic bet is that ruthless narrowing produces a product with much higher quality-per-feature than a general-purpose tool. An iPad on a kitchen counter that shows today's household tasks in a beautiful, glanceable format does its job better than Todoist does the same job — not because it has more features, but because it has exactly the right ones.

Practically: complexity in a family tool has real costs. Children shouldn't need to learn a UI. Parents shouldn't need to configure rule sets. The product should be immediately legible to a 4-year-old (with emoji) and a 40-year-old without any instruction.

## WHEN: Timeline

This thesis was established at founding (v1), driven by the explicit decision to build a custom personal tool rather than a market product. The constraint-as-feature stance was articulated early: the founder consciously rejected the gravity toward feature breadth that typically affects software projects. It is permanent as a stance, though specific constraints (e.g., "v1 is recurring tasks only") may loosen in later versions as household needs evolve. The thesis does not preclude adding features; it requires that each addition pass the "serves this household today" test before it is built.

## Validation Criteria

- New household members (including young children) understand the board without explanation
- Feature requests from family are met by "we don't do that" without the family feeling underserved
- The product has been in daily use for 6 months with no demand for calendar integration, project management, or due dates
- Invalidation signal: Family consistently needs workarounds for a capability WeDo doesn't have

## HOW: Application

### What Following This Looks Like

- No calendar view, no due dates, no multi-day planning
- Recurring tasks only in v1 (no one-off tasks, no project tasks)
- Settings are minimal: add/remove people, configure task schedules
- Entry is frictionless (natural language, tap to toggle) not configurational

### What Violating This Looks Like

- Adding a "projects" section because "some families might want it"
- Building a calendar integration because "it would be useful sometimes"
- Adding priority levels, tags, or filter/sort options to the task list
- Making the settings screen complex to "support power users"

### Decision Heuristic

For any proposed feature: "Does this serve the specific household of six on their iPad today, or does it serve a hypothetical user with hypothetical needs?" If the latter — don't build it. "We don't do that" is not a gap. It is the answer.
