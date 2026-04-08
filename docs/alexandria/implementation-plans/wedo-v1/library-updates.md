# Library Updates from WeDo v1

Ask Conan to review this list and produce a transient surgery plan for Sam in the conversation, not as a checked-in file.

| Action | Card | What Changed | Source |
|--------|------|-------------|--------|
| Update | Capability - Skip Day (WHERE, HOW) | Skip Day UI resolved: toggle next to date in Day Navigation bar, draws line through date, dims tasks | Step 4 |
| Update | Section - Day Navigation (HOW) | Skip Day toggle added to the date bar | Step 4 |
| Create | Capability - Task Deletion | New capability: swipe/hover to reveal trash icon in Single List View. No library card exists. | Step 4 |
| Update | System - Real-Time Sync (HOW) | WebSocket init protocol specified: client sends { type: "init", date }, DO responds with full day state. Past-day mutations use same WebSocket flow. | Step 4 |
| Update | Primitive - Day (HOW) | Sunday display resolved: empty board (no tasks materialize), person columns visible with empty rings | Step 4 |
| Update | System - Data Store (HOW) | Timezone anchor: America/New_York (EST) configured in src/config/ | Step 4 |
| Update | Domain - Daily Board (WHERE) | Settings screen referenced but no Section card exists — create if Settings grows beyond minimal | Step 5 |
| Update | Component - Person Column (HOW) | Streak count position confirmed: above person name, above completion ring | Step 4 |
