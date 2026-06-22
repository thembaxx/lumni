# iOS Native Redesign — Design Spec

**Date**: 2026-05-11
**Status**: Approved for implementation
**Applies to**: Lumni web app (Next.js 16, React 19, Tailwind v4, shadcn/ui)

---

## Overview

Redesign the Lumni web app to feel structurally and visually native to iOS, following Apple's Human Interface Guidelines (HIG) conventions for layout, navigation, typography, spacing, controls, and motion — without adopting Liquid Glass. Preserve the existing monochrome brand identity (black/white base) and Geist font family, but apply iOS-native patterns throughout.

---

## 1. Design Token System

### 1.1 Color Tokens

Preserve existing `#000000` / `#ffffff` base. Add iOS-style semantic tokens.

| Token                         | Light            | Dark             | Usage                                     |
| ----------------------------- | ---------------- | ---------------- | ----------------------------------------- |
| `--system-background`         | `#ffffff`        | `#000000`        | Root page background                      |
| `--system-grouped-background` | `#f2f2f7`        | `#1c1c1e`        | Grouped list/section backgrounds          |
| `--system-surface`            | `#ffffff`        | `#1c1c1e`        | Cards, sheets, popovers                   |
| `--system-surface-secondary`  | `#f2f2f7`        | `#2c2c2e`        | Secondary surface (e.g. search bar bg)    |
| `--system-separator`          | `#c6c6c8` at 60% | `#38383a` at 60% | Hairline separators (0.33px)              |
| `--system-accent`             | `#007AFF`        | `#0A84FF`        | All interactive elements, primary actions |
| `--system-text-primary`       | `#000000`        | `#ffffff`        | Primary labels (existing foreground)      |
| `--system-text-secondary`     | `#3c3c43` at 60% | `#ebebf5` at 60% | Secondary labels, subtitles               |
| `--system-text-tertiary`      | `#3c3c43` at 30% | `#ebebf5` at 30% | Tertiary labels, placeholders             |
| `--system-destructive`        | `#FF3B30`        | `#FF453A`        | Destructive actions                       |
| `--system-green`              | `#34C759`        | `#30D158`        | Switches (on state), positive actions     |
| `--system-blue`               | `#007AFF`        | `#0A84FF`        | Accent (alias of `--system-accent`)       |

### 1.2 Spacing Scale (8pt Grid)

Base unit 4px, primary rhythm 8px.

| Token        | Value | Usage                      |
| ------------ | ----- | -------------------------- |
| `--space-1`  | 4px   | Micro adjustments          |
| `--space-2`  | 8px   | Tight spacing              |
| `--space-3`  | 12px  | Between related items      |
| `--space-4`  | 16px  | Edge margins, card padding |
| `--space-5`  | 20px  | Section spacing            |
| `--space-6`  | 24px  | Large gaps                 |
| `--space-8`  | 32px  | Major sections             |
| `--space-10` | 40px  | Page-level padding         |
| `--space-12` | 48px  | Large page sections        |
| `--space-16` | 64px  | Hero/featured padding      |

iPhone edge margin: `16px`. iPad edge margin: `20px`.

### 1.3 Corner Radii (Continuous/Superellipse)

Standard `border-radius` approximates Apple's continuous corners.

| Token                 | Value | Usage                          |
| --------------------- | ----- | ------------------------------ |
| `--radius-button`     | 12px  | All buttons                    |
| `--radius-card`       | 16px  | Cards, containers              |
| `--radius-sheet`      | 22px  | Modal sheets, popovers, alerts |
| `--radius-input`      | 10px  | Text inputs, search bars       |
| `--radius-badge`      | 6px   | Badges, tags                   |
| `--radius-tab-bar`    | 16px  | Tab bar container              |
| `--radius-list-group` | 16px  | Grouped list containers        |

### 1.4 Shadows (Multi-layer, Subtle)

| Token              | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| `--shadow-level-1` | `0 1px 2px rgba(0,0,0,0.04)`                              |
| `--shadow-level-2` | `0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |
| `--shadow-level-3` | `0 8px 28px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)` |

Dark mode shadows: invert luminance, keep opacity similar.

### 1.5 Motion Tokens

| Token                | Value                           |
| -------------------- | ------------------------------- |
| `--ease-ios`         | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--duration-instant` | 100ms                           |
| `--duration-fast`    | 150ms                           |
| `--duration-normal`  | 200ms                           |
| `--duration-slow`    | 300ms                           |
| `--duration-page`    | 350ms                           |

---

## 2. Typography System

Font family: **Geist** (keep existing). No serif font for headings. Use weight/size/leading only.

### 2.1 Semantic Type Scale

| Style       | Size | Weight         | Leading | Tracking | CSS Variable       |
| ----------- | ---- | -------------- | ------- | -------- | ------------------ |
| Large Title | 34px | 700 (Bold)     | 41px    | -0.02em  | `--fs-large-title` |
| Title 1     | 28px | 700 (Bold)     | 34px    | -0.02em  | `--fs-title-1`     |
| Title 2     | 22px | 700 (Bold)     | 28px    | -0.02em  | `--fs-title-2`     |
| Title 3     | 20px | 600 (Semibold) | 24px    | -0.02em  | `--fs-title-3`     |
| Headline    | 17px | 600 (Semibold) | 22px    | -0.01em  | `--fs-headline`    |
| Body        | 17px | 400 (Regular)  | 22px    | -0.01em  | `--fs-body`        |
| Callout     | 16px | 400 (Regular)  | 21px    | -0.01em  | `--fs-callout`     |
| Subhead     | 15px | 400 (Regular)  | 20px    | -0.01em  | `--fs-subhead`     |
| Footnote    | 13px | 400 (Regular)  | 18px    | 0        | `--fs-footnote`    |
| Caption 1   | 12px | 400 (Regular)  | 16px    | 0        | `--fs-caption-1`   |
| Caption 2   | 11px | 400 (Regular)  | 13px    | 0        | `--fs-caption-2`   |

### 2.2 Changes

- Remove `--font-serif` / Merriweather from heading declarations in `globals.css`
- Remove `font-serif` from h1-h6 base styles; replace with `Geist Bold / Semibold`
- Remove `--uber-display` through `--uber-micro` scale; replace with iOS scale above
- Remove deprecated typography variables in favor of `--fs-*` tokens

---

## 3. Navigation & Layout

### 3.1 Large Title Pattern (all top-level pages)

Each page (Dashboard, Quiz, Flashcards, Settings) gets an iOS-style large title.

- Large title: 34pt Geist Bold, aligned leading, `--system-text-primary`
- On scroll past threshold: collapses to compact nav bar (17pt Headline)
- Implementation: sticky header via `position: sticky` with `scroll-margin` + size transition, OR use Intersection Observer to toggle class
- Compact nav bar: no background, just the title text at Headline size
- Back navigation: chevron-left + previous page title in `--system-accent`

### 3.2 Tab Bar (bottom-nav.tsx redesign)

Current: pill-shaped active state with filled background.
Target: iOS-native tab bar.

- Height: `49px` (iOS standard) + `safe-area-inset-bottom`
- Background: `--system-background` (solid, no glass)
- Top hairline: `0.33px solid var(--system-separator)`
- Icons: outlined for inactive, filled for active (swap icon variants)
- Active tab: icon + label in `--system-accent` (blue)
- Inactive tab: icon + label in `--system-text-secondary` (gray)
- No pill/background on active state
- No scale transform on tap
- Label: `10px` font, medium weight (keep existing but change color behavior)
- Tab items: `flex-1`, centered content
- Hidden on md+ breakpoint (keep current behavior)

### 3.3 Page Shell

New layout component that wraps all page content:

- Consistent `16px` horizontal padding (via padding on shell, not per-component)
- `safe-area-inset-top` for status bar clearance
- `safe-area-inset-bottom` for home indicator
- Scroll-behavior: `smooth`
- Overscroll background: `var(--system-background)`
- Max width: `--max-content` (current `max-w-md mx-auto`)

### 3.4 Push/Pop Page Transitions

Replace current direction-based slide transitions:

- Forward navigation (push): new page slides in from right, current slides left
- Back navigation (pop): current slides right, previous comes from left
- Duration: `350ms`, easing: `var(--ease-ios)`
- Remove spring-based page transitions
- Refactor `page-transition.tsx` to use `AnimatePresence` with custom `push`/`pop` variants

### 3.5 Sheet Presentations

- `22px` top corner radius (`var(--radius-sheet)`)
- Drag indicator: `40px × 5px` pill, centered, `var(--system-separator)` color
- Pull-down-to-dismiss via Vaul (already using Vaul)
- Backdrop: `rgba(0,0,0,0.4)` light / `rgba(0,0,0,0.6)` dark
- Content padding: `16px` inside sheet

### 3.6 Settings Page (iOS Grouped Table Pattern)

Settings gets a structural redesign:

- Page background: `var(--system-grouped-background)`
- Section groups: `16px` corner radius, `var(--system-surface)` background
- Section spacing: `20px`
- Section header: uppercase `13px` Footnote weight, `var(--system-text-secondary)`, `16px` leading margin
- Cells: hairline separator inset `16px` from leading edge, last cell has no separator
- Trailing accessories: chevron (navigable), switch (toggle), detail text (info)
- Destructive action: `var(--system-destructive)` text color

---

## 4. Component System

### 4.1 Button (button.tsx)

| Property       | Current       | iOS Target                |
| -------------- | ------------- | ------------------------- |
| Border radius  | 999px (pill)  | 12px                      |
| Min height     | varies        | 44px                      |
| Primary bg     | `#000000`     | `#007AFF` (blue)          |
| Primary text   | `#ffffff`     | `#ffffff`                 |
| Outline border | `#000000`     | `#007AFF` (blue)          |
| Ghost          | all black     | `--system-text-secondary` |
| Press effect   | `scale(0.97)` | opacity flash only        |

Variants to update:

- `default` → blue accent fill, white text, 12px radius
- `outline` → blue border, blue text, 12px radius
- `ghost` → no border, `--system-text-secondary` text
- `destructive` → `--system-destructive` red, 12px radius
- `uber_primary` → remove (replaced by `default`)
- `uber_secondary` → remove (replaced by `outline`)
- `uber_chip` → migrate to segmented control pattern
- `uber_floating` → keep but with 12px radius and iOS shadow

### 4.2 Card (card.tsx)

| Property      | Current                       | iOS Target         |
| ------------- | ----------------------------- | ------------------ |
| Border radius | 8px                           | 16px               |
| Shadow        | `0 4px 16px rgba(0,0,0,0.12)` | `--shadow-level-2` |
| Padding       | 24px (variable)               | `--space-4` (16px) |
| Hover effect  | `scale(1.005)`                | none               |
| Footer border | solid 1px                     | `0.33px hairline`  |

### 4.3 Switch (switch.tsx)

Checked state background:

- Light: `#34C759` (iOS green)
- Dark: `#30D158`
- Thumb: white, no border
- Unchecked: `--system-separator` (gray)

### 4.4 Segmented Control (segmented-control.tsx — new)

Replaces pill-style tab variants in certain contexts:

- Container: `12px` corner radius, no fill or `var(--system-surface-secondary)` fill
- Segments: equal width, `10px` inter-segment gap
- Active: `--system-accent` (blue) text, no background fill
- Inactive: `--system-text-secondary` text
- Separator: thin line between segments (optional)

### 4.5 List Cell (list-cell.tsx — new)

Reusable cell for grouped table patterns:

```tsx
<ListCell
  leading={<Icon />}
  title="Title"
  subtitle="Subtitle (optional)"
  trailing={<ChevronRight />} // or <Switch /> or "Detail text"
  onPress={() => {}}
/>
```

- Height: `44px` minimum
- Hairline separator below (inset `16px` from leading edge)
- No hairline on last cell in group
- Corner radius applied at group container level (`16px`)

### 4.6 Input (input.tsx)

- Radius: `10px`
- Border: `0.5px solid var(--system-separator)` (when unfocused)
- Focus: `2px solid var(--system-accent)`
- Placeholder: `var(--system-text-tertiary)`
- Clear button (X) on right when filled

### 4.7 Alert (alert.tsx — new)

iOS-style centered alert:

- Width: `270px` (iOS standard)
- Corner radius: `22px`
- Background: `var(--system-surface)` with `backdrop-filter: blur(20px)`
- Buttons: side by side, blue (confirm) / gray (cancel)
- Destructive button: `--system-destructive`
- Backdrop: `rgba(0,0,0,0.4)` light / `rgba(0,0,0,0.6)` dark

### 4.8 Disclosure Indicator (chevron-right)

Reusable component:

- Icon: `chevron-right` from lucide
- Size: `12px`
- Color: `var(--system-text-tertiary)`
- Used on any tappable/navigable row

### 4.9 iOS Back Button

- Chevron left (`<`) + previous page title
- Color: `--system-accent` (blue)
- Font: Headline (17pt, semibold)
- No "Back" text label — use previous screen title
- Tap target: minimum `44×44pt`

---

## 5. Existing Asset Changes

### 5.1 globals.css Changes

Remove:

- `--uber-color-*` tokens (replace with `--system-*` tokens)
- `--uber-typography-scale` (replace with `--fs-*` iOS scale)
- `.uber-pill`, `.uber-pill-*` utility classes
- `.uber-card`, `.uber-card-featured` utility classes
- `.uber-input` utility class
- `.uber-focus-ring`
- `font-serif` from h1-h6 base styles
- Noise texture overlay CSS (`.noise-overlay`)
- All redundant Framer Motion keyframes (keep only what's needed: `fadeInUp`, basic slide)
- Reduce keyframe definitions to essential set (remove `slideInFrom50`, `slideOutTo50`, `slideInFrom150`, etc.)

Add:

- `--system-*` color tokens in `:root` and `.dark`
- `--fs-*` typography tokens
- `--space-*` spacing tokens
- `--radius-*` tokens
- `--shadow-*` tokens
- `.ios-large-title` / `.ios-nav-title` utility classes
- `.ios-separator` hairline utility class

Update `@theme inline {}` block:

- `--color-background` → `var(--system-background)`
- `--color-foreground` → `var(--system-text-primary)`
- Add `--color-accent` → `var(--system-accent)`
- Remove obsolete mappings

### 5.2 Framer Motion Changes

- Remove spring configs from page-level components (dashboard, page transition)
- Replace with `{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }`
- Remove `whileHover` with y-offset from cards
- Remove `whileTap` with scale from buttons
- Keep spring/celebration animations only for: XP popups, streak milestones, confetti
- Reduce stagger children delay to `0.05` max
- No decorative floating/glow animations (keep countdown glow as brand exception)

---

## 6. Page-Specific Changes

### 6.1 Dashboard

- Large title "Dashboard" or dynamic greeting (34pt Large Title)
- Collapses to compact on scroll
- Stats cards: iOS-style grouped layout, `16px` card radius
- Today's Focus card: `16px` radius, `--system-accent` left border
- Quick Actions: segmented control style instead of pill chips
- XpLevelCard: retain but with updated radii/shadow

### 6.2 Quiz

- Large title: subject/question title
- Answer options: iOS-style list cells with checkmark selection
- Progress indicator: thin bar at top (keep existing but restyle)
- Subject picker: iOS-style picker or segmented control

### 6.3 Flashcards

- Large title: deck name
- Card: `16px` radius, swipe gesture (keep existing)
- Controls: iOS-style buttons at bottom
- Results screen: grouped list pattern

### 6.4 Settings

- Sectioned grouped table (as described in 3.6)
- Appearance tab: theme picker (segmented: System/Light/Dark)
- Study tab: timer toggles, notification switches
- Data tab: export/import rows with disclosure chevrons
- Beta tab: feature flags as switch cells

---

## 7. Implementation Order

1. **Design tokens**: Update `globals.css` with new system tokens, remove deprecated ones
2. **Typography**: Update base h1-h6 styles, add iOS type scale
3. **Navigation shell**: Large title pattern, page shell component
4. **Tab bar**: Redesign `bottom-nav.tsx` with iOS-native behavior
5. **Page transitions**: Refactor `page-transition.tsx` to push/pop
6. **Button**: Update `button.tsx` with iOS radii, blue accent, no scale
7. **Card**: Update `card.tsx` with 16px radius, new shadow
8. **Switch**: Update `switch.tsx` with green checked state
9. **List Cell**: Create `list-cell.tsx` component
10. **Segmented Control**: Create `segmented-control.tsx`
11. **Alert**: Create `alert.tsx` iOS-style
12. **Input**: Update `input.tsx` with iOS styling
13. **Dashboard**: Apply new iOS structure
14. **Settings**: Redesign with grouped table pattern
15. **Quiz/Flashcards**: Apply iOS patterns
16. **Motion cleanup**: Remove anti-pattern animations
17. **Polish & QA**: Final pass on all components

---

## 8. Anti-Patterns to Remove

| Current Pattern                  | iOS Anti-pattern?    | Replacement                           |
| -------------------------------- | -------------------- | ------------------------------------- |
| 999px pill radius on all buttons | Yes, iOS uses 8-12px | 12px radius                           |
| Button press scale (0.97)        | Yes                  | No scale, opacity flash               |
| Card hover scale-up              | Yes                  | No hover effect on cards              |
| Spring page transitions          | Yes                  | Ease-out, 350ms                       |
| Stagger delays > 50ms per item   | Yes                  | Max 50ms stagger                      |
| Noise texture overlay            | Yes                  | Remove entirely                       |
| Serif headings                   | Yes                  | Geist weight/size only                |
| Solid black borders on inputs    | Yes                  | Subtle separator borders              |
| Filled active pill on tab bar    | Yes                  | Accent icon only                      |
| Decorative floating glow effects | Mostly               | Keep only in countdown header (brand) |

---

## 9. Accessibility

- All interactive elements meet `44×44pt` minimum tap target
- Color contrast ratios maintained (WCAG AA minimum)
- `prefers-reduced-motion` respected: all animations degrade to instant
- Dynamic Type: semantic type scale allows future Dynamic Type support
- Touch targets enlarged via `::after` pseudo-elements where needed
- VoiceOver / screen reader labels preserved

---

## 10. Open Questions

- Should the countdown header's glow/blur decorative elements be kept as brand character? (Decided: yes, as exception)
- Should the bottom tab bar be hidden on scroll (like Safari)? (Decided: no, keep persistent)
- Should we add pull-to-refresh on dashboard? (Deferred to future iteration)
