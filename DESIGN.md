---
name: Lumni
description: AI-powered South African Matric exam preparation — warm, supportive, mobile-first
colors:
  study-green: "oklch(52% 0.18 146)"
  study-green-bright: "oklch(65% 0.18 146)"
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
  dark-background: "oklch(10% 0.01 264)"
  dark-surface: "oklch(16% 0.015 264)"
  dark-elevated: "oklch(20% 0.02 264)"
  dark-separator: "oklch(100% 0 0 / 0.12)"
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
  caption:
    fontFamily: "var(--font-sans), Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0em"
  caption2:
    fontFamily: "var(--font-sans), Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.006em"
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
  card-lg: "40px"
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
    backgroundColor: "{colors.study-green}"
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
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "oklch(100% 0 0)"
    rounded: "{rounded.button}"
    padding: "16px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "16px 16px"
    height: "44px"
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
  input-focus:
    border: "1px solid {colors.study-green}"
    ring: "2px solid {colors.study-green} / 0.3"
  checkbox-default:
    backgroundColor: "transparent"
    rounded: "{rounded.sm}"
    border: "1px solid {colors.separator}"
    size: "16px"
  checkbox-checked:
    backgroundColor: "{colors.study-green}"
    border: "1px solid {colors.study-green}"
  badge-default:
    backgroundColor: "{colors.study-green}"
    textColor: "oklch(100% 0 0)"
    rounded: "{rounded.badge}"
    typography: "{typography.caption2}"
  tab-switcher-default:
    backgroundColor: "{colors.warm-paper-secondary}"
    rounded: "{rounded.md}"
    padding: "3px"
  tab-switcher-indicator:
    backgroundColor: "{colors.study-green}"
    rounded: "{rounded.md}"
  tab-switcher-active:
    textColor: "oklch(100% 0 0)"
  tab-switcher-inactive:
    textColor: "{colors.ink-muted}"
---

# Design System: Lumni

## 1. Overview

**Creative North Star: "The Warm Frame"**

Imagine a photograph in a quality frame. The frame is warm-toned wood with a soft green mat inside. You notice the photograph first always but the frame is why the photograph looks so good. The warmth keeps your eyes on the image. The green mat draws you into the composition. The beveled corners make the whole thing feel careful, intentional, worth your attention.

The interface works the same way. It is the frame, not the art. The art is the content: a question to answer, a flashcard to review, a topic to master. Every pixel of the frame exists to make that content clearer, warmer, more accessible. The warm paper neutrals (tinted toward 60deg hue at chroma 0.003) create the gallery wall. The single Study Green accent is the mat: purposeful, restrained, never decorative. The generous radii are the beveled edges that say "someone cared about this."

This system forbids anything that competes with the content. No gradient text that shouts for attention. No glass cards that layer confusion on distraction. No side-stripe borders that pretend to be design decisions. The frame disappears when the content is good. When the content is hard, the frame steadies the experience.

**Key Characteristics:**

- Warm paper neutrals tinted toward 60deg hue at chroma 0.0030.005. Pure gray reads cold. Warm reads like a desk lamp.
- Single Study Green accent on 10% or less of any surface. Its rarity gives it meaning: buttons, focus rings, selected states. Nothing decorative.
- Generous rounded corners (20px cards, 40px shells, 12px buttons) that feel physically safe to touch. Not sharp. Not cold.
- iOS-inspired typography scale with OS-quality tracking per size. Reading is effortless, not engineered.
- Multi-layer tonal stacking for depth (lighter surfaces on darker backgrounds). Shadows are atmospheric, not structural.
- 44pt minimum touch targets. Thumbs on a minibus, fingers after a long day: the interface does not penalize imprecision.
- Every transition uses `cubic-bezier(0.16, 1, 0.3, 1)`. Fast deceleration, no bounce. The app feels alive under your finger.

## 2. Colors: The Warm Paper + Study Green Palette

Restrained by design. Warm neutrals carry the room. Study Green arrives only to guide action. The palette is a pact: the surface stays quiet so the accent can speak.

### Primary

- **Study Green** (`oklch(52% 0.18 146)`): The accent that says "press here." Used for primary buttons, active states, selection fills, and focus rings. Never decorative. Its chroma is high enough to feel alive, its lightness controlled enough to never shout.
- **Study Green Bright** (`oklch(65% 0.18 146)`): Dark mode primary accent. Same hue, same chroma, lifted lightness so it reads legibly against the deep background.

### Neutral

- **Warm Paper** (`oklch(100% 0 0)`): The page surface. Bright but not clinical. Pure white pulled barely away from pure white.
- **Warm Paper Secondary** (`oklch(97% 0.003 60)`): The surface beneath a card, the fill of a grouped table. A whisper of warmth at 60deg hue.
- **Warm Paper Tertiary** (`oklch(95% 0.005 60)`): Pressed states, subtle fill areas, selected list row backgrounds. One step warmer, one step lower.
- **Surface** (`oklch(100% 0 0)`): Card and container faces. Bright and clean, elevated by the secondary that surrounds it.
- **Surface Secondary** (`oklch(97.8% 0.005 60)`): Elevated cards, hover fills, subtle container alternates.
- **Warm Paper Grouped** (`oklch(98.8% 0.003 60)`): Sectioned backgrounds like grouped table views and list sections. The quietest layer.
- **Ink** (`oklch(20% 0.02 264)`): Primary text. Very dark, cool-leaning gray (264deg hue). Reads as black but carries a trace of blue depth.
- **Ink Muted** (`oklch(20% 0.02 264 / 0.65)`): Secondary text, descriptions, metadata. Present but not demanding.
- **Ink Faint** (`oklch(20% 0.02 264 / 0.35)`): Placeholder text, disabled labels. Barely visible, on purpose.
- **Separator** (`oklch(0% 0 0 / 0.06)`): Borders, dividers, hairline rules. Structure should be felt, not seen.

### Semantic

- **Destructive** (`oklch(55% 0.18 25)`): Errors, wrong answers, destructive actions. Warm red (25deg hue) so it reads as urgent, not cold.
- **Success** (`oklch(65% 0.2 145)`): Correct answers, completions, positive feedback. Higher chroma than Study Green so it reads as achievement.
- **Warning** (`oklch(75% 0.15 70)`): Medium difficulty, cautionary feedback. Amber warmth that catches the eye without alarming.
- **Info** (`oklch(60% 0.15 240)`): Informational badges, help indicators. Neutral blue, no emotional charge.

### Chart

- Five colors mapped to `--chart-1` through `--chart-5`: emerald (52% 0.18 146), green (65% 0.2 145), amber (75% 0.15 70), blue (60% 0.15 240), red (55% 0.18 25). Used for data visualization only.

### Dark Mode

Dark inverts the tonal stack: base layer deepens to `oklch(10% 0.01 264)`, elevated surfaces brighten to `oklch(20% 0.02 264)`, and Study Green Bright (`oklch(65% 0.18 146)`) maintains the accent's legibility. The ambient hue shifts cooler (264deg) to match the dark environment while keeping a subtle blue note. Separators become lighter (`oklch(100% 0 0 / 0.12)`) against the dark foundation.

### Material / Glass

Six glass tiers for transient surfaces only, never for permanent architecture:

- **Ultra Thin** (10px blur, 30% opacity): The faintest frosted layer.
- **Thin** (20px blur, 60% opacity): Standard frosted effect.
- **Regular** (30px blur, 80% opacity): Navigation bars, sheet backgrounds.
- **Thick** (40px blur, 92% opacity): Modal overlays, dialogs.
- **Glass Card** (20px blur, 12% opacity): Transient card-like elements.
- **Glass Card Strong** (30px blur, 20% opacity): Elevated transient elements.

A card is never glass. Glass is for things that do not stay.

### Named Rules

**The One Voice Rule.** Study Green is used on 10% or less of any given screen. Its rarity is the point. When everything is highlighted, nothing is.

**The Warm Base Rule.** Every neutral surface is tinted toward a warm 60deg hue at chroma 0.0030.005. Pure gray reads cold; warm reads supportive.

**The Solid Furniture Rule.** Cards and containers are solid. Glass materials are for transient surfaces that slide in and out. Never build furniture out of glass.

## 3. Typography

**Display Font:** Outfit (800 weight) with system-ui sans fallback
**Body Font:** Geist (400, 500, 600, 800 weights) with system-ui sans fallback
**Mono Font:** Geist Mono (400, 500, 700 weights) with SF Mono / monospace fallback

**Character:** Outfit is the friendly classmate who explains the hard concept. Its geometric roundness makes headlines feel confident without aggression. Geist is the quiet one who writes the notes. Clean, fast, no wasted strokes. Together they read like a study session where someone actually knows the material.

### Hierarchy

- **Display** (800, 2.125rem / 34px, 1.2, `0.012em` tracking): Page titles and large hero headings. Reserved for top-level screens. Uses `--text-scale` for dynamic type.
- **Headline** (800, 1.75rem / 28px, 1.22, `0.014em` tracking): Section headers and major content area titles.
- **Title** (800, 1.375rem / 22px, 1.27, `-0.012em` tracking): Card titles, subsection headers, sheet titles.
- **Title 3** (600, 1.25rem / 20px, 1.25, `-0.023em` tracking): Subsection titles, feature headings.
- **Headline** (600, 1.0625rem / 17px, 1.3, `-0.026em` tracking): Bold emphasis, card headers, inline emphasis.
- **Body** (400, 1rem / 16px, 1.5, `-0.02em` tracking): Primary reading text, question content, descriptions. Capped at 6575ch line length.
- **Callout** (400, 0.9375rem / 15px, 1.4, `-0.016em` tracking): Compact body, secondary content.
- **Subhead** (400, 0.875rem / 14px, 1.35, `-0.011em` tracking): Labels, button text, metadata.
- **Footnote** (400, 0.8125rem / 13px, 1.4, `-0.006em` tracking): Fine print, helper text.
- **Caption 1** (400, 0.75rem / 12px, 1.3, `0em` tracking): Timestamps, footnotes, smallest readable text.
- **Caption 2** (400, 0.6875rem / 11px, 1.2, `0.006em` tracking): Legal text, tertiary metadata. Use sparingly.
- **Caption 3** (400, 0.625rem / 10px, 1.2, `0em` tracking): Badge text. Use only when absolutely necessary.

### Named Rules

**The OS Tracking Rule.** Letter-spacing values match Apple HIG specifications at every size. Do not override with generic 0.05em or 0.1em values. Use the project's `--tracking-*` custom properties.

**The Dynamic Type Rule.** All text sizes are multiplied by `--text-scale` (default 1.0, adjustable via JS). The system respects user font size preferences without breaking layout.

**The Font Jurisdiction Rule.** Outfit is for headings at 20px and above. Below 20px, Geist takes over. Each font has its job. Never use Outfit for labels, buttons, or data text.

## 4. Elevation

Depth comes from lightness, not from shadow. A card sits on a surface one step lighter or darker than its surroundings. Shadows are atmospheric, not structural. Hierarchy is established by background lightness first, shadow second.

### Shadow Vocabulary

- **Level 1** (`0 1px 2px oklch(0% 0 0 / 0.04), 0 1px 4px oklch(0% 0 0 / 0.02)`): The resting float. List groups, small cards. Barely visible, by design.
- **Level 2** (`0 2px 4px oklch(0% 0 0 / 0.04), 0 4px 12px oklch(0% 0 0 / 0.03), 0 8px 24px oklch(0% 0 0 / 0.02)`): Popovers, dropdowns, elevated cards. Present enough to separate, soft enough to not cast hard edges.
- **Level 3** (4-layer float up to `0 32px 64px oklch(0% 0 0 / 0.015)`): Modals, sheets, dialogs. The most elevated thing in the room.
- **Solver Glow** (`0 2px 8px oklch(52% 0.18 146 / 0.15)`): The only colored shadow. A green-tinted halo around the Solve button. It glows because it matters.

### Dark Mode Shadows

Shadows darken against the dark background: Level 1 uses 15% / 8% opacity, Level 2 uses 18% / 12% / 8%, Level 3 uses 20% / 15% / 10% / 6%. The Solver Glow uses `oklch(65% 0.18 146 / 0.2)`.

### Named Rules

**The Ambient Float Rule.** Shadows tint foreground surfaces upward; they do not carve depth into the page. Hierarchy is established by background lightness first, shadow second. A level-3 surface is still primarily distinguished by being lighter, not by its shadow being larger.

## 5. Components

### Buttons

Buttons answer when you touch them. Every variant scales down on press (`scale-[0.96]`) like a physical button giving under your finger. The 44px touch target means thumbs on a crowded bus stop do not miss.

- **Shape:** 12px radius by default.
- **Default:** Study Green background, white text, 16px horizontal padding, 44px height. Hover at 80% opacity. Focus-visible shows a 2px Study Green ring at 30% opacity.
- **Secondary:** Surface Secondary background, Ink text. Hover at 80% intensity.
- **Outline:** Transparent with Separator border. Hover fills with Separator color. Active state uses `aria-expanded:bg-muted`.
- **Ghost:** Transparent. Hover shows Warm Paper Secondary background.
- **Destructive:** Destructive red background, white text. Light mode uses a 10% tint variant with Destructive text; hover at 20% tint.
- **Link:** Text-only, underlined on hover. Study Green text.
- **Sizes:** default (44px h), sm (36px h), lg (48px h), xs (20px h), icon (44x44px with `after:-inset-2` touch target extension).
- **Motion:** `transition-[scale,background-color,box-shadow,color]` for GPU-friendly state changes. Active press scales to 0.96 and translates down 1px.

### Cards

Cards have corners so generous (20px standard, 40px at the shell) they feel safe to rest on. A near-invisible Separator border and level-1 shadow do the quiet work of containment.

- **Corner Style:** `rounded-card-lg` (40px) at the outermost wrapper. `rounded-lg` (20px) for standard cards.
- **Background:** `--system-surface` (white in light mode).
- **Border:** 1px `--system-separator` at 80% opacity.
- **Shadow:** `shadow-level-2`. Never hardcode shadow values.
- **Internal Padding:** 16px horizontal (`px-4`), 16px vertical (`py-4`). Reduced to 12px in `data-[size=sm]`.
- **States:** None at rest. Cards are containers, not interactive targets.
- **Sub-components:** CardHeader (title + action row), CardTitle (font-medium, Geist, 14px), CardDescription (Ink Muted, 12px), CardContent (px-4), CardFooter (border-t separator, flex).

### List Groups

Where cards contain, list groups navigate. Rounded containers (24px) with sections, each cell a full-width touch target.

- **ListGroup:** `rounded-xl` container with Separator border and level-1 shadow.
- **ListCell:** 56px minimum height, 20px horizontal padding, full-width touch target. Interactive cells highlight on hover and scale down on press.
- **Section Header:** Footnote-size (13px) in Ink Faint, uppercase with wide tracking.
- **Section Footer:** Caption 1-size (12px) in Ink Faint.

### Inputs / Fields

Inputs borrow the same rounded language as buttons (12px). A subtle fill replaces the hard bordered rectangle.

- **Style:** Warm Paper Secondary background, Separator border, 12px radius, 28px height (line-height controlled).
- **Focus:** Border shifts to Study Green, 2px Study Green ring at 30% opacity.
- **States:** Disabled at 50% opacity. Error shows Destructive border and ring.
- **Touch Target:** Minimum 44px height for all interactive controls via `--touch-target-min`.
- **Textarea:** Same base style, `field-sizing-content` for auto-height, 16px minimum height, `resize-none`.

### TabSwitcher / Segmented Control

Two variants, one behavior: spring-animated indicator follows your tap.

- **Tabs variant:** Warm Paper Secondary background tray (12px radius, 4px padding). Study Green pill indicator, white text on active, Ink Muted on inactive.
- **Segmented variant:** Surface Secondary tray (6px radius, 3px padding). Surface pill indicator with level-1 shadow, Study Green text on active, Ink Muted on inactive.
- **Motion:** Spring animation via Base UI's built-in animated indicator.

### Navigation Bar

A bar that knows when you are at the top of the page and when you are deep in content.

- **Background:** `--system-background / 80%` with 24px backdrop blur. During scroll collapse, `--system-background / 90%` with subtle bottom separator.
- **Height:** 48px (h-12).
- **Title:** 34px Outfit 800 at top of page, shrinks to 16px on scroll.
- **Back Button:** 36x36px ghost icon button, Study Green tint.

### Bottom Navigation

The primary mobile navigation, always present during app use.

- **Bar:** Fixed to bottom, 64px + safe area height. Glass-regular background (80% opacity, 24px blur). Level-2 shadow with subtle Separator ring.
- **Tabs:** Rounded-full tab bar with Study Green tint (`--system-accent-alpha-10` before pseudo-element). Active icon: Study Green with scale(1.1). Inactive: muted foreground.
- **Tools FAB:** 44px circular button, blue (`#007AFF` light / `#0A84FF` dark), level-3 shadow.

### Sidebar (Desktop)

The full navigation surface for large screens.

- **Width:** 240px (w-60).
- **Background:** Warm Paper Grouped / dark sidebar background.
- **Separator:** Right border, Separator at 50% opacity.
- **Search:** 36px height (h-9), 12px radius, System Fill background, Separator border. Focus: Study Green border and ring.
- **Items:** 16px horizontal padding. Active: Study Green at 10% opacity background, Study Green text, font-semibold. Inactive: muted foreground, hover fills with System Fill.

### Chips / Badges

Small, fast, expressive. 20px tall with 8px radius.

- **Default:** Study Green background, white text.
- **Secondary:** Surface Secondary background, Ink text.
- **Destructive:** Destructive at 10% tint, Destructive text.
- **Outline:** Separator border, foreground text.
- **Ghost:** Transparent, hover fills. Muted text.
- **Difficulty Chips:** Success tint for Easy, Warning tint for Medium, Destructive tint for Hard.

### Dropdown Menu

- **Content:** 12px radius, 4px padding. Surface background. Level-2 shadow with 1px Separator ring (fixes dark mode visibility). Fade-in + zoom-in animation on open.
- **Item:** 28px min height, 8px radius, 8px horizontal padding. Hover/focus: Accent background with Accent Foreground text.
- **Separator:** 1px Separator at 50% opacity.

### Switch

- **Track:** 28x17px (default) or 24x14px (sm). Rounded-full, muted background by default. Checked: Study Green background.
- **Thumb:** Circular, white. Checked translates to fill the track.
- **Touch Target:** `after:-inset-x-3 after:-inset-y-2` for 44pt compliance.

### Checkbox

- **Box:** 16x16px, 4px radius, Separator border. Checked: Study Green background with white checkmark icon.
- **Touch Target:** `after:-inset-x-3 after:-inset-y-2`.

### PageContainer

- **Default:** `mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-4xl xl:max-w-6xl`.
- **Wide:** `max-w-6xl xl:max-w-7xl` (home feed, admin dashboards).
- No page-level `max-w-*` or `px-*` outside PageContainer.

## 6. Motion

Motion exists only to clarify a change — never for decoration.

Most interactions should feel instant. A duration of `0ms` with no transition at all is often the snappiest and best choice; the call is context-dependent.

When motion genuinely helps — revealing an element, moving something to a new position, indicating arrival or departure — keep it short and physical:

| Context             | Duration | Easing                                  |
| ------------------- | -------- | --------------------------------------- |
| State changes       | 150ms    | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` |
| Popovers / tooltips | 200ms    | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` |
| Overlays / modals   | 300ms    | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` |

The easing is a fast-arrival overshoot curve — it accelerates quickly, overshoots by a tiny fraction, then settles. It reads as physical without being bouncy.

### Prohibited

- **No long animations**: Nothing above 500ms except deliberate, user-triggered celebrations (confetti, level-up). An animation longer than 500ms is a waiting room.
- **No looping**: `repeat: Infinity` on motion elements is decorative motion. Remove it. Loading indicators use CSS `animation`, not motion primitives.
- **No spring overshoots**: `type: "spring"` with non-zero `bounce` is prohibited. If you use a spring, `bounce: 0`.
- **No staggered entrances** on page load. Elements arrive when they arrive. Staggering says "watch me appear" instead of "here is the content."

### `prefers-reduced-motion`

Every motion-enabled component must wrap non-essential animations with `useReducedMotion()` from `motion/react`. Essential animations (progress feedback, loading skeletons) may remain. Drop the rest.

```tsx
import { useReducedMotion } from "motion/react";

const shouldReduce = useReducedMotion();
const transition = shouldReduce ? { duration: 0 } : { duration: 0.15, ease: motionEase };
```

### CSS transitions vs. motion primitives

Prefer CSS `transition` for simple property changes: `transition-[background-color,transform] duration-150`. Reserve motion primitives (`m.div`, `AnimatePresence`) for layout animations, enter/exit sequences, and drag gestures.

### Named Rules

**The Waiting Room Rule.** Any animation over 500ms makes the user wait. Content that arrives in stages does not feel premium — it feels slow.

**The No-Looping Rule.** `repeat: Infinity` on a motion element is decoration. Remove every instance. Use CSS `@keyframes` for loading indicators.

**The Clarify-Not-Decorate Rule.** If removing the animation makes the interface harder to understand, keep it. If removing it makes no difference, remove it.

## 7. 2026 Design Language — Ambient, Motion, & Easter Eggs

The app has been modernized with 2026 design trends while preserving the "Warm Frame" philosophy. Content still comes first, but the frame now breathes, responds, and occasionally delights.

### 7.0 2026 Trend Additions

The following trends were added in the July 2026 redesign:

| Trend | Implementation | Files |
|-------|---------------|-------|
| **Kinetic Typography** | Letter-by-letter reveal on scroll via IntersectionObserver | `kinetic-heading.tsx`, `globals.css` (`@keyframes letterReveal`) |
| **Grain Texture** | SVG noise filter overlay with CSS animation | `noise-overlay.tsx`, `globals.css` (`@keyframes grain`) |
| **Scroll-Driven Reveals** | IntersectionObserver-based entrance animations (6 directions) | `scroll-reveal.tsx` |
| **3D Magnetic Tilt** | CSS perspective transforms tracking mouse position | `magnetic-card.tsx`, `globals.css` (`.tilt-card`) |
| **Bento Grid Layouts** | Responsive grid with span support + 4 visual variants | `bento-grid.tsx` |
| **Enhanced Ambient Blobs** | 6 variants (default, subtle, quiz, auth, dashboard, study) | `ambient-gradient.tsx` |
| **Ripple Effects** | Expanding circle on click | `globals.css` (`@keyframes ripple`, `.ripple-container`) |
| **Glow Borders** | Animated gradient border via CSS mask | `globals.css` (`.animate-glow-border`) |
| **Particle Backgrounds** | Floating particle animation | `globals.css` (`@keyframes particleFloat`) |
| **Confetti** | Falling particle celebration | `globals.css` (`@keyframes confettiFall`) |
| **Text Shimmer** | Animated gradient text | `globals.css` (`.animate-text-shimmer`) |
| **Scan Line** | Moving scan line overlay | `globals.css` (`.scan-line`) |

### 7.1 Page Layout Pattern

Every app page follows a consistent shell:

```tsx
<div className="min-h-dvh bg-system-grouped pt-4 pb-24">
  <AmbientGradient />
  <PageContainer className="flex flex-col gap-6">
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: motionEase }}
    >
      <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Page Title</h1>
      <p className="text-muted-foreground text-sm">Page description</p>
    </m.div>
    {/* page content */}
  </PageContainer>
</div>
```

**Components used:**

- `<AmbientGradient />` — subtle floating radial blobs (3 variants: `default`, `subtle`, `quiz`)
- `<PageContainer>` — max-width wrapper (owns `max-w-*` and `px-*`)
- `<m.div>` — framer-motion fade-in entrance for headings
- `bg-system-grouped` — iOS-style grouped background

**Exceptions:** Homepage (marketing), admin pages, dev pages, immersive quiz/exam sessions intentionally differ.

### 7.2 Ambient Gradients

A shared `<AmbientGradient>` component at `src/components/shared/ambient-gradient.tsx` provides subtle floating radial gradients on every page. Three variants:

- **`default`** — Two large blobs (primary at top-right, chart-4 at bottom-left) with `animate-float-drift` (20s cycle, staggered)
- **`subtle`** — Lower opacity blobs offset differently, for pages with dense content
- **`quiz`** — Medium-sized blobs sized for the narrower quiz layout

The blobs are `pointer-events-none`, `blur-3xl`, and use CSS `@keyframes float-drift` for the slow organic drift. Always the first child inside the outer page wrapper.

### 7.3 Fade-In Entrances

Page headings fade in and translate up 12px on mount (`duration: 0.3s, ease: motionEase`). This is the primary entrance animation — it acknowledges the user has navigated without making them wait for a stagger sequence.

**Rules:**

- Headings only (h1 + subtitle), not content cards
- 300ms max (respects the waiting room rule)
- Skipped when `prefersReducedMotion()` is active
- Never staggered — content reveals as one unit

### 7.4 Card Interactions

Cards now have micro-interactions on hover/tap:

- **Gradient overlays:** Gradient that fades in on hover (`opacity-0 → opacity-100`, `duration-500`)
- **Arrow indicators:** Chevron arrow on the right side, fades in on hover
- **Scale on press:** `active:scale-[0.98]` for tactile feedback
- **Icon animation:** Icons scale up and rotate slightly on hover (`scale-110 rotate-[3deg]`)
- **Hover lift:** `hover:shadow-level-2` for perceived elevation

Applied via `group` + `group-hover:` utilities on card containers.

### 7.5 Staggered Card Grids

Card grids use framer-motion variants for staggered children:

```tsx
<m.div
  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.06 } },
  }}
>
  {items.map((item) => (
    <m.button
      key={item.label}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: motionEase }}
    >
      ...
    </m.button>
  ))}
</m.div>
```

Each card enters with a 60ms stagger delay. Total animation finishes well under 500ms for grids up to 8 items.

### 7.6 Magnetic 3D Cards (Desktop)

The problems page uses `MagneticCard` — a CSS 3D perspective transform that tracks mouse position:

```tsx
const handleMouseMove = (e: React.MouseEvent) => {
  if (!ref.current || prefersReducedMotion) return;
  const rect = ref.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  ref.current.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
};
```

- Desktop-only (no touch interference)
- Respects `prefersReducedMotion`
- Smooth spring reset on mouse leave
- Subtle 8° max rotation

### 7.7 High-Impact Hero

The homepage hero uses a morphing blob background that responds to mouse movement:

- **Morphing blob:** CSS `@keyframes morph-shape` (30% → 70% → 40% → 60% border-radius cycle) with a subtle drift
- **Interactive quiz demo card:** Clickable answer buttons with visual correct/incorrect feedback (green/red tint + icon)
- **Animated badge:** Pulsing glow badge via `animate-pulse-glow`
- **Gradient headline:** `bg-gradient-to-r from-foreground via-primary to-chart-4 bg-clip-text text-transparent` for subtle color shift
- **iOS large-title:** `ios-large-title` class for 34px Outfit 800 heading
- **Live indicator:** "No credit card. No limits." with ping dot

### 7.8 Aurora Background (Chat)

The chat page uses an aurora-style animated background:

- Multiple oversized radial gradient blobs positioned at different coordinates
- Each blob has a different `animation-delay` for phase variance
- Uses `animate-aurora-drift` for slow, layered movement
- Combined with `backdrop-blur` on the header and message containers
- Readability maintained via solid message bubbles with shadow

### 7.9 Sticky Headers

Settings page uses a two-part sticky header:

- **Save button bar:** Fixed top-0 with `backdrop-blur-xl`, shows save button + loading state
- **Tab bar:** Sticky below with scrollable pill-style tab buttons
- Content panels slide in/out via `AnimatePresence` with exit/enter transitions

The sticky save bar ensures the user never loses their changes when scrolling through long settings.

### 7.10 Quiz-Specific Patterns

- **Drag-to-navigate:** Active quiz questions support horizontal drag gestures to advance. Spring reset below threshold. Drag indicator with scale transform.
- **Segmented progress bar:** Animated segments with numeric counter (e.g., "3/10"). Each segment pulses on completion.
- **Ambient floating blobs:** Quiz-specific variant of AmbientGradient (smaller, more subdued).

### 7.11 Tab Navigation

Two tab patterns are used:

1. **Dashboard TabNav** — Spring-animated pill indicator with `layoutId="tab-indicator"`. Backdrop blur background. 3 tabs: Today, Practice, Analytics.
2. **Generic TabSwitcher** — Two variants: `tabs` (filled tray + pill) and `segmented` (light tray + elevated pill). Used for filter controls.

Both use framer-motion spring animations for the indicator under `AnimatedTabIndicator`.

### 7.12 Easter Egg System

Centralized in `EasterEggProvider` (`src/lib/shared/easter-egg-context.tsx`). Provides 4 easter eggs:

| Trigger                   | Effect       | Description                                             |
| ------------------------- | ------------ | ------------------------------------------------------- |
| Konami code (↑↑↓↓←→←→BA)  | Rainbow mode | Animated rainbow gradient overlay on entire viewport    |
| Logo 7 clicks             | Rainbow mode | Same rainbow overlay, triggered by rapid logo clicks    |
| Moon 5 clicks (dark mode) | Zen mode     | Calming blue gradient overlay with `animate-zen-ripple` |
| Search "42"               | Retro mode   | CRT scanline overlay with `animate-retro-scan`          |

**All easter eggs:**

- Are non-blocking overlays (dismiss on click/Escape)
- Non-essential (app works identically without them)
- Respect `prefersReducedMotion()` (skip animations)
- Use React Context for state, portal-style overlays for rendering
- Auto-dismiss after 8 seconds or manual dismiss

### 7.13 CSS Animation Keyframes

All animation keyframes are defined in `globals.css`:

```css
@keyframes float-drift {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, -20px);
  }
  100% {
    transform: translate(-10px, 10px);
  }
}
@keyframes aurora-drift {
  0% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(40px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}
@keyframes rainbow-shift {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}
@keyframes retro-scan {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 4px;
  }
}
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 8px oklch(52% 0.18 146 / 0.3);
  }
  50% {
    box-shadow: 0 0 20px oklch(52% 0.18 146 / 0.6);
  }
}
@keyframes morph-shape {
  0%,
  100% {
    border-radius: 60% 40% 30% 70%/60% 30% 70% 40%;
  }
  50% {
    border-radius: 30% 60% 70% 40%/50% 60% 30% 60%;
  }
}
```

### 7.14 Named Rules

**The Consistent Shell Rule.** Every app page uses `bg-system-grouped` + `AmbientGradient` + `PageContainer` + fade-in heading. No page invents its own layout. The shell is the frame; the page is the art.

**The Head-Only Fade Rule.** Only page headings get fade-in entrance animation. Content arrives when it arrives. Stagger is for card grids, not for page sections.

**The All-Eggs-Non-Blocking Rule.** Easter eggs are overlays, not redirects. They never interrupt a study session, never change app state, and never persist. If the user refreshes, the egg is gone.

## 7.15 Page Redesign Status

As of the July 2026 redesign batch, the page-shell update is complete: every major app route is wrapped with the new 2026 visual shell (AmbientGradient + NoiseOverlay + grouped background). No further page shell updates are required unless new routes are added later.

| Page | Path | Variant |
|------|------|---------|
| Homepage | `src/components/home/home-content.tsx` | default + confetti easter egg |
| Dashboard | `src/components/dashboard/dashboard-content.tsx` | dashboard |
| Quiz | `src/app/[locale]/quiz/page.tsx` | quiz |
| Flashcards | `src/app/[locale]/flashcards/page.tsx` | study |
| Settings | `src/app/[locale]/settings/page.tsx` | subtle |
| Study | `src/app/[locale]/study/page.tsx` | study |
| Progress | `src/app/[locale]/progress/page.tsx` | dashboard |
| Exam Dates | `src/app/[locale]/exam-dates/page.tsx` | dashboard |
| Chat | `src/app/[locale]/chat/page.tsx` | default |
| Search | `src/app/[locale]/search/page.tsx` | subtle |
| Leaderboard | `src/app/[locale]/leaderboard/page.tsx` | dashboard |
| Review | `src/app/[locale]/review/page.tsx` | study |
| Study Guide | `src/app/[locale]/study-guide/page.tsx` | study |
| Problems | `src/app/[locale]/problems/page.tsx` | study |
| Dictionary | `src/app/[locale]/dictionary/page.tsx` | default |
| Auth | `src/app/[locale]/auth/layout.tsx` | auth |
| Sidebar | `src/components/navigation/sidebar-nav.tsx` | glass sidebar |

Each page wrapper uses:
- `<AmbientGradient variant="...">` — subtle floating blobs
- `<NoiseOverlay opacity={0.015}>` — grain texture
- `bg-system-grouped` — warm grouped background
- Existing page content unchanged inside wrapper

## 8. Do's and Don'ts

### Do:

- **Do** let Study Green be rare. 10% or less of any surface. When it appears, it should mean something: a button, a focus ring, a selected state.
- **Do** tint every neutral toward 60deg warmth at chroma 0.0030.005. Pure gray reads like a hospital. Warm reads like a desk lamp.
- **Do** use Outfit 800 for headings and Geist 400 for body. This pairing is the voice of a friend who knows the material.
- **Do** make every interactive element at least 44x44pt. Thumbs on a minibus, fingers after a long day: the interface does not penalize imprecision.
- **Do** layer depth through lightness first. A surface one step lighter or darker than its background is hierarchy. A shadow is atmosphere.
- **Do** use the motion easing (`cubic-bezier(0.175, 0.885, 0.32, 1.1)`) for every transition. Fast arrival with a tiny overshoot reads as physical. See the [Motion](#6-motion) section for durations.
- **Do** animate only `transform` and `opacity`. Layout properties cause reflow. The page should not stutter.
- **Do** show skeleton shapes while content loads. A spinner says "wait." A skeleton says "something is coming."
- **Do** set `aspect-ratio` on every image and embedded media.
- **Do** use `gap-*` for all vertical and horizontal spacing between siblings. One source of truth.
- **Do** wrap every page in `<PageContainer>` (except home feed and admin dashboards).
- **Do** use design tokens for shadows (`shadow-level-*`), radii (`rounded-*`), and z-index (`--z-*`). Tokens keep dark mode in sync automatically.

### Don't:

- **Don't** use gradient text. `background-clip: text` with a gradient is decoration pretending to be typography. Use solid Study Green or Ink. Emphasis comes from weight and size.
- **Don't** use side-stripe borders. A 3px `border-left` in Study Green on a card is not a design decision. It is a reflex. Use full borders, background tints, a leading number or icon, or nothing.
- **Don't** make cards out of glass. Glass materials (backdrop-filter blur) are for transient surfaces that slide in and out. Cards are furniture. Furniture is solid.
- **Don't** build the hero-metric template. Big number. Small label. Supporting stat. Gradient accent. SaaS cliche. The student does not need to be impressed. They need to study.
- **Don't** repeat the same card grid across the page. Icon. Heading. Text. Every card different or the grid is wrong.
- **Don't** reach for a modal first. Inline disclosure, progressive expansion, a sheet from the bottom: exhaust these before a modal. Modals interrupt. Studying requires flow.
- **Don't** put Outfit in labels, buttons, or data text. Outfit is for headings above 20px. Below that, Geist takes over.
- **Don't** invent new affordances. A button that does not look like a button, a scrollbar that disappears, a form control with no visible boundary: these do not feel premium. They feel broken.
- **Don't** paint inactive states with full color. Disabled is 50% opacity, period. Not a desaturated version of the active color.
- **Don't** bounce. Elastic easings, spring overshoots (except the motion curve), bouncy buttons: prohibited. Use the motion easing `cubic-bezier(0.175, 0.885, 0.32, 1.1)` for everything.
- **Don't** use dark mode as an excuse for purple gradients, neon accents, or glassmorphism. Dark mode shifts cooler (264deg hue) and lifts the accent. The voice stays the same.
- **Don't** spray `will-change` across elements. Apply it to one or two specific properties that genuinely benefit from GPU compositing.
- **Don't** lazy load the hero. Above-fold content loads eagerly. Lazy loading is for content below the fold.
- **Don't** write arbitrary pixel values (`w-[200px]`, `text-[13px]`, `min-h-[250px]`). They bypass the design system and break dark mode, responsive scaling, and dynamic type.
- **Don't** hardcode shadow values. Use `shadow-level-1`, `shadow-level-2`, and `shadow-level-3`.
- **Don't** use `space-y-*` or manual `mt-* mb-*` pairs for sibling spacing. Use `gap-*` on the parent container.
- **Don't** write magic z-index numbers. Use `--z-content`, `--z-elevated`, `--z-sticky`, `--z-header`, `--z-drawer`, `--z-cookie-banner`, `--z-modal`, `--z-overlay`, `--z-toast`, `--z-skip-link`.
- **Don't** create page-level layout rules outside of `<PageContainer>`. The container owns the canvas; pages own the content.
