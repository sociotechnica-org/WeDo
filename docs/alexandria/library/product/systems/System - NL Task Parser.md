# System - NL Task Parser

## WHAT: Definition

NL Task Parser is the system that converts a user's natural language task description into structured schedule rules. It calls the Anthropic API (Sonnet 4.6) from a Cloudflare Worker, receives a structured `schedule_rules` JSON object and emoji suggestion via `tool_use`, and returns the result to the calling service. The call is stateless — one input string in, one structured record out. No session state, no conversation history, no Agents SDK in v1.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Tech Stack]] — uses Anthropic API (Sonnet 4.6) called via `fetch()` from a Cloudflare Worker, as specified; no Agents SDK in v1
  - [[Standard - Project Structure]] — parser invocation lives in `src/services/`; Worker route that triggers it lives in `src/workers/`
- Dependents:
  - [[Capability - Add Task via Natural Language]] — this capability is the product-layer expression of what this system provides; the user-facing NL entry flow calls this system
  - [[System - Data Store]] — the structured output of this system is written to `tasks.schedule_rules` in D1
- Dependencies:
  - [[Primitive - Schedule]] — the output of this system produces the structured recurrence rules that constitute a Schedule
  - [[Primitive - Task]] — the output feeds into Task creation; emoji suggestion populates `tasks.emoji`
- Related:
  - [[System - Recurrence Engine]] — reads the `schedule_rules` JSON this system produces to materialize tasks on each day

## WHY: Rationale

- Product Thesis: [[Product Thesis - Radical Simplicity]] — Strategy Bet 1 (natural language recurrence control) requires a parsing layer that can handle ambiguous human input without exposing a recurrence-rule UI; the Anthropic API handles ambiguity resolution so the product surface stays clean
- Capability: [[Capability - Add Task via Natural Language]] — the product capability only works if there is a reliable parser behind it; this system is the technical realization of that capability bet
- Driver: `tool_use` enforces structured output — the API cannot return free text; it must call the defined tool with the schema-conforming arguments. This is the correctness guarantee that makes the parser safe to use for schema writes.

## WHEN: Timeline

V1 system. Stateless single-call design is a v1 scoping decision.

Future: Agents SDK integration for conversational assistant capabilities (e.g., "what didn't get done this week?"). The v1 stateless design does not preclude this; the parser would become one tool in a broader agent harness.

Open question: voice input to this parser (mic input → text → parser) is referenced in product thinking but not in v1 scope.

## HOW: Implementation

### Call Pattern

```
User types: "practice piano Monday, Tuesday, Thursday, Friday"
                  ↓
Worker receives POST /tasks (person_id, raw_input)
                  ↓
Service calls Anthropic API (Sonnet 4.6) with tool_use definition
                  ↓
API returns tool_use call with structured arguments:
  {
    title: "Practice piano",
    schedule_rules: { days: ["monday","tuesday","thursday","friday"] },
    emoji: "🎹"
  }
                  ↓
Service validates output against Zod schema
                  ↓
D1 write: new tasks row with schedule_rules JSON, emoji
```

### Tool Definition

The `tool_use` tool accepts:
- `title` — cleaned task display name
- `schedule_rules` — structured recurrence object (day-of-week array, or named pattern like `weekdays`, `daily`)
- `emoji` — single suggested emoji for the task

The tool definition is the contract between this system and [[System - Recurrence Engine]]. Both must agree on the `schedule_rules` schema.

### Ambiguity Handling

The API resolves ambiguity before returning structured output. For edge cases (e.g., "the Wednesday Micah has school"), it may use a clarification prompt returned in the tool arguments. The Worker returns this clarification request to the UI for the user to resolve before committing the task.

### Examples

- Input: "morning chores every day" → `schedule_rules: { pattern: "daily" }` → Recurrence Engine applies Sunday exclusion at evaluation time
- Input: "help with dinner on weekdays" → `schedule_rules: { days: ["monday","tuesday","wednesday","thursday","friday"] }`
- Input: "Saturday yard work" → `schedule_rules: { days: ["saturday"] }`, emoji: "🌿"

### Anti-Examples

- Wrong: Parsing natural language with hand-written regex — the Anthropic API handles ambiguity that rule-based parsing cannot
- Wrong: Using the Agents SDK or multi-turn conversation for v1 task creation — stateless single call only in v1
- Wrong: Allowing free-text JSON output from the API — `tool_use` enforces structured output; free-text bypasses the schema guarantee
- Wrong: Calling the Anthropic API from the UI layer — the call originates from a Cloudflare Worker; API keys never reach the client
