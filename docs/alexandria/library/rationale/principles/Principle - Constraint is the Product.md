# Principle - Constraint is the Product

## WHAT: The Principle

WeDo's deliberate limitations — no calendar, no due dates, no project management, no rollover, today-only — are features, not gaps. "We don't do that" is the answer, not an apology.

## WHERE: Ecosystem

- Product Thesis:
  - [[Product Thesis - Radical Simplicity]] — the thesis this principle operationalizes
  - [[Product Thesis - The Day as Primary Frame]] — the Day-only constraint is the clearest example of this principle in action
- Standards:
  - [[Standard - Task Vocabulary]] — the vocabulary standard enforces constraint at the language level by banning productivity-tool terms
- Governs:
  - [[Domain - Daily Board]] — the scope of the product domain is defined by this principle
  - [[Capability - Navigate Days]] — day navigation is constrained to today ± 1 future day (not unlimited future)
  - [[System - Recurrence Engine]] — handles recurrence but explicitly does not support one-off future-scheduled tasks in v1
- Related:
  - [[Principle - Warmth Over Urgency]] — warmth and simplicity both emerge from the same anti-software-tool stance
  - [[Principle - Cooperative Not Competitive]] — cooperation and simplicity together define WeDo's character

## WHEN: Timeline

Established at founding (v1), when the decision was made to build a custom personal tool rather than a general-purpose product. The principle is permanent as a stance: every version of WeDo should pass the "does this serve this household's daily board?" test. Specific constraints enforced by this principle (day navigation limited to today ± 1, v1 recurring-tasks-only) may be loosened in later versions as needs are validated — but the principle of starting from constraint and earning every addition remains. It could only be revisited if the project scope changed fundamentally (e.g., if WeDo became a product for many households), which would change the cost-benefit calculus of breadth.

## WHY: Belief

WeDo is purpose-built for one household. General-purpose tools sacrifice depth for breadth; WeDo can sacrifice breadth for depth. The product earns its value not by doing more than other tools but by doing exactly one thing — a shared daily household board — at a quality level that general tools can't match.

Constraints also make the product cognitively lighter. A 4-year-old can use WeDo because there is nothing to configure, nothing to misunderstand, nothing to get wrong. Constraints are how you achieve that.

Every exception to constraint creates two problems: the implementation burden of the new feature, and the design burden of explaining to users when to use it versus when not to. A constrained product has neither burden.

## HOW: Application

### What Following This Looks Like

- Feature evaluation starts with "does this serve today's household board?" — if no, it's out
- The product backlog is short by design; most requests get "not in scope"
- Day navigation limited to today + one future day; no unlimited forward navigation
- V1 is recurring tasks only — no one-off tasks, even though the data model could support them

### What Violating This Looks Like

- Adding a "someday" or "backlog" section to accommodate tasks without a day
- Building calendar integration because "it would be nice"
- Allowing due-date-style future task scheduling alongside recurrence
- Growing the settings screen to accommodate edge cases the family hasn't requested

### Tensions

Trades off against: completeness. Users who want a feature that WeDo doesn't have are underserved. The family has accepted this trade-off by design — the product is a custom personal tool, not a market product expected to serve all needs.

### Test

Ask: "Is 'we don't do that' a complete answer to this feature request?" If yes — that's fine. Ship the constraint.
