# Lumni Design System — Apple HIG-Inspired Specification

**Date:** 2026-05-13
**Status:** Living Document
**Stack:** Next.js 16 + Tailwind CSS v4 + Framer Motion + Geist + Phosphor Icons

---

## 1. Design Principles

### Clarity

- Content is the primary interface. Chrome recedes.
- Generous whitespace, minimal borders, subtle separators.
- Every element earns its place; nothing decorative without purpose.

### Deference

- Typography and spacing prioritize readability over visual flourish.
- Materials (frosted glass) sit behind content, never compete.
- Accent color reserved for interactive elements and key data highlights.

### Depth

- Layered hierarchy: background → surface → elevated → modal.
- Multi-layer shadows simulate physical floating (level 1–3).
- Directional page transitions encode navigation history spatially.

---

## 2. Color System

### Color Space

All colors are defined in **OKLCH**, which provides perceptually uniform lightness and consistent hue across light/dark modes. This eliminates the cross-fade desaturation problem of HSL.

| Token                           | Light                   | Dark                   |
| ------------------------------- | ----------------------- | ---------------------- |
| `--system-background`           | `oklch(100% 0 0)`       | `oklch(10% 0.01 264)`  |
| `--system-background-secondary` | `oklch(97% 0.003 60)`   | `oklch(12% 0.012 264)` |
| `--system-background-tertiary`  | `oklch(95% 0.005 60)`   | `oklch(14% 0.015 264)` |
| `--system-background-elevated`  | `oklch(100% 0 0)`       | `oklch(20% 0.02 264)`  |
| `--system-grouped-background`   | `oklch(98.8% 0.003 60)` | `oklch(8% 0.01 264)`   |

### Semantic Hierarchy (Apple's model)

| Layer                     | Usage                                             |
| ------------------------- | ------------------------------------------------- |
| `background`              | Root page background                              |
| `background-secondary`    | Section backgrounds, grouped lists                |
| `background-tertiary`     | Nested groups inside secondary                    |
| `background-elevated`     | Sheets, popovers, modals (brighter in dark mode)  |
| `grouped-background`      | Sidebar, grouped table views                      |
| `surface`                 | Card foregrounds                                  |
| `surface-secondary`       | Elevated cards, hover states                      |
| `fill` / `fill-secondary` | Button fills, progress tracks, slider backgrounds |

### Text Hierarchy

| Token                     | Opacity / Value | Usage                  |
| ------------------------- | --------------- | ---------------------- |
| `--system-text-primary`   | 100%            | Body copy, headings    |
| `--system-text-secondary` | 65%             | Labels, subtitles      |
| `--system-text-tertiary`  | 35%             | Placeholder, footnotes |
| `--label-quaternary`      | 18%             | Disabled, decorative   |

Dark mode raises lightness (`oklch(98%)` base) and reverses luminosity stacking: elevated layers are _lighter_ than the base page, matching iOS.

### Accent Colors

| Token             | OKLCH Value           | Role                                                |
| ----------------- | --------------------- | --------------------------------------------------- |
| `--system-accent` | `oklch(55% 0.22 235)` | Slate Blue — interactive elements, active tab, link |

Alpha variants: `--system-accent-alpha-10/20/30` for backgrounds, selected states, hover fills.

### Semantic Colors

| Token                  | Light OKLCH    | Usage                            |
| ---------------------- | -------------- | -------------------------------- |
| `--system-success`     | `65% 0.2 145`  | Correct answers, completion      |
| `--system-destructive` | `55% 0.18 25`  | Errors, destructive actions      |
| `--warning`            | `75% 0.15 70`  | Warnings, low-confidence answers |
| `--info`               | `60% 0.15 240` | Information banners, hints       |

### Chart Colors

Five tokens (`--chart-1` through `--chart-5`) covering emerald, green, amber, blue, red — designed to be distinguishable by hue alone and accessible to deuteranopia.

### Dark Mode Elevation Rule

Apple's convention: **base layers are dim, elevated layers are bright**. In light mode the reverse is true:

- Light mode: `background (white) → tertiary (grey-tinged) → elevated (white)`
- Dark mode: `background (near-black) → tertiary (lighter) → elevated (brightest)`

### CSS Variable Naming

```
--system-{role}-{modifier?}    (e.g. --system-background-secondary)
--material-{tier}              (e.g. --material-ultra-thin)
--shadow-level-{1|2|3}
--space-{n}
--fs-{text-style}
--tracking-{text-style}
--radius-{component}
--ease-ios-{curve}
--color-{name}                 (Tailwind v4 @theme inline alias)
```

---

## 3. Typography

### Font Stack

| Role             | Font                           | Weight Range       |
| ---------------- | ------------------------------ | ------------------ |
| Sans (body/UI)   | **Geist** (SF Pro alternative) | 400, 500, 600, 800 |
| Mono (code/data) | **Geist Mono**                 | 400, 500, 700      |
| Heading          | Geist (via `--font-heading`)   | 800                |

Loaded via `next/font/google` in `src/app/fonts.ts` with `display: swap` and `preload: true`.

### iOS Type Scale

All sizes use `rem` units and respect the `--text-scale` CSS variable for Dynamic Type.

| Style       | Size (rem/px)    | Weight | Line Height | Tracking (em) | Apple Equivalent           |
| ----------- | ---------------- | ------ | ----------- | ------------- | -------------------------- |
| Large Title | 2.125rem / 34px  | 800    | 1.2         | +0.012        | UIFontTextStyleLargeTitle  |
| Title 1     | 1.75rem / 28px   | 800    | 1.22        | +0.014        | UIFontTextStyleTitle1      |
| Title 2     | 1.375rem / 22px  | 800    | 1.27        | -0.012        | UIFontTextStyleTitle2      |
| Title 3     | 1.25rem / 20px   | 600    | 1.25        | -0.023        | UIFontTextStyleTitle3      |
| Headline    | 1.0625rem / 17px | 600    | 1.3         | -0.026        | UIFontTextStyleHeadline    |
| Body        | 1rem / 16px      | 400    | 1.5         | -0.020        | UIFontTextStyleBody        |
| Callout     | 0.9375rem / 15px | 400    | 1.5         | -0.016        | UIFontTextStyleCallout     |
| Subhead     | 0.875rem / 14px  | 400    | 1.35        | -0.011        | UIFontTextStyleSubheadline |
| Footnote    | 0.8125rem / 13px | 400    | 1.4         | -0.006        | UIFontTextStyleFootnote    |
| Caption 1   | 0.75rem / 12px   | 400    | 1.3         | 0             | UIFontTextStyleCaption1    |
| Caption 2   | 0.6875rem / 11px | 400    | 1.2         | +0.006        | UIFontTextStyleCaption2    |

Tracking values are converted from Apple's 1/1000em figures per the HIG and applied via `letter-spacing` on both CSS variables and utility classes. Body text at 16px uses `-0.02em` letter-spacing, matching iOS default.

### Dynamic Type

Controlled by `--text-scale` on `:root` (default `1`). JavaScript can set it:

```js
document.documentElement.style.setProperty("--text-scale", "1.25");
```

All `.ios-*` utility classes multiply their font size by this factor.

### Utility Classes

| Class              | Purpose           |
| ------------------ | ----------------- |
| `.ios-large-title` | 34px bold heading |
| `.ios-title-1`     | 28px bold heading |
| `.ios-title-2`     | 22px bold heading |
| `.ios-title-3`     | 20px semibold     |
| `.ios-headline`    | 17px semibold     |
| `.ios-body`        | 16px body text    |
| `.ios-subhead`     | 14px subheading   |
| `.ios-footnote`    | 13px footnote     |
| `.ios-caption-1`   | 12px caption      |
| `.ios-caption-2`   | 11px caption      |

All classes apply `font-family: var(--font-heading)` for title/headline rows, and automatically scale via `var(--text-scale)`.

---

## 4. Spacing & Layout

### 8-Point Grid

| Token        | Value | Usage                     |
| ------------ | ----- | ------------------------- | ---------------- |
| `--space-1`  | 4px   | Micro spacing, icon inset |
| `--space-2`  | 8px   | Tight gaps, chip spacing  |
| `--space-3`  | 12px  |                           | % 44pt half-grid |
| `--space-4`  | 16px  | Standard section padding  |
| `--space-5`  | 20px  | Card inner padding        |
| `--space-6`  | 24px  | Section gaps              |
| `--space-8`  | 32px  | Large section spacing     |
| `--space-10` | 40px  | Page inset padding        |
| `--space-11` | 44px  | 44pt minimum touch target |
| `--space-12` | 48px  | Generous page padding     |
| `--space-16` | 64px  | Max section spacing       |

### Touch Targets

**Minimum: 44×44pt** (`--touch-target-min`). Utility classes: `.min-touch` (both axes), `.min-touch-h` (height), `.min-touch-w` (width).

### Section Spacing Patterns

| Utility           | Value             |
| ----------------- | ----------------- |
| `.section-gap`    | `padding: 16px 0` |
| `.section-gap-lg` | `padding: 24px 0` |

### Corner Radii

| Token                 | Value | Component         |
| --------------------- | ----- | ----------------- |
| `--radius-button`     | 12px  | Buttons, inputs   |
| `--radius-card`       | 20px  | Cards, containers |
| `--radius-sheet`      | 24px  | Modal sheets      |
| `--radius-input`      | 12px  | Form inputs       |
| `--radius-badge`      | 8px   | Badges, tags      |
| `--radius-tab-bar`    | 20px  | Tab bar           |
| `--radius-list-group` | 20px  | Grouped lists     |

Tailwind v4 mappings via `@theme`: `--radius-sm` → badge (8px), `--radius-md` → button (12px), `--radius-lg` → card (20px), `--radius-xl` → sheet (24px), `--radius-2xl` → 28px, `--radius-3xl` → 32px.

### Shadow Levels

Multi-layer soft float shadows. Each level layers progressively wider, more transparent blurs:

| Level | Layers                               | Use                       |
| ----- | ------------------------------------ | ------------------------- |
| 1     | 2 layers (1px, 4px blur)             | Small cards, buttons      |
| 2     | 3 layers (2px, 4px, 8px blur)        | Elevated cards, dropdowns |
| 3     | 4 layers (2px, 8px, 16px, 32px blur) | Modals, sheets, popovers  |

Dark mode shadows are more pronounced (higher opacity) to maintain depth perception on dark backgrounds.

### Safe Area Insets

| Variable            | Source                             |
| ------------------- | ---------------------------------- |
| `--spacing-safe-pb` | `env(safe-area-inset-bottom, 0px)` |
| `--spacing-safe-pt` | `env(safe-area-inset-top, 0px)`    |

Utility classes: `.pb-safe`, `.pt-safe`.

---

## 5. Navigation

### Bottom Tab Bar (`bottom-nav.tsx`)

- **Height:** 49px (`calc(49px + env(safe-area-inset-bottom))`)
- **Style:** Translucent (`bg-system-background/80 backdrop-blur-xl`), hairline top border
- **Icons:** Filled style from Hugeicons, 25px, tint-only active state
- **Labels:** Sentence-case, 10px font, `--tracking-caption-1` letter-spacing
- **Active state:** `text-system-accent` for both icon and label
- **Inactive state:** `text-system-text-tertiary`
- **Visibility:** Hidden on `md:` breakpoint and above (defer to sidebar)
- **Chat & Practice:** Open dialog/sheet instead of navigating (modal actions at tab level)
- **Badges:** Destructive-red pill, up to "99+"

Items: Home, Syllabus, Chat, Practice, Settings.

### Desktop Sidebar (`desktop-sidebar.tsx`)

- **Width:** 256px (w-64)
- **Visibility:** `hidden md:flex`
- **Background:** `bg-system-grouped` with right border
- **Pattern:** Primary items grouped at top, Settings separated by a hairline at bottom
- **Item height:** 40px (h-10), rounded-lg
- **Active state:** `bg-system-accent/10 text-system-accent font-semibold`
- **Hover state:** `bg-system-fill`
- **Icon size:** 20px (size-5)
- **Chat & Practice:** Same modal/sheet behavior as tab bar

### Navigation Bar (`navigation-bar.tsx`)

- **Position:** Sticky top, z-20
- **Collapse behavior:** Title shrinks from 34px large-title to 16px headline on scrollY > 20px
- **Background:** Transparent at top → `bg-system-background/90 backdrop-blur-xl` when collapsed
- **Separator:** 0.5px hairline that fades in on collapse
- **Back button:** Hugeicons `ArrowLeft01Icon` (via `@hugeicons/core-free-icons`), 20px, `text-system-accent`, -ml-1.5 offset to match iOS back chevron position
- **Subtitle:** Hidden when collapsed
- **Bottom section:** Slot for tabs/search (hidden when collapsed)

### Directional Page Transitions

Two systems coexist:

1. **`useNavigationDirection` hook** — depth-based routing. A flat hierarchy map assigns numeric depth to paths. Forward navigation slides content in from the right (`+80px → 0`), back navigation slides out to the right (`0 → +60px`). Uses `iOSDecelerate` (arrival) and `iOSAccelerate` (departure) curves.

2. **`DirectionalTransitionContext`** — React context for components that need to know animation direction. `DirectionalTransition` accepts explicit or context-sourced direction.

3. **Swipe-back gesture** — `PageTransition` component binds Framer Motion `drag="x"` on back-navigation pages. Dismissal threshold: `offset.x > 60 || velocity.x > 300`. Gesture-driven dismissal uses `spring` physics for interactive feel.

4. **View Transitions API** — `useViewTransition` hook wraps `document.startViewTransition`. CSS keyframes: `vt-slide-from-right`, `vt-slide-to-left`, `vt-morph-in`, `vt-morph-out`. Morph transitions animate trigger element into sheet header.

5. **Reduced motion guard** — All transitions skip to instant rendering when `prefers-reduced-motion: reduce` is detected (`useReducedMotion()` from Framer Motion).

---

## 6. Iconography

### Primary Library: Phosphor Icons

| Variant           | Usage                                               | Props                                                                     |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Outline (default) | Tab bar navigation icons, action buttons, inline UI | Default import from `@phosphor-icons/react`, 25px tab bar, 16–20px inline |
| Decorative        | aria-hidden                                         | Always add `aria-hidden="true"`                                           |

### Size Conventions

| Context                    | Size Class    | Pixel |
| -------------------------- | ------------- | ----- |
| Inline with body text      | `size-4`      | 16px  |
| With headlines, list items | `size-5`      | 20px  |
| Tab bar icons              | `size-[25px]` | 25px  |
| Back chevron               | `size-5`      | 20px  |
| Sidebar items              | `size-5`      | 20px  |

### Rendering

Icons are imported by name from `@phosphor-icons/react`:

```tsx
import { House, Notebook } from "@phosphor-icons/react";

<House className="size-5" aria-hidden="true" />;
```

---

## 7. Motion

### Apple's Three Motion Curves

All defined as CSS variables and Framer Motion presets:

| Curve                  | CSS Variable            | Cubic Bezier            | Usage                        |
| ---------------------- | ----------------------- | ----------------------- | ---------------------------- |
| Decelerate (arrival)   | `--ease-ios-decelerate` | `(0, 0, 0.2, 1)`        | Elements entering screen     |
| Accelerate (departure) | `--ease-ios-accelerate` | `(0.4, 0, 1, 1)`        | Elements leaving screen      |
| Spring (gesture)       | `--ease-ios-spring`     | `(0.34, 1.56, 0.64, 1)` | Interactive gestures, bounce |
| General iOS ease       | `--ease-ios`            | `(0.16, 1, 0.3, 1)`     | General UI transitions       |

### Framer Motion Presets (`src/lib/utils/animation.ts`)

| Export                  | Type       | Properties                                  |
| ----------------------- | ---------- | ------------------------------------------- |
| `fastTransition`        | Transition | 200ms, `iOSEase`                            |
| `normalTransition`      | Transition | 350ms, `iOSDecelerate`                      |
| `slowTransition`        | Transition | 500ms, `iOSDecelerate`                      |
| `pageEnterForward`      | Transition | 350ms, `iOSDecelerate`                      |
| `pageExitBack`          | Transition | 250ms, `iOSAccelerate`                      |
| `pageSpring`            | Transition | spring: stiffness 350, damping 35, mass 0.8 |
| `springTransition`      | Transition | spring: stiffness 400, damping 30           |
| `springStiffTransition` | Transition | spring: stiffness 500, damping 35           |
| `springGesture`         | Transition | spring: stiffness 600, damping 40, mass 0.5 |
| `fadeInUp`              | Variants   | 8px → 0, 350ms decelerate                   |
| `fadeInScale`           | Variants   | scale 0.96 → 1, 350ms decelerate            |
| `fadeInLeft`            | Variants   | x -8 → 0, 350ms decelerate                  |
| `tabContent`            | Variants   | y 4 → 0 (enter), y -4 (exit)                |
| `pageSlideVariants`     | Variants   | Direction-aware ±60px slide                 |
| `sheetVariants`         | Variants   | y 100% → 0, accelerate out                  |
| `popoverVariants`       | Variants   | scale 0.95 → 1, fade                        |

### CSS Animation Classes

| Class                    | Keyframe             | Timing                |
| ------------------------ | -------------------- | --------------------- |
| `.animate-fade-in-up`    | fadeInUp             | 400ms ease-ios        |
| `.animate-fade-in-scale` | fadeInScale          | 400ms ease-ios        |
| `.animate-icon-pop`      | iconPop              | 200ms ease-ios        |
| `.animate-checkmark`     | checkmark            | 400ms ease-ios        |
| `.animate-shimmer`       | shimmer              | 2s linear infinite    |
| `.animate-stagger`       | fadeInUp (per-child) | 50ms delay increments |

### Stagger Convention

`.animate-stagger` on a parent element animates children sequentially with 50ms delay per child (up to 5 children, 0–200ms). Used for list entrances and card grids.

### View Transition Keyframes

For use with the View Transitions API (`document.startViewTransition`):

- `vt-slide-from-right` / `vt-slide-to-left` — forward page navigation
- `vt-slide-from-left` / `vt-slide-to-right` — back page navigation
- `vt-morph-in` / `vt-morph-out` — morph trigger → sheet transition

Named view-transition names: `practice-trigger`, `root`.

---

## 8. Materials (Liquid Glass)

### Five Frosted Glass Tiers

| Class                | Opacity   | Blur | Usage                                    |
| -------------------- | --------- | ---- | ---------------------------------------- |
| `.glass-ultra-thin`  | 30% white | 10px | Subtle backdrop on light elements        |
| `.glass-thin`        | 60% white | 20px | Navigation bars, toolbars                |
| `.glass-regular`     | 80% white | 30px | Sheet backgrounds                        |
| `.glass-card`        | 12% white | 20px | Card backgrounds, 1px separator          |
| `.glass-card-strong` | 20% white | 30px | Elevated card backgrounds, 1px separator |

Dark mode variants use dark-tinted backgrounds (`oklch(10%)` to `oklch(20%)`).

### Glass Card Utilities

| Class                | Background | Blur | Border        |
| -------------------- | ---------- | ---- | ------------- |
| `.glass-card`        | 12% white  | 20px | 1px separator |
| `.glass-card-strong` | 20% white  | 30px | 1px separator |

### Vibrancy

```css
.vibrant-text {
  filter: brightness(var(--material-vibrancy));
}
```

`--material-vibrancy`: `1.2` in light mode, `1.3` in dark mode. Applied to text rendered on glass backgrounds to compensate for contrast loss.

### Usage Pattern

```html
<div class="glass-card rounded-[20px]">
  <span class="vibrant-text">Content on glass</span>
</div>
```

Always pair glass classes with a background color fallback for browsers that don't support `backdrop-filter`.

---

## 9. Accessibility

### Dynamic Type

All font sizes defined in `rem` and scaled by `--text-scale`. Users with accessibility font size preferences at the OS/browser level inherit scaling automatically. The CSS variable can be set programmatically for in-app text size adjustment.

### Touch Targets

Apple HIG minimum 44×44pt enforced via:

- CSS variable `--touch-target-min: 44px`
- Utility classes `.min-touch`, `.min-touch-h`, `.min-touch-w`
- Component conventions: nav items, buttons, and interactive elements respect this minimum

### Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--system-accent);
  outline-offset: 2px;
}
```

Applied globally at the `@layer base` level. All interactive elements receive visible focus rings.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Framer Motion's `useReducedMotion()` hook disables page transitions and gesture animations at runtime.

### ARIA

- Tab bar: `<nav aria-label="Main navigation">`, `aria-current="page"` on active item
- Sidebar: `<aside aria-label="Sidebar navigation">`, `<nav aria-label="Primary">`
- Back button: `aria-label="Go back"`
- Decorative icons: `aria-hidden="true"` on all Hugeicons that are not interactive
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<aside>` used throughout

---

## 10. File Organization

### Key Files

| File                                               | Role                                                                                                     |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/app/globals.css`                              | All CSS custom properties, Tailwind v4 `@theme`, base styles, utility classes, keyframes, reduced motion |
| `src/app/fonts.ts`                                 | Geist + Geist Mono font loading via `next/font/google`                                                   |
| `src/lib/utils/animation.ts`                       | Framer Motion presets: curves, transitions, variants (page, sheet, popover, stagger)                     |
| `src/hooks/use-navigation-direction.ts`            | Depth-based navigation direction for page transitions                                                    |
| `src/hooks/use-view-transition.ts`                 | View Transitions API wrapper                                                                             |
| `src/components/ui/navigation-bar.tsx`             | Collapsible iOS-style navigation bar                                                                     |
| `src/components/navigation/bottom-nav.tsx`         | Mobile bottom tab bar (49px)                                                                             |
| `src/components/navigation/desktop-sidebar.tsx`    | Desktop sidebar (256px, grouped)                                                                         |
| `src/components/layout/page-transition.tsx`        | Page-level AnimatePresence with swipe-back gesture                                                       |
| `src/components/layout/directional-transition.tsx` | Context provider for directional navigation                                                              |
| `src/components/shared/anim.tsx`                   | Shared animation wrapper                                                                                 |

### How to Use the Design System

**Import CSS** — `globals.css` is imported in the root layout. All CSS variables and utility classes are globally available.

**Use iOS utility classes** — Apply `.ios-large-title`, `.ios-body`, `.ios-caption-1` etc. directly in JSX `className`:

```tsx
<h1 className="ios-large-title">Dashboard</h1>
<p className="ios-body">Welcome back</p>
```

**Use Tailwind system color tokens** — All Apple-semantic colors are available as Tailwind utilities via the `@theme` mapping:

```tsx
<div className="bg-system-background-secondary text-system-text-primary">
<button className="text-system-accent">
```

**Reference CSS variables directly** — For custom properties not in `@theme`:

```tsx
<div style={{ letterSpacing: "var(--tracking-body)" }}>
```

**Compose glass materials** — Use glass utility classes for frosted surfaces:

```tsx
<nav className="glass-regular backdrop-blur-xl">
```

**Animate with presets** — Import from `@/lib/utils/animation`:

```tsx
import { pageSlideVariants, iOSDecelerate } from "@/lib/utils/animation";
```

### Design Token Inventory (Complete)

| Category          | Count          | Prefix                                                            |
| ----------------- | -------------- | ----------------------------------------------------------------- |
| Background colors | 5              | `--system-background*`                                            |
| Surface colors    | 2              | `--system-surface*`                                               |
| Fill colors       | 2              | `--system-fill*`                                                  |
| Text colors       | 4              | `--system-text-primary` through `--label-quaternary`              |
| Accent colors     | 1 + 3 alpha    | `--system-accent*`                                                |
| Semantic colors   | 4              | `--system-success`, `--system-destructive`, `--warning`, `--info` |
| Chart colors      | 5              | `--chart-1` through `--chart-5`                                   |
| Material tiers    | 6              | `--material-*`                                                    |
| Shadow levels     | 3              | `--shadow-level-*`                                                |
| Spacing           | 12             | `--space-*` (4px–64px)                                            |
| Font sizes        | 11             | `--fs-*` (34px–11px)                                              |
| Tracking values   | 11             | `--tracking-*`                                                    |
| Corner radii      | 7              | `--radius-*`                                                      |
| Motion curves     | 4              | `--ease-ios-*`                                                    |
| Safe area         | 2              | `--spacing-safe-*`                                                |
| **Total**         | **~75 tokens** |                                                                   |
