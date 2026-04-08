# System - Data Store

## WHAT: Definition

Data Store is the persistent source of truth for all WeDo data. It is Cloudflare D1 (SQLite at the edge), accessed exclusively through Drizzle ORM from the service layer. The schema maps directly to the five core Primitives — Person, Task, Day, Schedule, and Streak — with schedule recurrence rules stored as a JSON column produced by the Anthropic API from natural language input. Streak counts are denormalized for fast reads and recalculated from task completions and skip days on any retroactive edit.

## WHERE: Ecosystem

- Conforms to:
  - [[Standard - Tech Stack]] — uses Cloudflare D1 (SQLite) and Drizzle ORM as specified
  - [[Standard - Project Structure]] — schema, migrations, and queries live in `src/db/`
- Dependents:
  - [[System - Real-Time Sync]] — the Durable Object writes mutations here and broadcasts after successful write
  - [[System - Recurrence Engine]] — reads task and schedule records to materialize the daily task set
  - [[System - Streak Engine]] — reads task_completions and skip_days to calculate and update streak counts
  - [[System - NL Task Parser]] — structured output from the parser is written as schedule_rules JSON in the tasks table
- Dependencies:
  - [[Primitive - Person]] — persons table row
  - [[Primitive - Task]] — tasks table row with schedule_rules JSON column
  - [[Primitive - Day]] — task_completions and skip_days rows keyed by date
  - [[Primitive - Schedule]] — encoded as JSON schedule_rules column on task row
  - [[Primitive - Streak]] — streaks table row denormalized per person

## WHY: Rationale

- Product Thesis: [[Product Thesis - Radical Simplicity]] — D1 (SQLite) matches the scale and complexity of a single-family app; there is no need for a distributed relational database or a separate caching layer; the schema is small, the data volume is trivial, and SQLite's simplicity is a feature
- Driver: Cloudflare D1 co-locates with Workers and Durable Objects on the same platform, eliminating cross-cloud latency and simplifying the deployment model; the full stack runs on one platform per [[Standard - Tech Stack]]
- Driver: Streak denormalization is a deliberate trade-off — streak counts are read on every board load and must be fast; the recalculation cost on retroactive edits is rare and acceptable

## WHEN: Timeline

V1 core system. Schema is v1; designed to be robust for future task types (one-off tasks, project tasks) even though v1 exposes recurring tasks only.

The JSON `schedule_rules` column is intentionally flexible — the Anthropic API output format can evolve without a schema migration as long as the Recurrence Engine and NL Task Parser share the same interpretation contract.

## HOW: Implementation

### Schema

**persons**

| Column | Type | Notes |
|--------|------|-------|
| id | Text (UUID) | Primary key |
| family_id | Text | Household scoping |
| name | Text | Display name (e.g., "Cora") |
| display_order | Integer | Column order on Dashboard View |
| emoji | Text | Person's emoji identifier |

**tasks**

| Column | Type | Notes |
|--------|------|-------|
| id | Text (UUID) | Primary key |
| family_id | Text | Household scoping |
| person_id | Text | FK → persons |
| title | Text | Task display name |
| emoji | Text | Task emoji; required |
| schedule_rules | JSON | Structured recurrence rules from NL parser |
| rollover_type | Text | Always "none" in v1 (no rollover) |
| created_at | Timestamp | Creation time |

**task_completions**

| Column | Type | Notes |
|--------|------|-------|
| id | Text (UUID) | Primary key |
| task_id | Text | FK → tasks |
| date | Text (ISO 8601) | The day this completion belongs to |
| completed_at | Timestamp | When the toggle was made |
| completed_by | Text | FK → persons (who toggled it) |

**skip_days**

| Column | Type | Notes |
|--------|------|-------|
| id | Text (UUID) | Primary key |
| family_id | Text | Household scoping |
| date | Text (ISO 8601) | The day being skipped |
| reason | Text | Optional; e.g., "travel" |
| created_at | Timestamp | When declared |

**streaks**

| Column | Type | Notes |
|--------|------|-------|
| person_id | Text | FK → persons; primary key |
| current_count | Integer | Current consecutive qualifying days |
| best_count | Integer | All-time best streak |
| last_qualifying_date | Text | Last date that counted toward streak |

### Streak Denormalization

The streaks table caches values computed by [[System - Streak Engine]]. On any retroactive edit (past task toggled, skip day declared or removed), the Streak Engine recalculates from the affected date forward and updates the streaks row. Fast read wins over recalculation cost; retroactive edits are infrequent.

### Examples

- Cora completes her morning task → task_completions row inserted with task_id, date=today, completed_at=now
- Elizabeth declares a Skip Day for Friday travel → skip_days row inserted; Streak Engine recalculates from Friday forward; streaks table updated
- "Practice piano Monday, Tuesday, Thursday, Friday" → NL parser returns structured JSON; stored in tasks.schedule_rules; Recurrence Engine reads this on each day evaluation

### Anti-Examples

- Wrong: Reading schedule_rules from the UI layer directly — all data access goes through `src/db/` queries and `src/services/` business logic; UI never touches D1 directly
- Wrong: Storing streak counts only in memory without persisting to the streaks table — streaks must survive server restarts and be available without recalculation on every board load
- Wrong: Treating task_completions rows as mutable update targets — completions are insert/delete; the presence of a row means completed, absence means not completed
