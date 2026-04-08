# Section - Dashboard View

## WHAT: Definition

Dashboard View is the primary screen of WeDo — the whole-family-at-a-glance surface showing all six household members' task columns simultaneously in landscape mode. It is the state the app lives in most of the time. Tapping any person's column opens the Single List View for that person.

## WHERE: Ecosystem

- Parent domain:
  - [[Domain - Daily Board]] — parent workspace
- Conforms to:
  - [[Standard - Visual Language]] — column layout, completion rings, checkboxes, and typography must follow the letterpress/watercolor spec
  - [[Standard - Task Vocabulary]] — all copy uses canonical terms (Person, Task, Day)
- Contains components:
  - [[Component - Person Column]] — one per family member; the primary building block of this view
  - [[Component - Completion Ring]] — appears at the top of each person's column showing progress
  - [[Component - Task Row]] — rows inside each person's column
- Adjacent sections:
  - [[Section - Single List View]] — destination when tapping a person's column
  - [[Section - Day Navigation]] — day navigation bar appears at the top of this view
- Uses systems:
  - [[System - Recurrence Engine]] — provides the task list for each person for the displayed day

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — implements "whole-family-at-a-glance shared visibility" (Strategy Bet 2); the shared surface is the cooperative experience
- Principle: [[Principle - Warmth Over Urgency]] — the ambient, multi-column layout is intentionally quiet; it invites glancing rather than demanding attention
- Reference: See wireframe sketch at `docs/alexandria/sources/dashboard-view.png`

Tension: six equal-width columns in landscape mode on a smaller iPad gets tight — task names need to be short or the columns become unreadable. Short task names (reinforced by emoji-first design) are the primary mitigation; this is a known layout constraint, not a bug.

## WHEN: Timeline

V1 core screen. This is the default/home state of the app. No predecessor.

## HOW: Implementation

### Behavior

In landscape mode, Dashboard View shows equal-width columns side by side — one per family member (up to six). Columns auto-shrink to fit all members. Each column shows (top to bottom):
- Streak count — displayed above the person's name and ring
- Completion ring + person's name below the streak count
- Task list below with checkbox + emoji + task text
- Checked tasks show filled/blue-checkmark treatment; unchecked show empty checkbox

Top bar: WeDo branding (top-left), Settings link (top-right), Day Navigation bar centered.

Large whitespace below task lists is intentional — the board should breathe; it is not a dense list manager.

Tapping a person's column anywhere → navigates to Single List View for that person.

### Examples

- All six members' columns visible simultaneously; Cora's column shows emoji on each task so she can identify her tasks by picture; Moriah's column shows 3 of 5 tasks checked with a half-filled completion ring
- Family glances at board mid-morning: three people have full completion rings, two are in progress, one hasn't started; the view communicates status without anyone saying anything

### Anti-Examples

- Wrong: Ranking or sorting columns by completion percentage — columns are always in a fixed, non-ranked order per [[Principle - Cooperative Not Competitive]]
- Wrong: Using red indicators for persons with low completion — warmth requires neutral/encouraging treatment per [[Standard - Visual Language]]
- Wrong: Showing past-due language ("overdue," "late") on any task row — the Day-frame means tasks are either done or not done today, not late
