# 004. Use Anthropic API (Sonnet 4.6) for Natural Language Task Parsing

Date: 2026-04-07

## Status

Accepted

## Context

Users create tasks by typing natural language descriptions: "practice piano Monday Tuesday Thursday Friday," "help with dinner on weekdays," "morning chores every day." These must be parsed into structured `schedule_rules` JSON for storage in D1 (see ADR 003) and consumption by the Recurrence Engine.

Options: hand-written regex/parser, a smaller fine-tuned model, a rule-based NLP library, or a frontier model API. Natural language recurrence input is inherently ambiguous — "the Wednesday Micah has school" or "every day except Sunday" require semantic understanding that rule-based approaches handle poorly.

The goal is a clean product surface where users never see a recurrence-rule UI — the language is the interface.

## Decision

A stateless agentic call to the Anthropic API (Sonnet 4.6) from a Cloudflare Worker, using `tool_use` to enforce structured output. The `tool_use` tool defines the exact `schedule_rules` schema; the API cannot return free text — it must call the tool with schema-conforming arguments.

The call pattern: one input string in, one structured record out. No session state, no conversation history, no Agents SDK in v1. The service layer invokes the API, validates the response against a Zod schema, and returns the structured result for D1 write.

The API also returns a suggested emoji for the task, which eliminates a separate UI step.

## Consequences

**Easier:**
- Frontier model quality handles ambiguous and colloquial recurrence input without building custom NL parsing
- `tool_use` provides a schema correctness guarantee — the API cannot return malformed output; Zod validation is a safety net, not the primary guard
- Stateless single-call design means no session management, no conversation state, no cleanup
- The `schedule_rules` schema can evolve; the prompt and tool definition change without touching the data model
- Emoji suggestion from the same call removes a separate product decision point

**Harder:**
- Depends on Anthropic API availability; a network or API outage blocks task creation
- Per-call cost; usage is low (tasks are created occasionally, not continuously), but it is not zero
- API key must be kept server-side; the call must originate from a Cloudflare Worker, never from the browser (see Standard - Tech Stack anti-examples)
- Using a specific model version (Sonnet 4.6) creates a pin that may need updating as Anthropic deprecates versions

**Future:** The Agents SDK can add a conversational assistant layer ("what didn't get done this week?") without changing the data model or the v1 stateless parser. The v1 design does not preclude this; it defers it.

See ADR 001 for the Cloudflare Worker execution context. See ADR 003 for how `schedule_rules` is stored in D1.
