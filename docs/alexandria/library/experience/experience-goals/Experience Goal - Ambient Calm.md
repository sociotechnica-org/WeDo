# Experience Goal - Ambient Calm

## WHAT: Definition

Ambient Calm is the target emotional experience for WeDo's primary display mode: the iPad on the counter should feel like household art, not a device. Family members should be able to glance at it from across the room, absorb the household's day at a glance, and return to what they were doing — without being demanded of, alarmed, or compelled. The board should be present without being insistent.

## WHERE: Ecosystem

- Applies to sections and components:
  - [[Section - Dashboard View]] — the primary screen; must feel ambient and glanceable, not demanding
  - [[Component - Person Column]] — columns should be readable at a distance, not require close inspection
  - [[Component - Completion Ring]] — the ring communicates progress silently, without text labels or numbers
- Governed by:
  - [[Principle - Warmth Over Urgency]] — the warmth principle is the design instrument for achieving this goal
  - [[Standard - Visual Language]] — the letterpress/watercolor aesthetic is the visual mechanism for ambient presence
- Shapes loops:
  - [[Loop - Daily Completion Rhythm]] — the daily loop should feel like a natural rhythm, not a demanded workflow
- Required by systems:
  - [[System - Real-Time Sync]] — sub-second broadcast latency is the technical requirement that makes ambient glanceability possible; stale state breaks the ambient experience

## WHY: Rationale

- Product Thesis: [[Product Thesis - Cooperative Household]] — a family common-area display that demands attention would be intrusive in a shared living space; ambient presence is how the board earns its place in the home
- The source material explicitly describes the aspiration: "closer to ambient art than software." This experience goal operationalizes that aspiration as a testable design target.

## WHEN: Timeline

V1 foundational experience goal. This is a core aspiration of the product — not a future polish concern.

## HOW: Implementation

### What Achieving This Looks Like

- A family member can understand the household's daily progress at a glance from 8 feet away
- The board sits on the kitchen counter for a day without anyone interacting with it and the family doesn't feel bothered by it
- There are no push notifications, no sounds, no badge counts
- The visual design feels like it belongs next to a vase of flowers, not next to a laptop

### What Violating This Looks Like

- Any push notification or audible alert for task reminders
- Red or high-contrast visual states that call attention to themselves from across the room
- Interface chrome (status bars, system UI, app-switcher indicators) visible when the board is in display mode
- Information density that requires close reading — the board should be glanceable, not studied

### Tensions

Trades off against: discoverability. An ambient design may be so quiet that new family members (or young children) don't understand how to interact with it. Resolved by: the design is simple enough that the interaction model (tap to toggle) is obvious without instruction.
