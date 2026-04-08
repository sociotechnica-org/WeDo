---
id: FEAT-004
title: "Durable Object with WebSocket init and broadcast"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-003]
blocks: [FEAT-005]
cards: [System - Real-Time Sync, Standard - Tech Stack]
---

## Motivation

The Durable Object is the real-time sync engine. It handles WebSocket connections from all family members, serializes mutations, writes to D1, and broadcasts updates. This is what makes the ambient iPad display feel alive — when Micah checks off "vacuum," the kitchen iPad updates instantly.

## Description

Implement the family Durable Object class with:
- WebSocket upgrade handling via Hibernatable WebSocket API
- `init` message handler: client sends `{ type: "init", date: "2026-04-07" }`, DO responds with full day state (persons, tasks for that date based on schedule_rules, completions, streaks, skip status)
- `task_toggled` message handler: validate, write to D1 (insert/delete task_completion), broadcast to all other clients
- Hibernation support — DO sleeps when no messages are flowing
- Reconnection — client reconnects and sends `init` to get fresh state
- Hono route in the Worker that upgrades HTTP to WebSocket and routes to the correct DO instance

## Context

See [[System - Real-Time Sync]] for the full architecture (mutation flow, reconnection, conflict resolution, hibernation). See ADR 002 for the DO rationale. CLAUDE.md Golden Rule 4: one DO per family, never a global singleton. Golden Rule 5: D1 is source of truth, DO caches for broadcast. See release.md for full plan context.

Anti-patterns:
- Do NOT create a global singleton DO — one per family
- Do NOT trust in-memory state to survive — persist to D1 on every mutation
- Do NOT implement REST endpoints for mutations — everything goes through the WebSocket via the DO

## Acceptance Criteria

- [ ] DO class handles WebSocket upgrade via Hibernatable WebSocket API
- [ ] Client can connect, send `init`, and receive full day state
- [ ] Client can send `task_toggled` and receive broadcast confirmation
- [ ] Second client connected to same DO receives the broadcast
- [ ] DO writes task_completions to D1 on every toggle
- [ ] DO hibernates when no active messages (verify via wrangler logs)
- [ ] Hono route correctly upgrades and routes to DO

## Implementation Notes

Place DO class in `src/realtime/family-board.ts`. Place Hono WebSocket route in `src/workers/`. Use `this.ctx.storage.sql` for DO-local SQLite if needed for caching, but D1 is the source of truth. The init response should evaluate schedule_rules to determine which tasks appear on the requested date — this means the DO needs access to the recurrence evaluation logic from FEAT-002's types.
