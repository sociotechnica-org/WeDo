# Standard - Engineering Methodology

## WHAT: Definition

Engineering Methodology specifies the operating principles for building WeDo with AI assistance — the HARNESS framework. The core axiom: "Agent = Model + Harness." The model provides intelligence; the harness provides structure, constraints, and quality gates that keep AI-generated code coherent and the codebase healthy over time. Three pillars: Context Engineering (the repo is the single source of truth for the AI), Architectural Constraint Enforcement (structural tests make layer boundaries unbreakable), and Entropy Management (automated cleanup prevents drift accumulation).

## WHERE: Ecosystem

- Implements:
  - [[Principle - Constraint is the Product]] — HARNESS enforces constraints mechanically rather than relying on convention; structural tests, pre-commit hooks, and layer boundaries are the constraints made operational; this is "constraint is the product" applied directly to engineering methodology
- Related:
  - [[Product Thesis - Radical Simplicity]] — the methodology enforces simplicity at the engineering layer; structural tests prevent accidental complexity from accumulating across AI-assisted coding sessions
  - [[Standard - Tech Stack]] — specifies the technology choices this methodology governs
  - [[Standard - Project Structure]] — specifies the directory layout and layer boundaries this methodology enforces
- Conforming:
  - [[System - Real-Time Sync]] — implemented under this methodology; structural tests enforce its layer boundaries
  - [[System - Data Store]] — implemented under this methodology; db layer enforced by dependency rule
  - [[System - NL Task Parser]] — implemented under this methodology; Worker and service layers separated per project structure
  - [[System - Recurrence Engine]] — implemented under this methodology; service layer owns recurrence logic
  - [[System - Streak Engine]] — implemented under this methodology; service layer owns calculation logic

## WHY: Rationale

- Principle: [[Principle - Constraint is the Product]] — HARNESS enforces constraints mechanically rather than relying on convention; the architecture is embedded in tests and gates that cannot be bypassed, not in documentation that can be ignored; this is the direct expression of "constraint is the product" at the engineering layer
- Driver: AI-assisted development introduces a specific failure mode: each session is context-limited and stateless. Without structural constraints, an AI model will make locally-reasonable decisions that violate global architecture over time. The harness compensates for this by encoding the architecture in automated checks that run every session.
- Driver: CLAUDE.md under 60 lines enforces compression discipline. A bloated context file gets ignored; a tight one gets read. Library cards (Alexandria) provide rich product context via Bridget briefings without polluting the always-on context.
- Driver: Pre-commit hooks and structural tests are not optional quality gates — they are the mechanism by which the human retains control over AI output. Code that fails a structural test cannot be committed; the AI cannot silently violate layer boundaries.

## WHEN: Timeline

Established v1. The HARNESS methodology is the ongoing operating model for the WeDo project, not a temporary scaffold. It applies for the life of AI-assisted development.

The methodology is itself subject to entropy management — if quality gates become noisy or unhelpful, they are updated, not disabled.

## HOW: Specification

### Pillar 1: Context Engineering

| Practice | Rule |
|----------|------|
| CLAUDE.md | Under 60 lines. Tight, always current, always read. |
| Product context | Provided via Alexandria library cards and Bridget briefings — rich context on demand, not bloating CLAUDE.md |
| Repo as truth | All architecture decisions, naming conventions, and constraints live in the repo (code, tests, this library) — not in chat history |

The AI model reads the repo. The repo must therefore be the authoritative, up-to-date source of all constraints. Comments, names, and library cards are not decoration — they are instructions.

### Pillar 2: Architectural Constraint Enforcement

**TypeScript strict mode** — `strict: true` in tsconfig. No `any`, no implicit nulls.

**Layered dependency model** — imports flow left to right only:

```
types → config → db → services → workers/realtime → ui
```

Each layer may only import from layers to its left. `ui` cannot import from `workers`. `db` cannot import from `services`. Violations break structural tests.

**Structural tests** — tests in `tests/structural/` verify layer boundaries programmatically. These tests fail CI on any import violation. They are not style checks; they are architecture enforcement.

**Custom linter rules** — ESLint rules encode golden principles (e.g., no direct D1 calls from `ui/`, no Anthropic API calls from `ui/`).

### Pillar 3: Entropy Management

Background agent tasks scan the codebase for deviations from the established patterns: dead code, stale TODOs, import boundary drift, schema-code mismatches. Findings surface for human review; they do not auto-fix production code.

The goal is continuous low-level cleanup rather than periodic large refactors. Entropy compounds; catching drift early keeps it cheap.

### Quality Gates

| Gate | Tool | When |
|------|------|------|
| Type check | `tsc --noEmit` | Pre-commit (Husky + lint-staged) |
| Lint | ESLint | Pre-commit |
| Format | Prettier | Pre-commit |
| Visual QA | Playwright (local Chrome) | Post-change; screenshots changes |
| Code review | Code-reviewer agent | Before PR |
| End-to-end tests | Playwright full suite | CI |

**Test output discipline:** Passing tests produce no output. Only failures surface. This keeps the signal-to-noise ratio high and ensures failures are impossible to miss.

### Examples

- A new Worker is added that imports from `src/ui/` → structural test fails → CI blocks merge → developer corrects the import path
- CLAUDE.md grows to 80 lines during a session → engineer compresses it back under 60 lines before committing → context discipline is maintained
- Playwright screenshot shows a completion ring using a flat solid fill instead of watercolor wash → visual QA catches the regression before it ships

### Anti-Examples

- Wrong: Disabling a structural test because it's "too strict" — the test encodes an architectural decision; change the architecture or keep the test
- Wrong: Using `// @ts-ignore` to suppress type errors — fix the type; suppression accumulates into a type-safety gap
- Wrong: Skipping pre-commit hooks (`--no-verify`) — hooks are not optional; they are the per-commit quality guarantee
- Wrong: Merging without running the Playwright suite — visual and functional regressions are invisible without it
