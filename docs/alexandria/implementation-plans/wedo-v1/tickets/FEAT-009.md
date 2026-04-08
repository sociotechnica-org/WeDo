---
id: FEAT-009
title: "NL task entry via Anthropic API"
outcome: O-4
tier: should
enabler: false
blocked-by: [FEAT-006, FEAT-007]
blocks: []
cards: [Capability - Add Task via Natural Language, System - NL Task Parser, Primitive - Schedule]
---

## Motivation

Natural language task entry is one of WeDo's three strategic bets. The user types "practice piano Monday Tuesday Thursday Friday" and a task appears with the correct schedule and emoji. This replaces the complexity of a recurrence picker with the simplicity of plain language.

## Description

Implement the NL task entry flow:
- "Add task" button in Single List View opens a text input field
- User types a natural language description (or dictates via iOS keyboard)
- On submit, send the text to a Hono API route on the Worker
- Worker calls Anthropic API (Sonnet 4.6) with the task description and the `create_task` tool definition
- Tool definition constrains output to: title, emoji, schedule_rules (with DayCode enum)
- Validate the API response with the Zod schema
- Write the new task to D1 via the DO
- Broadcast the new task to all connected clients
- New task appears immediately in the correct person's column on the dashboard

## Context

See [[Capability - Add Task via Natural Language]] for the full behavior spec. See [[System - NL Task Parser]] for the API call flow and tool definition. See ADR 004 for the Anthropic API rationale. See ADR 005 for the schedule_rules format. The Anthropic API key is stored as a Worker secret. See release.md for full plan context.

Anti-patterns:
- Do NOT call the Anthropic API from the browser — server-side only (Worker)
- Do NOT build a recurrence picker UI — natural language is the only input modality
- Do NOT skip Zod validation on the API response — trust but verify

## Acceptance Criteria

- [ ] "Add task" button opens text input in Single List View
- [ ] Submitting text calls the Anthropic API via a Worker route
- [ ] API returns structured task data (title, emoji, schedule_rules) via tool_use
- [ ] Response is validated against the Zod schema
- [ ] Valid task is written to D1 and broadcast to all clients
- [ ] New task appears on the dashboard for the correct days
- [ ] Ambiguous input produces a reasonable best-guess (not an error)
- [ ] API key is stored as a Cloudflare Worker secret, never exposed to browser

## Implementation Notes

Place the API route in `src/workers/routes/tasks.ts`. Place the Anthropic client in `src/services/nl-parser.ts`. The tool definition should match the schema in [[System - NL Task Parser]]. Use the `@anthropic-ai/sdk` package or raw `fetch()` — either works from Workers. The DO needs a new `task_created` message type to broadcast the new task.
