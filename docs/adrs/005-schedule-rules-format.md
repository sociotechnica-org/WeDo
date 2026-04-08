# 5. Schedule Rules Format — RFC 5545 Day Codes in JSON

Date: 2026-04-07

## Status

Accepted

## Context

WeDo stores recurring task schedules in a JSON column (`schedule_rules`) in the tasks table. This format is the shared contract between:
- The NL Task Parser (Anthropic API generates it via tool_use)
- The Recurrence Engine (evaluates "does this task appear today?")
- The D1 database (stores it as JSON)
- Any future system that touches task scheduling

The format must be easy for an LLM to generate via tool_use with enum constraints, trivial to evaluate programmatically, standards-based, and extensible without schema migrations.

Options considered:
- **iCalendar RRULE strings (RFC 5545):** Industry standard but massively over-complex for day-of-week selection. String format fights against tool_use structured output. The `rrule` npm library has timezone/UTC quirks. Too heavy.
- **Cron expressions:** Designed for time-of-day scheduling, not day-of-week recurrence. Wrong abstraction.
- **Custom JSON with RFC 5545 day codes:** Structured JSON using the 2-letter day codes from RFC 5545 (MO, TU, WE, TH, FR, SA, SU). Standards-based, compact, enum-constrained, zero-dependency evaluation.

## Decision

Use custom JSON with RFC 5545 day codes for schedule_rules:

```json
{ "days": ["MO", "TU", "TH", "FR"] }
```

Day codes are the BYDAY values from RFC 5545: MO, TU, WE, TH, FR, SA, SU.

Zod schema:
```typescript
const DayCode = z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);
const ScheduleRules = z.object({
  days: z.array(DayCode).min(1).max(7),
});
```

The tool_use definition constrains LLM output to this exact schema via enum on array items — the AI cannot produce an invalid day code.

Evaluation is 3 lines with zero dependencies:
```typescript
const DAY_CODES = ["SU","MO","TU","WE","TH","FR","SA"] as const;
function isTaskScheduledForDate(rules: { days: string[] }, date: Date): boolean {
  return rules.days.includes(DAY_CODES[date.getDay()]);
}
```

## Consequences

Simple, correct, and constrained. Any developer or AI agent can read and evaluate the format immediately. Enum validation means malformed data cannot enter the system.

Extensible without migration — future versions can add fields (`interval`, `startDate`, `endDate`) to the same JSON object without changing the column or existing data.

Converts trivially to RRULE BYDAY if calendar interop is ever needed: `rules.days.join(",")`.

Trade-off: less expressive than full RRULE (no monthly/yearly recurrence, no count limits, no interval). This is intentional — WeDo v1 only needs day-of-week selection. See ADR 003 for the D1 storage rationale.
