# System - Real-Time Sync

## WHAT: Definition

Real-Time Sync is the system that propagates task completion state and board changes instantly across all connected clients — the iPad ambient display, parent phones, and any other devices viewing WeDo simultaneously. Built on Cloudflare Durable Objects with Hibernatable WebSockets, it uses one Durable Object per family as a persistent coordination hub. All mutations flow through the DO, which serializes writes and broadcasts updates to all connected clients within a sub-second window.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Tech Stack]] — uses Cloudflare Durable Objects and Hibernatable WebSockets as specified
- Dependents:
  - [[Experience Goal - Ambient Calm]] — the ambient iPad display requires sub-second sync to stay accurate as a glanceable surface; stale state breaks the ambient experience
  - [[Capability - Toggle Task Completion]] — completion toggles are the primary mutation this system propagates
  - [[Section - Dashboard View]] — relies on real-time broadcast to stay current across devices without manual refresh
- Dependencies:
  - [[System - Data Store]] — the DO writes mutations to D1 as source of truth, then broadcasts to clients
- Related:
  - [[Loop - Daily Completion Rhythm]] — real-time ring updates are what make the daily loop feel live and cooperative across the household

## WHY: Rationale

- Experience Goal: [[Experience Goal - Ambient Calm]] — the iPad on the counter must reflect current household state at a glance from across the room; if a child completes a task on their phone and the ambient display lags by minutes, the display fails its purpose
- Product Thesis: [[Product Thesis - Cooperative Household]] — the shared board only functions as a cooperative surface if all household members see the same state; delayed sync would create divergent views and undermine the "we" in WeDo
- Driver: A family of six with concurrent task completions needs a serialized coordination point. The single-threaded Durable Object model eliminates race conditions without a distributed lock; last-write-wins is correct for this mutation surface because two family members completing the same task simultaneously is not a conflict worth resolving differently

## WHEN: Timeline

V1 core system. Hibernatable WebSockets are essential for the ambient iPad display — the iPad connection must survive idle periods without accumulating connection costs. Sub-second broadcast latency is a hard requirement, not a nice-to-have.

Future: if the household expands to multiple iPads or the sync pattern changes, the per-family DO model scales without architectural change.

## HOW: Implementation

### Mutation Flow

1. Client mutates (e.g., toggle task completion)
2. Client sends mutation over WebSocket to the family's Durable Object
3. DO writes to D1 (source of truth)
4. DO broadcasts updated state to all connected clients
5. All clients update UI optimistically on send; confirm on broadcast receipt

### Reconnection

On reconnect (network drop, wake from sleep), client fetches full current-day state from the DO. No partial-sync or diff protocol needed — the daily board is small enough that full-state fetch is fast and correct.

### Conflict Resolution

Last-write-wins. The DO is single-threaded, so all mutations are serialized naturally — no race conditions at the coordination layer. For a household of six with non-overlapping personal task lists, true conflicts (two people editing the same record simultaneously) are rare and last-write-wins is always correct.

### Hibernatable WebSockets

The ambient iPad display must maintain a persistent connection across idle periods. Cloudflare Hibernatable WebSockets allow the DO to sleep when idle and wake on incoming message — the connection stays alive without burning CPU or connection quota during quiet hours.

### Examples

- Micah completes "Practice piano" on his phone → toggle sent to DO → DO writes to D1 → DO broadcasts → iPad ambient display updates within one second; Elizabeth sees the ring advance
- iPad sleeps overnight → WebSocket hibernates → morning: DO wakes on first mutation, state is current, no stale display
- Two children complete tasks in the same second → DO serializes both writes → both updates broadcast in order → no conflict

### Anti-Examples

- Wrong: Client-to-client sync (peer-to-peer) — all state flows through the DO as the single coordination hub
- Wrong: Polling D1 directly from clients for updates — WebSocket broadcast is the mechanism; polling creates lag and unnecessary D1 reads
- Wrong: Treating last-write-wins as a bug — for this household mutation surface, it is the correct and deliberate conflict strategy
- Wrong: Using a shared WebSocket connection without per-family isolation — each family gets exactly one DO; isolation is architectural
