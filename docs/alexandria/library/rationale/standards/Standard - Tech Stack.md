# Standard - Tech Stack

## WHAT: Definition

Tech Stack specifies the canonical technology choices for all WeDo implementation. Every system, worker, and UI component must use these choices; deviations require an explicit decision record explaining why. The stack is Cloudflare-native end-to-end: Workers (Hono framework) for compute, D1 for persistence, Durable Objects for real-time coordination, React + React Router v7 + Tailwind CSS for UI, and the Anthropic API (Sonnet 4.6) for AI. The aesthetic layer uses custom CSS/Canvas for watercolor and letterpress rendering — Tailwind handles layout only.

## WHERE: Ecosystem

- Implements:
  - [[Principle - Constraint is the Product]] — the single-platform Cloudflare constraint is deliberate; committing to one platform eliminates entire categories of decision-making and forces a coherent, composable stack rather than a patchwork of services
- Conforming:
  - [[System - Real-Time Sync]] — must use Cloudflare Durable Objects with Hibernatable WebSockets
  - [[System - Data Store]] — must use Cloudflare D1 (SQLite) with Drizzle ORM
  - [[System - NL Task Parser]] — must use Anthropic API (Sonnet 4.6) called via `fetch()` from Worker; no Agents SDK in v1
  - [[Standard - Visual Language]] — the aesthetic layer (watercolor, letterpress) is implemented with custom CSS/Canvas; Tailwind covers layout only; no UI component library for the art layer
  - [[Standard - Project Structure]] — directory structure enforces this stack's layer boundaries
- Related:
  - [[Product Thesis - Radical Simplicity]] — single-platform Cloudflare stack eliminates operational complexity; no multi-cloud wiring, no infrastructure decisions per system
  - [[Standard - Engineering Methodology]] — the HARNESS methodology governs how this stack is used in an AI-assisted development workflow

## WHY: Rationale

- Principle: [[Principle - Constraint is the Product]] — the single-platform Cloudflare choice is a deliberate constraint; Workers + DO + D1 compose cleanly because they share one deployment and billing model; accepting this constraint eliminates multi-cloud wiring and keeps operational complexity at household scale
- Product Thesis: [[Product Thesis - Radical Simplicity]] — going all-in on one platform (Cloudflare) means Workers + DO + D1 compose cleanly with no glue code; the cost is $5–10/month for a personal family application; complexity and cost are both at household scale
- Driver: No authentication in v1. The household is trusted; all six persons share the same session. This eliminates an entire category of infrastructure (auth service, session management, JWT rotation) that would be required on a multi-tenant stack.
- Driver: Edge-native execution. Workers and D1 run at Cloudflare edge nodes. For an always-on ambient display in a home, edge latency is meaningfully better than a cold-starting serverless function or a distant origin server.

## WHEN: Timeline

Established v1. The Cloudflare all-in decision is stable for the life of v1. Individual component choices (e.g., Hono version, React Router v7) may update with semver, but the platform choice is settled.

Future consideration: Agents SDK integration when conversational assistant capabilities are added (referenced in [[System - NL Task Parser]]). This is additive, not a stack change.

## HOW: Specification

### Runtime

| Choice | Rationale |
|--------|-----------|
| Cloudflare Workers | Edge compute; co-located with D1 and DO; no cold-start penalty at ambient display usage patterns |
| Hono framework | Lightweight, typed, ergonomic routing on Workers; matches the simplicity constraint |

### Frontend

| Choice | Rationale |
|--------|-----------|
| React | Component model fits the column/row/ring UI structure |
| React Router v7 | Full-stack routing with Cloudflare Vite plugin integration |
| Tailwind CSS | Layout and spacing utility; does NOT handle the art layer |
| Cloudflare Vite plugin | First-class Workers + DO integration in the dev and build pipeline |
| Custom CSS/Canvas | Watercolor washes, letterpress typography, sketched elements — the aesthetic from [[Standard - Visual Language]] requires custom rendering, not a component library |

### Database

| Choice | Rationale |
|--------|-----------|
| Cloudflare D1 (SQLite) | Source of truth; edge-native; correct scale for a single-family app |
| Drizzle ORM | Type-safe schema and queries; migrations via Drizzle Kit |

### Real-Time

| Choice | Rationale |
|--------|-----------|
| Cloudflare Durable Objects | One DO per family; single-threaded actor eliminates race conditions; persistent coordination hub |
| Hibernatable WebSockets | Persistent connections for ambient iPad display; survives idle without burning connection quota |

### AI

| Choice | Rationale |
|--------|-----------|
| Anthropic API (Sonnet 4.6) | Natural language task parsing via `tool_use` for structured output; called via `fetch()` from Worker |
| No Agents SDK in v1 | Stateless single-call pattern is sufficient for v1 task entry; Agents SDK is a v2+ consideration |

### Cost Model

~$5–10/month for a single household. Workers free tier covers the request volume; D1 storage is negligible for household-scale data; DO usage is minimal.

### Anti-Examples

- Wrong: Adding a separate authentication service — no auth in v1; trusted household
- Wrong: Using a UI component library (e.g., shadcn, MUI) for the visual art layer — the letterpress/watercolor aesthetic requires custom rendering per [[Standard - Visual Language]]
- Wrong: Calling the Anthropic API from the UI/browser — API keys must stay server-side; all AI calls originate from Workers
- Wrong: Using a different AI provider or model without a decision record — Anthropic API (Sonnet 4.6) is the specified choice
- Wrong: Splitting onto multiple cloud platforms without justification — single-platform Cloudflare is the deliberate constraint
