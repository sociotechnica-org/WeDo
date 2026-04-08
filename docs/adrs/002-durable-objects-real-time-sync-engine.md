# 002. Use Durable Objects as the Real-Time Sync Engine

Date: 2026-04-07

## Status

Accepted

## Context

Family members need to see each other's task completions in real time — especially the ambient iPad display on the kitchen counter. When a child toggles a task on their phone, the iPad must update within a second. No stale state; no manual refresh.

Options considered: Firebase Realtime Database, Liveblocks, Ably, Pusher, or Cloudflare Durable Objects. Using any external real-time service would introduce a second infrastructure dependency (this project is all-in on Cloudflare per ADR 001).

Real-time coordination also needs a serialized mutation point to avoid race conditions when two family members act simultaneously.

## Decision

One Cloudflare Durable Object per family acts as the persistent coordination hub. All mutations flow through the DO:

1. Client sends mutation (e.g., task toggle) over WebSocket to the family's Durable Object
2. DO writes to D1 (source of truth)
3. DO broadcasts updated state to all connected clients
4. Clients update optimistically on send; confirm on broadcast receipt

Conflict resolution is last-write-wins. The DO is single-threaded, so all mutations are serialized naturally — no distributed locking required.

Hibernatable WebSockets keep the ambient iPad connection alive across idle periods without burning CPU or connection quota.

## Consequences

**Easier:**
- Sub-second broadcast with no external real-time service; stays within the Cloudflare platform (ADR 001)
- Single-threaded DO model eliminates race conditions without any explicit locking logic
- Hibernatable WebSockets make the always-on iPad display cheap — idle connections cost nothing
- On reconnect, full current-day state fetch is fast (daily board is small); no partial-sync protocol needed
- Last-write-wins is correct for this mutation surface: household members mostly toggle their own tasks, true simultaneous conflicts on the same record are rare

**Harder:**
- DO can be shut down at any time by the Cloudflare runtime — all state must be persisted to D1 on every mutation; the DO cannot rely on in-memory state surviving across requests
- DO instance ceiling of ~500–1,000 req/sec is not a constraint for six users, but it would be if the scope changed
- Debugging Durable Objects in local development requires `wrangler dev`; behavior in production may differ from local simulation

See ADR 001 for the Cloudflare platform commitment. See ADR 003 for D1 as the source of truth the DO writes to.
