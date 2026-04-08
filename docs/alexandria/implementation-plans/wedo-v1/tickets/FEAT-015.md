---
id: FEAT-015
title: "Playwright e2e test suite"
outcome: O-1
tier: must
enabler: false
blocked-by: [FEAT-010, FEAT-014]
blocks: [FEAT-016]
cards: [Standard - Engineering Methodology]
---

## Motivation

The HARNESS methodology requires e2e tests that verify the full stack works. Playwright tests drive a real browser against the running app, catching integration issues that unit tests miss. These tests are also the QA loop that AI builders run after making changes.

## Description

Write Playwright e2e tests covering the critical paths:
- Dashboard renders with correct persons and tasks
- Tap person column → navigates to Single List View
- Tap task → toggles completion, ring updates
- Navigate back to Dashboard → completion state preserved
- Day navigation: arrow back, see previous day, arrow forward
- Add task via NL entry (mock Anthropic API in test)
- Skip day toggle → tasks dim, streak preserved
- Delete task → disappears from view
- Two-browser test: toggle on one, verify update on the other (real-time sync)

## Context

See [[Standard - Engineering Methodology]] — Playwright e2e is part of the HARNESS quality gates. CLAUDE.md specifies `npm run test:e2e` as the e2e command. The QA loop (post-change verification) uses these same tests. See release.md for full plan context.

Anti-patterns:
- Do NOT assert on exact pixel positions — assert on semantic state (task checked, streak count value)
- Do NOT run the full suite on every pre-commit — use targeted runs
- Do NOT dump thousands of lines of passing test output — suppress success, surface failures only

## Acceptance Criteria

- [ ] e2e tests cover: dashboard render, task toggle, navigation, day navigation, NL entry, skip day, task deletion
- [ ] Two-browser real-time sync test passes
- [ ] `npm run test:e2e` runs the full suite
- [ ] Tests run against the local dev server (wrangler + Vite)
- [ ] Passing tests produce minimal output; failures produce actionable error messages
- [ ] Tests complete in under 60 seconds

## Implementation Notes

Place in `tests/e2e/`. Use Playwright's multi-browser context for the real-time sync test (two pages connected to the same DO). Mock the Anthropic API for NL entry tests (use Playwright's route interception). Consider a test seed script that resets D1 to a known state before each test run.
