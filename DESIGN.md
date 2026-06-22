---
name: Lumni
description: South African Matric exam preparation app — playful, energetic, student-focused
colors:
  study-green: "oklch(52% 0.18 146)"
  study-green-bright: "oklch(65% 0.18 146)"
  study-green-ring: "oklch(52% 0.18 146 / 0.3)"
  warm-paper: "oklch(100% 0 0)"
  warm-paper-secondary: "oklch(97% 0.003 60)"
  warm-paper-tertiary: "oklch(95% 0.005 60)"
  warm-paper-elevated: "oklch(100% 0 0)"
  warm-paper-grouped: "oklch(98.8% 0.003 60)"
  surface: "oklch(100% 0 0)"
  surface-secondary: "oklch(97.8% 0.005 60)"
  ink: "oklch(20% 0.02 264)"
  ink-muted: "oklch(20% 0.02 264 / 0.65)"
  ink-faint: "oklch(20% 0.02 264 / 0.35)"
  ink-quaternary: "oklch(20% 0.02 264 / 0.18)"
  separator: "oklch(0% 0 0 / 0.06)"
  destructive: "oklch(55% 0.18 25)"
  success: "oklch(65% 0.2 145)"
  warning: "oklch(75% 0.15 70)"
  info: "oklch(60% 0.15 240)"
  chart-emerald: "oklch(52% 0.18 146)"
  chart-green: "oklch(65% 0.2 145)"
  chart-amber: "oklch(75% 0.15 70)"
  chart-blue: "oklch(60% 0.15 240)"
  chart-red: "oklch(55% 0.18 25)"
typography:
  display:
    fontFamily: "var(--font-heading), Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.012em"
  headline:
    fontFamily: "var(--font-heading), Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: "0.014em"
  title:
    fontFamily: "var(--font-heading), Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.27
    letterSpacing: "-0.012em"
  body:
    fontFamily: "var(--font-sans), Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.02em"
  label:
    fontFamily: "var(--font-sans), Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.011em"
rounded:
  button: "12px"
  card: "20px"
  sheet: "24px"
  input: "12px"
  badge: "8px"
  tab-bar: "20px"
  list-group: "20px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  2xl: "28px"
  3xl: "32px"
  "card-lg": "40px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  11: "44px"
  12: "48px"
  16: "64px"
components:
  button-default:
    backgroundColor: "{colors.study-green}"
    textColor: "oklch(100% 0 0)"
    rounded: "{rounded.button}"
    padding: "16px 16px"
    typography: "{typography.label}"
    height: "44px"
  button-default-hover:
    backgroundColor: "{colors.study-green}" # opacity 0.8
    textColor: "oklch(100% 0 0)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "16px 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.separator}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "16px 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.warm-paper-secondary}"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
    textColor: "{colors.ink}"
    border: "1px solid {colors.separator}"
  input-default:
    backgroundColor: "{colors.warm-paper-secondary}"
    rounded: "{rounded.input}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.separator}"
    height: "28px"
    padding: "8px 8px"
---

# Design System: Lumni

## 1. Overview

**Creative North Star: "The Emerald Study Room"**

Picture a room where the desk lamp throws warm light across scattered notes, a green highlighter rests beside an open textbook, and the air feels like late afternoon quiet before a storm of revision. That is the Emerald Study Room. It is not a library (too silent, too stern). It is not a coffee shop (too loud, too scattered). It is a desk that says: you have got this.

The interface translates this room into pixels. Warm paper surfaces that do not glare. Corners so generous they feel physically safe to touch. A single emerald green that appears only to say "here is where you act" and then steps back. The system is a study partner, not a proctor: it nudges, celebrates small wins, and never makes the student feel watched or judged.

This system forbids anything that feels like an exam hall. No cold clinical whites. No purple gradients or neon accents. No glassmorphism that distracts rather than frames. No generic SaaS landing page theatre with big numbers and smaller labels. The student is here to study, not to be marketed at. The interface disappears into the task.

**Key Characteristics:**

- Generous rounded corners (20px cards, 12px buttons) make the app feel physically safe, not sharp
- Single emerald accent (Study Green) on 10% or less of surfaces: rarity creates meaning
- iOS-inspired type scale with OS-quality tracking and dynamic type: reading should feel effortless, not engineered
- Multi-layer tonal stacking for depth, not shadows: the page breathes without casting hard lines
- Every interaction answers with physical feedback (scale, color, smooth transition): the app feels alive under your finger

## 2. Colors: The Warm Paper + Study Green Palette

Restrained by design, not by accident. Warm neutrals carry the room. Study Green arrives only to guide. The palette is a pact: the surface stays quiet so the accent can speak.

### Primary

- **Study Green** (`oklch(52% 0.18 146)`): The accent that says "press here." Used for primary buttons, active states, selection fills, and focus rings. Never decorative. Its chroma is high enough to feel alive, its lightness controlled enough to never shout. On dark surfaces, it glows instead of glaring.
- **Study Green Bright** (`oklch(65% 0.18 146)`): Dark mode primary accent. Same hue, same chroma, lifted lightness so it reads legibly against the deep background. The same voice, tuned for a darker room.

### Neutral

- **Warm Paper** (`oklch(100% 0 0)`): The page itself. Pure white pulled just barely away from pure white by the absence of blue. Bright but not clinical.
- **Warm Paper Secondary** (`oklch(97% 0.003 60)`): The surface beneath a card, the fill of a grouped table. A whisper of warmth at 60deg hue, imperceptible until you see what cold gray feels like next to it.
- **Warm Paper Tertiary** (`oklch(95% 0.005 60)`): Pressed states, subtle fill areas, the background of a selected list row. One step warmer, one step lower.
- **Surface** (`oklch(100% 0 0)`): Card and container faces. Bright, clean, slightly elevated by the secondary that surrounds it.
- **Surface Secondary** (`oklch(97.8% 0.005 60)`): Elevated cards that sit near the top of the stack, hover fills, subtle container alternates.
- **Ink** (`oklch(20% 0.02 264)`): Primary text. Very dark, cool-leaning gray (264deg hue). Reads as black but carries a trace of blue depth. The most important color in the system: it is what students read.
- **Ink Muted** (`oklch(20% 0.02 264 / 0.65)`): Secondary text, descriptions, metadata. Present but not demanding. The voice of the footnote.
- **Separator** (`oklch(0% 0 0 / 0.06)`): Borders, dividers, hairline rules. Almost invisible on purpose. Structure should be felt, not seen.

### Semantic

- **Destructive** (`oklch(55% 0.18 25)`): Errors, wrong answers, destructive actions. A red with warmth (25deg hue) so it reads as urgent, not cold.
- **Success** (`oklch(65% 0.2 145)`): Correct answers, completions, positive feedback. A green with higher chroma than Study Green so it reads as achievement, not action.
- **Warning** (`oklch(75% 0.15 70)`): Medium difficulty, cautionary feedback. Amber warmth that catches the eye without alarming.
- **Info** (`oklch(60% 0.15 240)`): Informational badges, help indicators. Neutral blue, no emotional charge.

### Named Rules

**The One Voice Rule.** Study Green is used on 10% or less of any given screen. Its rarity is the point. When everything is highlighted, nothing is.

**The Warm Base Rule.** Every neutral surface is tinted toward a warm 60deg hue at chroma 0.0030.005. Pure gray reads cold; warm reads supportive.

### Dark Mode

Dark mode inverts the tonal stack: the base layer deepens to `oklch(10% 0.01 264)`, elevated surfaces brighten to `oklch(20% 0.02 264)`, and Study Green Bright (`oklch(65% 0.18 146)`) maintains the accent's legibility. The ambient warmth shifts cooler (264deg hue) to match the dark environment while keeping a subtle blue note. Separators become lighter (`oklch(100% 0 0 / 0.12)`) against the dark foundation.

## 3. Typography

**Display Font:** Outfit (800 weight) with system-ui sans fallback
**Body Font:** Geist (400, 500, 600, 800 weights) with system-ui sans fallback
**Mono Font:** Geist Mono (400, 500, 700 weights) with SF Mono / monospace fallback

**Character:** Two voices, one room. Outfit is the friendly classmate who explains the hard concept. Its geometric roundness makes headlines feel confident without aggression, approachable without childishness. Geist is the quiet one who writes the notes. Clean, fast, no wasted strokes. It sets down body text and labels with the economy of someone who knows you are in a hurry. Together they read like a study session where someone actually knows the material.

### Hierarchy

- **Display** (800, 2.125rem / 34px, 1.2, +0.012em tracking): Page titles and large hero headings. Reserved for top-level screens. Applies dynamic type scale via `--text-scale`.
- **Headline** (800, 1.75rem / 28px, 1.22, +0.014em tracking): Section headers and major content area titles.
- **Title** (800, 1.375rem / 22px, 1.27, -0.012em tracking): Card titles, subsection headers, and sheet titles.
- **Body** (400, 1rem / 16px, 1.5, -0.02em tracking): Primary reading text, question content, descriptions. Capped at 6575ch line length for prose.
- **Label** (400, 0.875rem / 14px, 1.35, -0.011em tracking): Button labels, form labels, tab text, metadata. Compact and legible.
- **Caption** (400, 0.75rem / 12px, 1.3, 0em tracking): Helper text, timestamps, footnotes. The smallest readable size.
- **Caption 2** (400, 0.6875rem / 11px, 1.2, +0.006em tracking): Legal text, tertiary metadata. Use sparingly.

### Named Rules

**The OS Tracking Rule.** Letter-spacing values match Apple HIG specifications at every size. Do not override with generic 0.05em or 0.1em values; use the project's `--tracking-*` custom properties.

**The Dynamic Type Rule.** All text sizes are multiplied by `--text-scale` (default 1.0, adjustable via JS). The system respects user font size preferences without breaking layout.

## 4. Elevation

If you set a sheet of paper on a desk in afternoon light, it casts a shadow so soft you barely notice it, just enough to know the paper is not the desk. That is the depth of this system. Surfaces do not float; they rest. Hierarchy comes from lightness, not from shadow. A card is not a card because it casts a shadow. It is a card because it sits on a surface one step lighter or darker than its surroundings. Shadows are atmospheric. They are the quality of light in the room, not scaffolding.

### Shadow Vocabulary

- **Level 1** (`0 1px 2px oklch(0% 0 0 / 0.04), 0 1px 4px oklch(0% 0 0 / 0.02)`): The resting float. List groups, small cards. If you squint, you might not see it. That is the point.
- **Level 2** (`0 2px 4px oklch(0% 0 0 / 0.04), 0 4px 12px oklch(0% 0 0 / 0.03), 0 8px 24px oklch(0% 0 0 / 0.02)`): Popovers, dropdowns, elevated cards. Present enough to separate, soft enough to not cast hard edges.
- **Level 3** (4-layer float up to `0 32px 64px oklch(0% 0 0 / 0.015)`): Modals, sheets, dialogs. The most elevated thing in the room. Still soft. Still atmospheric.
- **Solver Glow** (`0 2px 8px oklch(52% 0.18 146 / 0.15)`): The only colored shadow in the system. A green-tinted halo around the Solve button, the one action that says "I can help you with this." It glows because it matters.

### Named Rules

**The Ambient Float Rule.** Shadows tint foreground surfaces upward; they do not carve depth into the page. Hierarchy is established by background lightness first, shadow second. A level-3 surface is still primarily distinguished by being lighter, not by its shadow being larger.

## 5. Components

### Buttons

Buttons answer when you touch them. Every variant scales down on press (`scale-[0.96]`) like a physical button giving under your finger. The 44px touch target (Apple HIG minimum) means thumbs on a crowded bus stop do not miss.

- **Shape:** Gently rounded corners (12px radius via `--radius-button`).
- **Primary:** Study Green background, white text, 16px horizontal padding. Hover reduces opacity to 80%. Focus-visible shows a 2px Study Green ring at 30% opacity.
- **Secondary:** Surface Secondary background, Ink text. Hover intensifies the background.
- **Outline:** Transparent background with a Separator border. Hover fills with Separator color. Active state uses `aria-expanded:bg-muted`.
- **Ghost:** Transparent. Hover shows Warm Paper Secondary background.
- **Destructive:** Destructive red at 10% opacity background, Destructive text. Hover doubles the tint to 20%.
- **Link:** Text-only, underlined on hover. Uses Study Green text.
- **Sizes:** default (44px h), sm (36px h), lg (48px h), xs (20px h), icon (44x44px circle).

### Cards

Cards have corners so generous (20px, 40px at the shell) they feel safe to rest on. A near-invisible Separator border and level-1 shadow do the quiet work of containment. Cards are containers, not navigation. Content grouped inside them reads as belonging together.

- **Corner Style:** `rounded-card-lg` (40px) at the outermost wrapper. Use `rounded-lg` (20px) for standard cards.
- **Background:** `--system-surface` (white in light mode).
- **Border:** 1px `--system-separator` at 80% opacity.
- **Shadow:** `shadow-level-2` (multi-layer oklch shadow). Never hardcode shadow values — always reference the design token so dark mode shadows render correctly.
- **Internal Padding:** 16px horizontal (`px-4`), 16px vertical (`py-4`). Reduced to 12px in `data-[size=sm]`.
- **States:** None at rest. Hover not applicable (cards are containers, not interactive targets).

### List Groups

Where cards contain, list groups navigate. They are the table of contents of the study room: rounded containers (24px) with iOS-style sections, each cell a full-width target begging to be tapped.

- **ListCell:** 56px minimum height, 20px horizontal padding, full-width touch target. Interactive cells highlight on hover and scale down on press.
- **Group Header:** Footnote-size text (13px) in Ink Faint, uppercase with wide tracking.
- **Group Footer:** Caption-size text (12px) in Ink Faint.

### Inputs / Fields

Inputs borrow the same rounded language as buttons (12px) because the hand should not recalibrate between typing and tapping. A subtle fill replaces the hard bordered rectangle. The field sits in the page, not on top of it.

- **Style:** Warm Paper Secondary background, Separator border, 12px radius.
- **Focus:** Border shifts to Study Green, 2px Study Green ring at 30% opacity.
- **States:** Disabled reduces opacity to 50%. Error state shows Destructive border and ring.
- **Touch Target:** Minimum 44px height for all interactive controls via `--touch-target-min`.

### Navigation Bar

A bar that knows when you are at the top of the page and when you are deep in content. At the top, the title is large and proud (34px, Outfit 800) like a chapter heading. On scroll, it shrinks to body-size (16px) and pulls back behind a glass blur, a hairline separator appearing at its feet to say "you have left the surface."

- **Background:** Glass material (`--system-background / 90%` with `backdrop-filter: blur(24px)`).
- **Separator:** 0.5px hairline at the bottom, appears only when collapsed.
- **Back Button:** 36x36px ghost icon button, Study Green tint.

### Tabs / Segmented Control

Two systems, two densities. Both feel alive under your finger.

- **AnimatedTabs:** A unified background pill with a spring-animated Study Green indicator that follows your tap. Active text sits white on green; inactive sits quiet. For when the choice matters and you want to feel it.
- **SegmentedControl:** A Surface Secondary tray with a floating Surface pill that tracks selection. Active text is Study Green; inactive is Ink Muted. For filter groups and view toggles where speed matters more than drama.

### Glass Materials

Liquid Glass is not for permanent architecture. It is for moments that come and go: a sheet sliding up, a popover dismissing with a tap, a navigation bar that blurs the content behind it. Six tiers from barely frosted (10px blur) to fully opaque (40px blur) let transient surfaces exist in their own layer without pretending to be solid. A card is never glass. Glass is for things that do not stay.

### PageContainer

Every page that is not the home feed or admin dashboard should be wrapped in `<PageContainer>`. This ensures consistent max-width, horizontal padding, and responsive behavior across the app. No page should declare its own `max-w-*` or `px-*` — that is the container's job.

- **Default:** `mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-4xl xl:max-w-6xl`
- **Wide variant:** `max-w-6xl xl:max-w-7xl` (home feed, admin dashboards)
- **No bleed:** Hero banners and full-blee sections stay inside the container. Apple HIG avoids full-bleed banners inside narrow content zones.

### Chips / Badges

Small, fast, expressive. 20px tall with 8px radius, they label without taking space. Five variants mirror the button vocabulary so a chip feels like a button's smaller cousin: default (Study Green) for active filters, secondary for neutral tags, destructive for error badges, outline for boundaries, ghost for the quietest annotation. Difficulty labels, subject tags, status indicators: chips tell you what something is without asking you to stop.

## 6. Z-Index Hierarchy

All z-index values must reference semantic CSS custom properties. No magic numbers.

| Token           | Value | Usage                                   |
| --------------- | ----- | --------------------------------------- |
| `--z-content`   | 0     | Default content, text, images           |
| `--z-elevated`  | 10    | Cards on hover, floating labels         |
| `--z-sticky`    | 20    | Sticky headers, pinned columns          |
| `--z-header`    | 30    | Top navigation bar                      |
| `--z-drawer`    | 40    | Side drawers, bottom sheets             |
| `--z-modal`     | 50    | Dialogs, overlays, popovers             |
| `--z-toast`     | 60    | Notification toasts                     |
| `--z-skip-link` | 100   | Accessibility skip link (always on top) |

**Rule:** If you need a z-index, import `--z-*` from the design system. Never write `z-50` directly in a component.

## 7. Spacing & Layout Rules

### Vertical Rhythm

Use `gap-*` (flexbox/grid `gap`) for all vertical spacing between siblings. Do not use `space-y-*` or manual `mt-*` / `mb-*` combinations. `gap` is the modern standard, works uniformly in flex and grid, and avoids Tailwind `space-y` specificity gotchas.

### Arbitrary Values

Do not write arbitrary pixel values (`w-[200px]`, `text-[13px]`, `min-h-[250px]`). Use the design system's spacing scale (`--space-1` through `--space-16`) and typography scale (`--fs-caption-2` through `--fs-large-title`). If a value does not exist in the token set, add the token rather than hardcoding the value.

## 8. Do's and Don'ts

### Do:

- Do let Study Green be rare. 10% or less of any surface. When it appears, it should mean something: a button, a focus ring, a selected state. Rarity is its authority.
- Do tint every neutral toward 60deg warmth at chroma 0.0030.005. Pure gray reads like a hospital. Warm reads like a desk lamp.
- Do use Outfit 800 for headings and Geist 400 for body. This pairing is the voice of a friend who knows the material: confident in the big ideas, clear in the details.
- Do make every interactive element at least 44x44pt. Thumbs on a minibus, fingers after a long day: the interface does not penalise imprecision.
- Do layer depth through lightness first. A surface one step lighter or darker than its background is hierarchy. A shadow is atmosphere.
- Do use `--ease-ios` (`cubic-bezier(0.16, 1, 0.3, 1)`) for every transition. It feels fast because it decelerates hard. No bounce. No sluggishness.
- Do animate only `transform` and `opacity`. Layout properties (`width`, `height`, `top`, `left`) cause reflow. The page should not stutter.
- Do show skeleton shapes while content loads. A spinner in the middle of the page says "wait." A skeleton says "something is coming."
- Do set `aspect-ratio` on every image and embedded media. A layout that jumps when an image loads is a layout that broke trust.
- Do use `gap-*` for all vertical and horizontal spacing between siblings. `gap` is the modern standard; it works in flex and grid and avoids `space-y` specificity gotchas.
- Do wrap every page in `<PageContainer>` (except home feed and admin dashboards). Never declare `max-w-*` or `px-*` at the page level.
- Do use design tokens for shadows (`shadow-level-2`), radii (`rounded-card-lg`), and z-index (`--z-*`). Tokens keep dark mode, responsive behaviour, and accessibility in sync automatically.

### Don't:

- Don't use gradient text. Not once. `background-clip: text` with a gradient is decoration pretending to be typography. Use solid Study Green or Ink. Emphasis comes from weight and size.
- Don't use side-stripe borders. A 3px `border-left` in Study Green on a card is not a design decision. It is a reflex. Use full borders, background tints, a leading number or icon, or nothing.
- Don't make cards out of glass. Glass materials (backdrop-filter blur) are for transient surfaces that slide in and out. Cards are furniture. Furniture is solid.
- Don't build the hero-metric template. Big number. Small label. Supporting stat. Gradient accent. SaaS cliché. The student does not need to be impressed. They need to study.
- Don't repeat the same card grid across the page. Icon. Heading. Text. Icon. Heading. Text. Every card different or the grid is wrong.
- Don't reach for a modal first. Inline disclosure, progressive expansion, a sheet from the bottom: exhaust these before a modal. Modals interrupt. Studying requires flow.
- Don't put Outfit in labels, buttons, or data text. Outfit is for headings above 20px. Below that, Geist takes over. Each font has its job.
- Don't invent new affordances. A button that does not look like a button, a scrollbar that disappears, a form control with no visible boundary: these do not feel premium. They feel broken. Familiar patterns build trust.
- Don't paint inactive states with full color. Disabled is 50% opacity, period. Not a desaturated version of the active color. Not a grayed-out shadow. 50% opacity.
- Don't bounce. Elastic easings, spring overshoots, bouncy buttons: prohibited. `cubic-bezier(0.16, 1, 0.3, 1)` for everything.
- Don't use dark mode as an excuse for purple gradients, neon accents, or glassmorphism. Dark mode shifts cooler (264deg hue) and lifts the accent (Study Green Bright at 65% lightness). The voice stays the same.
- Don't spray `will-change` across elements. Apply it to one or two specific properties that genuinely benefit from GPU compositing. Every new layer costs memory.
- Don't lazy load the hero. Above-fold content, the page title, the primary CTA: these load eagerly. Lazy loading is for the content below the fold, not the reason someone opened the page.
- Don't write arbitrary pixel values (`w-[200px]`, `text-[13px]`, `min-h-[250px]`). They bypass the design system and break dark mode, responsive scaling, and dynamic type. Use tokens.
- Don't hardcode shadow values (`shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`). The design system provides `shadow-level-1`, `shadow-level-2`, and `shadow-level-3` with proper dark-mode-aware oklch values.
- Don't use `space-y-*` or manual `mt-* mb-*` pairs for sibling spacing. Use `gap-*` on the parent container. One source of truth, no specificity wars.
- Don't write magic z-index numbers (`z-50`, `z-[100]`). Use `--z-content`, `--z-elevated`, `--z-sticky`, `--z-header`, `--z-drawer`, `--z-modal`, `--z-toast`, `--z-skip-link`.
- Don't create page-level layout rules (`max-w-3xl`, `px-4`) outside of `<PageContainer>`. The container owns the canvas; pages own the content.

---

> **IMPORTANT:** This file follows the [Google Stitch DESIGN.md format](https://stitch.withgoogle.com/docs/design-md/format/). The YAML frontmatter carries machine-readable tokens; the markdown body provides context for how to apply them.
