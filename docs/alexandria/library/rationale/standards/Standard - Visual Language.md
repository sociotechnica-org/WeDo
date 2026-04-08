# Standard - Visual Language

## WHAT: Definition

Visual Language specifies the aesthetic constraints all WeDo UI must satisfy: letterpress-style typography, watercolor-wash color application, sketched UI elements, and a palette of warm muted tones with no reds, oranges, or high-contrast alarm colors. It defines what "looks like WeDo" versus "looks like software."

## WHERE: Ecosystem

- Implements:
  - [[Principle - Warmth Over Urgency]] — makes the warmth principle testable through specific palette and rendering rules
  - [[Principle - Constraint is the Product]] — defines boundaries that prevent software-like aesthetic drift
- Conforming:
  - [[Section - Dashboard View]] — must render columns, completion rings, and checkboxes per this spec
  - [[Section - Single List View]] — must render task rows and Add Task button per this spec
  - [[Component - Task Row]] — checkbox and text rendering must match sketched/watercolor style
  - [[Component - Completion Ring]] — fill behavior and color must use watercolor wash, not flat fill
  - [[Component - Person Column]] — column layout and name rendering must follow typography spec
- Related:
  - [[Standard - Task Vocabulary]] — vocabulary standard that pairs with visual language for overall UX coherence

## WHY: Rationale

- Principle: [[Principle - Warmth Over Urgency]] — this standard makes the warmth principle testable: a reviewer can objectively check whether red is used, whether fonts are system-default, whether checkboxes are sketched
- Driver: The iPad lives in a family common area as ambient art. If it looks like software — standard system fonts, flat UI controls, alarm reds — it breaks the ambient presence and becomes a device, not a household object. The visual spec prevents drift toward standard-toolkit defaults.

## WHEN: Timeline

Established at project start, v1. Stable for the life of the product — the aesthetic identity is core, not decorative.

## HOW: Specification

### Typography

| Attribute | Specification |
|-----------|---------------|
| Style | Handwritten / letterpress feel — NOT standard system fonts (SF Pro, Helvetica) |
| Weight | Light to regular; avoid bold system weights |
| Rendering | May use custom font or styled system font; must feel hand-drawn |

### Color Palette

| Role | Allowed | Forbidden |
|------|---------|-----------|
| Completion / checked state | Blue watercolor wash (varying opacity) | Flat solid blue, #FF0000 family |
| Completion ring fill | Watercolor wash proportional fill | Flat progress bar style |
| Background | Off-white, warm cream, translucent layers | Bright white (#FFFFFF) |
| Text | Warm dark (near-black, warm grey) | Pure black (#000000), red, orange |
| Alert / warning | Neutral, muted | Red, amber, high-contrast |

### UI Element Style

| Element | Specification |
|---------|---------------|
| Checkboxes | Sketched / drawn style — NOT standard OS checkboxes |
| Borders | Soft edges; translucency preferred over hard borders |
| Dividers | Implied whitespace or faint watercolor lines, not ruled lines |
| Buttons (e.g., Add Task) | Stationery-style; avoid glossy/pill/default OS button |

### Anti-Examples

- Wrong: Using system red (#FF0000 or OS semantic red) for incomplete tasks or overdue indicators — red carries urgency/failure and is explicitly excluded
- Wrong: Using standard iOS/iPadOS checkbox component with default styling — defeats the sketched aesthetic
- Wrong: Flat solid color fills at full opacity for completion ring — must be watercolor wash with varying opacity
- Wrong: SF Pro or Helvetica as primary display font — must feel handwritten, not OS-default
- Wrong: Pure white (#FFFFFF) background — too clinical; use warm off-white or subtle watercolor wash
