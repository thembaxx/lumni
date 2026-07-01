# DESIGN.md

# Lumni — Apple HIG-Aligned Design System

# AI-powered South African NSC Grade 12 Exam Preparation

# Version: 2.0.0 | Merged Canonical Standard

# Based on: Apple Human Interface Guidelines 2026 + Lumni Brand Identity

> **Authority**: This document is the merged canonical standard. It combines Apple's official Human Interface Guidelines
> (developer.apple.com/design/human-interface-guidelines) with Lumni's established brand identity, warm paper palette,
> and 2026 motion patterns. When conflicts arise, HIG principles govern structure and accessibility; Lumni identity
> governs color, typography voice, and emotional tone. This document overrides all previous DESIGN.md versions.
> Last updated: 2026-07-01

---

## Table of Contents

1. [Design Philosophy & Creative North Star](#1-design-philosophy--creative-north-star)
2. [Design Principles (HIG Foundation)](#2-design-principles-hig-foundation)
3. [Design Tokens](#3-design-tokens)
4. [Colors: The Warm Paper + Study Green Palette](#4-colors-the-warm-paper--study-green-palette)
5. [Typography](#5-typography)
6. [Layout & Spacing](#6-layout--spacing)
7. [Materials, Depth & Elevation](#7-materials-depth--elevation)
8. [Navigation Patterns](#8-navigation-patterns)
9. [Components](#9-components)
10. [Content Presentation](#10-content-presentation)
11. [User Interaction & Gestures](#11-user-interaction--gestures)
12. [Motion & Animation](#12-motion--animation)
13. [Feedback & Status](#13-feedback--status)
14. [Accessibility (Integrated Throughout)](#14-accessibility-integrated-throughout)
15. [Platform Adaptations](#15-platform-adaptations)
16. [2026 Design Language — Ambient, Motion & Easter Eggs](#16-2026-design-language--ambient-motion--easter-eggs)
17. [Implementation Guidelines](#17-implementation-guidelines)
18. [Quality Assurance](#18-quality-assurance)
19. [Do's and Don'ts](#19-dos-and-donts)
20. [Appendices](#20-appendices)

---

## 1. Design Philosophy & Creative North Star

### 1.1 "The Warm Frame"

Imagine a photograph in a quality frame. The frame is warm-toned wood with a soft green mat inside. You notice the photograph first always, but the frame is why the photograph looks so good. The warmth keeps your eyes on the image. The green mat draws you into the composition. The beveled corners make the whole thing feel careful, intentional, worth your attention.

The interface works the same way. It is the frame, not the art. The art is the content: a question to answer, a flashcard to review, a topic to master. Every pixel of the frame exists to make that content clearer, warmer, more accessible. The warm paper neutrals create the gallery wall. The single Study Green accent is the mat: purposeful, restrained, never decorative. The generous radii are the beveled edges that say "someone cared about this."

**Key Characteristics:**

- Warm paper neutrals tinted toward 60° hue at chroma 0.003–0.005. Pure gray reads cold. Warm reads like a desk lamp.
- Single Study Green accent on 10% or less of any surface. Its rarity gives it meaning: buttons, focus rings, selected states. Nothing decorative.
- Generous rounded corners (20px cards, 40px shells, 12px buttons) that feel physically safe to touch. Not sharp. Not cold.
- iOS-inspired typography scale with OS-quality tracking per size. Reading is effortless, not engineered.
- Multi-layer tonal stacking for depth (lighter surfaces on darker backgrounds). Shadows are atmospheric, not structural.
- 44pt minimum touch targets. Thumbs on a minibus, fingers after a long day: the interface does not penalize imprecision.
- Every transition uses `cubic-bezier(0.16, 1, 0.3, 1)`. Fast deceleration, no bounce. The app feels alive under your finger.

### 1.2 Deference to Content (HIG Principle)

Content is primary; chrome is secondary. The interface should disappear when users focus on content.

- **Example**: When viewing a full-screen flashcard or exam question, hide all navigation chrome. Tapping restores it.
- **Implementation**: Use `opacity` transitions and `pointer-events` toggling to hide/show navigation bars on scroll or content interaction.
- **HIG Alignment**: Photos app hides all navigation when viewing full-screen photos. Lumni hides chrome when viewing exam questions.

### 1.3 Depth Through Layering (HIG Principle)

Use layers, shadows, and motion to create hierarchy.

- **Liquid Glass** (iOS 26+) floats above content, allowing it to peek through. Used for navigation bars, tab bars, sidebars, and toolbars.
- **Standard materials** (ultra-thin, thin, regular, thick) create visual distinction within the content layer.
- **Never** use Liquid Glass in the content layer — reserve it for controls and navigation.
- **Lumni-specific**: Cards and containers are solid ("The Solid Furniture Rule"). Glass is for transient surfaces that slide in and out.

---

## 2. Design Principles (HIG Foundation)

All design decisions must align with these four principles:

| Principle       | Definition                                                                                                              | Application in Lumni                                                                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hierarchy**   | Establish clear visual hierarchy where controls and interface elements elevate and distinguish the content beneath them | Use z-index, shadows, and tonal layers to create depth. Navigation and primary actions sit above content. Study Green draws attention to key actions.       |
| **Harmony**     | Align with the concentric design of hardware and software                                                               | Match border radii to device corners. Use continuous curves (not sharp corners) for all UI elements. Warm neutrals harmonize with the physical environment. |
| **Consistency** | Adopt platform conventions that adapt across window sizes                                                               | Maintain consistent navigation patterns, gesture behaviors, and component styling across all breakpoints. Tab bars on mobile, sidebars on desktop.          |
| **Clarity**     | Make content and functionality easy to understand                                                                       | Remove ambiguity. Every interactive element must clearly communicate its purpose and state. Exam questions must be immediately scannable.                   |

### 2.1 Platform-Specific Harmony

| Platform        | Navigation                                        | Layout                               | Touch/Gesture                                    |
| --------------- | ------------------------------------------------- | ------------------------------------ | ------------------------------------------------ |
| **iOS**         | Tab bar at bottom, navigation bar at top          | Single column, full-width content    | Full gesture support, edge swipe for back        |
| **iPadOS**      | Tab bar at top (adaptable to sidebar), split view | Multi-column, master-detail          | Apple Pencil support, hover states               |
| **macOS**       | Sidebar + toolbar, no tab bar                     | Multi-column, fixed width containers | Hover states, cursor changes, keyboard shortcuts |
| **Desktop Web** | Sidebar or top navigation                         | Responsive, generous whitespace      | Hover states, keyboard navigation                |

---

## 3. Design Tokens

### 3.1 Token Architecture

All visual properties are defined as semantic tokens. Never use hard-coded values.

```typescript
// tokens.ts — Lumni Design Token System
export const tokens = {
  // ============================================================
  // COLORS — Warm Paper + Study Green Palette
  // ============================================================
  color: {
    // Primary Accent
    studyGreen: "var(--color-study-green)", // oklch(52% 0.18 146) — Primary CTA
    studyGreenBright: "var(--color-study-green-bright)", // oklch(65% 0.18 146) — Dark mode accent

    // Warm Paper Neutrals (Light Mode)
    warmPaper: "var(--color-warm-paper)", // oklch(100% 0 0) — Page surface
    warmPaperSecondary: "var(--color-warm-paper-secondary)", // oklch(97% 0.003 60)
    warmPaperTertiary: "var(--color-warm-paper-tertiary)", // oklch(95% 0.005 60)
    warmPaperElevated: "var(--color-warm-paper-elevated)", // oklch(100% 0 0)
    warmPaperGrouped: "var(--color-warm-paper-grouped)", // oklch(98.8% 0.003 60)

    // Surfaces
    surface: "var(--color-surface)", // oklch(100% 0 0) — Card faces
    surfaceSecondary: "var(--color-surface-secondary)", // oklch(97.8% 0.005 60)

    // Text (Ink) — HIG-mapped semantic labels
    ink: "var(--color-ink)", // Primary label — oklch(20% 0.02 264)
    inkMuted: "var(--color-ink-muted)", // Secondary label — oklch(20% 0.02 264 / 0.65)
    inkFaint: "var(--color-ink-faint)", // Tertiary label — oklch(20% 0.02 264 / 0.35)
    inkQuaternary: "var(--color-ink-quaternary)", // Quaternary label — oklch(20% 0.02 264 / 0.18)

    // HIG Semantic Mappings (for cross-reference)
    label: "var(--color-ink)", // HIG: label
    labelSecondary: "var(--color-ink-muted)", // HIG: secondaryLabel
    labelTertiary: "var(--color-ink-faint)", // HIG: tertiaryLabel
    labelQuaternary: "var(--color-ink-quaternary)", // HIG: quaternaryLabel

    // Structural
    separator: "var(--color-separator)", // oklch(0% 0 0 / 0.06)
    opaqueSeparator: "var(--color-opaque-separator)", // HIG equivalent

    // Semantic
    destructive: "var(--color-destructive)", // oklch(55% 0.18 25) — Errors, wrong answers
    success: "var(--color-success)", // oklch(65% 0.2 145) — Correct answers
    warning: "var(--color-warning)", // oklch(75% 0.15 70) — Medium difficulty
    info: "var(--color-info)", // oklch(60% 0.15 240) — Informational

    // Chart/Data Visualization
    chart: {
      emerald: "var(--color-chart-emerald)", // oklch(52% 0.18 146)
      green: "var(--color-chart-green)", // oklch(65% 0.2 145)
      amber: "var(--color-chart-amber)", // oklch(75% 0.15 70)
      blue: "var(--color-chart-blue)", // oklch(60% 0.15 240)
      red: "var(--color-chart-red)", // oklch(55% 0.18 25)
    },

    // Dark Mode
    dark: {
      background: "var(--color-dark-background)", // oklch(10% 0.01 264)
      surface: "var(--color-dark-surface)", // oklch(16% 0.015 264)
      elevated: "var(--color-dark-elevated)", // oklch(20% 0.02 264)
      separator: "var(--color-dark-separator)", // oklch(100% 0 0 / 0.12)
    },

    // HIG System Colors (for reference/compliance)
    system: {
      red: "var(--color-system-red)",
      orange: "var(--color-system-orange)",
      yellow: "var(--color-system-yellow)",
      green: "var(--color-system-green)",
      teal: "var(--color-system-teal)",
      blue: "var(--color-system-blue)",
      indigo: "var(--color-system-indigo)",
      purple: "var(--color-system-purple)",
      pink: "var(--color-system-pink)",
      brown: "var(--color-system-brown)",
      gray: "var(--color-system-gray)",
      gray2: "var(--color-system-gray2)",
      gray3: "var(--color-system-gray3)",
      gray4: "var(--color-system-gray4)",
      gray5: "var(--color-system-gray5)",
      gray6: "var(--color-system-gray6)",
    },
  },

  // ============================================================
  // TYPOGRAPHY
  // ============================================================
  typography: {
    family: {
      display:
        'var(--font-heading), Outfit, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro", sans-serif',
      body: 'var(--font-sans), Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro", sans-serif',
      mono: 'var(--font-mono), "Geist Mono", "SF Mono", "SFMono-Regular", "Fira Code", monospace',
    },
    style: {
      // HIG-mapped text styles with Lumni voice
      largeTitle: "var(--font-large-title)", // HIG: Large Title (34pt)
      title1: "var(--font-title-1)", // HIG: Title 1 (28pt)
      title2: "var(--font-title-2)", // HIG: Title 2 (22pt)
      title3: "var(--font-title-3)", // HIG: Title 3 (20pt)
      headline: "var(--font-headline)", // HIG: Headline (17pt semibold)
      body: "var(--font-body)", // HIG: Body (17pt)
      callout: "var(--font-callout)", // HIG: Callout (16pt)
      subhead: "var(--font-subhead)", // HIG: Subhead (15pt)
      footnote: "var(--font-footnote)", // HIG: Footnote (13pt)
      caption1: "var(--font-caption-1)", // HIG: Caption 1 (12pt)
      caption2: "var(--font-caption-2)", // HIG: Caption 2 (11pt)
    },
  },

  // ============================================================
  // SPACING — 4px base unit, HIG-aligned
  // ============================================================
  spacing: {
    "0": "0",
    "1": "2px", // 0.5 unit
    "2": "4px", // 1 unit (base)
    "3": "6px",
    "4": "8px", // 2 units
    "5": "10px",
    "6": "12px", // 3 units — HIG bezeled padding
    "8": "16px", // 4 units — HIG standard padding
    "10": "20px",
    "11": "22px",
    "12": "24px", // 6 units — HIG non-bezel padding
    "16": "32px", // 8 units
    "20": "40px",
    "24": "48px",
    "32": "64px",
    "40": "80px",
    "44": "88px", // HIG touch target
  },

  // ============================================================
  // TOUCH TARGETS — HIG Minimum Sizes
  // ============================================================
  touch: {
    min: "28px", // HIG: Absolute minimum (28×28pt) — NEVER go below this
    default: "44px", // HIG: Recommended minimum (44×44pt) — ALWAYS target this
    padding: "12px", // HIG: Between bezeled elements
    paddingNoBezel: "24px", // HIG: Between non-bezel elements
  },

  // ============================================================
  // BORDER RADIUS — Generous, continuous curves
  // ============================================================
  radius: {
    none: "0",
    sm: "8px", // Badges, small chips
    md: "12px", // Buttons, inputs (HIG continuous curve)
    lg: "20px", // Cards, list groups (Lumni standard)
    xl: "24px", // Sheets, modals
    "2xl": "28px",
    "3xl": "32px",
    "4xl": "40px", // Shell containers (Lumni generous)
    full: "9999px", // Pills, avatars
  },

  // ============================================================
  // SHADOWS — Atmospheric, not structural
  // ============================================================
  shadow: {
    none: "none",
    level1: "0 1px 2px oklch(0% 0 0 / 0.04), 0 1px 4px oklch(0% 0 0 / 0.02)", // Resting float
    level2:
      "0 2px 4px oklch(0% 0 0 / 0.04), 0 4px 12px oklch(0% 0 0 / 0.03), 0 8px 24px oklch(0% 0 0 / 0.02)", // Elevated cards
    level3:
      "0 4px 8px oklch(0% 0 0 / 0.05), 0 8px 24px oklch(0% 0 0 / 0.04), 0 16px 48px oklch(0% 0 0 / 0.03), 0 32px 64px oklch(0% 0 0 / 0.015)", // Modals, sheets
    solverGlow: "0 2px 8px oklch(52% 0.18 146 / 0.15)", // Lumni: Green halo on Solve button
    // Dark mode shadows (auto-applied via CSS)
    level1Dark: "0 1px 2px oklch(0% 0 0 / 0.15), 0 1px 4px oklch(0% 0 0 / 0.08)",
    level2Dark:
      "0 2px 4px oklch(0% 0 0 / 0.18), 0 4px 12px oklch(0% 0 0 / 0.12), 0 8px 24px oklch(0% 0 0 / 0.08)",
    level3Dark:
      "0 4px 8px oklch(0% 0 0 / 0.20), 0 8px 24px oklch(0% 0 0 / 0.15), 0 16px 48px oklch(0% 0 0 / 0.10), 0 32px 64px oklch(0% 0 0 / 0.06)",
    solverGlowDark: "0 2px 8px oklch(65% 0.18 146 / 0.20)",
  },

  // ============================================================
  // MOTION — HIG-aligned with Lumni personality
  // ============================================================
  motion: {
    duration: {
      instant: "0ms", // HIG: Immediate feedback
      fast: "150ms", // HIG: State changes
      normal: "250ms", // HIG: Standard transitions
      slow: "300ms", // Lumni: Overlays, modals
      slower: "350ms", // HIG: Complex transitions
      max: "500ms", // HIG: Absolute maximum (waiting room rule)
    },
    easing: {
      // Lumni primary: Fast deceleration, physical feel
      default: "cubic-bezier(0.16, 1, 0.3, 1)",
      // Lumni secondary: Fast-arrival overshoot (card entrances)
      overshoot: "cubic-bezier(0.175, 0.885, 0.32, 1.1)",
      // HIG standards
      decelerate: "cubic-bezier(0.0, 0.0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0.0, 1, 1)",
      // Prohibited: spring with bounce > 0
    },
  },

  // ============================================================
  // Z-INDEX HIERARCHY — HIG-aligned layering
  // ============================================================
  zIndex: {
    background: -1, // Background layers
    content: 0, // Main content
    elevated: 10, // Cards, elevated surfaces
    sticky: 100, // Sticky headers
    header: 200, // Navigation bars
    drawer: 300, // Side drawers
    cookieBanner: 400, // Cookie consent
    modal: 500, // Modal sheets
    overlay: 600, // Backdrops, overlays
    toast: 700, // Toast notifications
    skipLink: 999, // Accessibility skip link
    easterEgg: 1000, // Easter egg overlays (non-blocking)
  },

  // ============================================================
  // GLASS MATERIALS — Transient surfaces only (HIG Liquid Glass)
  // ============================================================
  glass: {
    ultraThin: { blur: "10px", opacity: "0.30" },
    thin: { blur: "20px", opacity: "0.60" },
    regular: { blur: "24px", opacity: "0.80" }, // HIG: Navigation bars, sheets
    thick: { blur: "40px", opacity: "0.92" }, // HIG: Modal overlays, dialogs
    card: { blur: "20px", opacity: "0.12" }, // Lumni: Transient cards
    cardStrong: { blur: "30px", opacity: "0.20" }, // Lumni: Elevated transient
  },
};
```

### 3.2 CSS Custom Properties (Root Variables)

```css
:root {
  /* ============================================================
     PRIMARY COLORS — Study Green
     ============================================================ */
  --color-study-green: oklch(52% 0.18 146);
  --color-study-green-bright: oklch(65% 0.18 146);

  /* ============================================================
     WARM PAPER NEUTRALS (Light Mode)
     ============================================================ */
  --color-warm-paper: oklch(100% 0 0);
  --color-warm-paper-secondary: oklch(97% 0.003 60);
  --color-warm-paper-tertiary: oklch(95% 0.005 60);
  --color-warm-paper-elevated: oklch(100% 0 0);
  --color-warm-paper-grouped: oklch(98.8% 0.003 60);

  /* ============================================================
     SURFACES
     ============================================================ */
  --color-surface: oklch(100% 0 0);
  --color-surface-secondary: oklch(97.8% 0.005 60);

  /* ============================================================
     TEXT (Ink) — HIG Semantic Mappings
     ============================================================ */
  --color-ink: oklch(20% 0.02 264); /* HIG: label */
  --color-ink-muted: oklch(20% 0.02 264 / 0.65); /* HIG: secondaryLabel */
  --color-ink-faint: oklch(20% 0.02 264 / 0.35); /* HIG: tertiaryLabel */
  --color-ink-quaternary: oklch(20% 0.02 264 / 0.18); /* HIG: quaternaryLabel */

  /* ============================================================
     STRUCTURAL
     ============================================================ */
  --color-separator: oklch(0% 0 0 / 0.06);
  --color-opaque-separator: #c6c6c8;

  /* ============================================================
     SEMANTIC
     ============================================================ */
  --color-destructive: oklch(55% 0.18 25);
  --color-success: oklch(65% 0.2 145);
  --color-warning: oklch(75% 0.15 70);
  --color-info: oklch(60% 0.15 240);

  /* ============================================================
     CHART COLORS
     ============================================================ */
  --color-chart-emerald: oklch(52% 0.18 146);
  --color-chart-green: oklch(65% 0.2 145);
  --color-chart-amber: oklch(75% 0.15 70);
  --color-chart-blue: oklch(60% 0.15 240);
  --color-chart-red: oklch(55% 0.18 25);

  /* ============================================================
     HIG SYSTEM COLORS (Reference)
     ============================================================ */
  --color-system-red: #ff3b30;
  --color-system-orange: #ff9500;
  --color-system-yellow: #ffcc00;
  --color-system-green: #34c759;
  --color-system-teal: #5ac8fa;
  --color-system-blue: #007aff;
  --color-system-indigo: #5856d6;
  --color-system-purple: #af52de;
  --color-system-pink: #ff2d55;
  --color-system-brown: #a2845e;
  --color-system-gray: #8e8e93;
  --color-system-gray2: #aeaeb2;
  --color-system-gray3: #c7c7cc;
  --color-system-gray4: #d1d1d6;
  --color-system-gray5: #e5e5ea;
  --color-system-gray6: #f2f2f7;

  /* ============================================================
     TYPOGRAPHY — HIG Dynamic Type Scale with Lumni Voice
     ============================================================ */
  --font-display:
    var(--font-heading), Outfit, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "SF Pro", sans-serif;
  --font-body:
    var(--font-sans), Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro",
    sans-serif;
  --font-mono: var(--font-mono), "Geist Mono", "SF Mono", "SFMono-Regular", "Fira Code", monospace;

  /* HIG Large Title (34pt) — Lumni Display */
  --font-large-title: 800 34px/1.2 var(--font-display);
  /* HIG Title 1 (28pt) — Lumni Headline */
  --font-title-1: 800 28px/1.22 var(--font-display);
  /* HIG Title 2 (22pt) — Lumni Title */
  --font-title-2: 800 22px/1.27 var(--font-display);
  /* HIG Title 3 (20pt) — Lumni Title 3 */
  --font-title-3: 600 20px/1.25 var(--font-display);
  /* HIG Headline (17pt semibold) — Lumni Headline */
  --font-headline: 600 17px/1.3 var(--font-body);
  /* HIG Body (17pt) — Lumni Body */
  --font-body: 400 17px/1.5 var(--font-body);
  /* HIG Callout (16pt) — Lumni Callout */
  --font-callout: 400 16px/1.4 var(--font-body);
  /* HIG Subhead (15pt) — Lumni Subhead */
  --font-subhead: 400 15px/1.4 var(--font-body);
  /* HIG Footnote (13pt) — Lumni Footnote */
  --font-footnote: 400 13px/1.4 var(--font-body);
  /* HIG Caption 1 (12pt) — Lumni Caption 1 */
  --font-caption-1: 400 12px/1.3 var(--font-body);
  /* HIG Caption 2 (11pt) — Lumni Caption 2 */
  --font-caption-2: 400 11px/1.2 var(--font-body);

  /* Dynamic Type Scale Factor */
  --text-scale: 1;

  /* ============================================================
     SPACING
     ============================================================ */
  --spacing-1: 2px;
  --spacing-2: 4px;
  --spacing-3: 6px;
  --spacing-4: 8px;
  --spacing-5: 10px;
  --spacing-6: 12px;
  --spacing-8: 16px;
  --spacing-10: 20px;
  --spacing-11: 22px;
  --spacing-12: 24px;
  --spacing-16: 32px;
  --spacing-20: 40px;
  --spacing-24: 48px;
  --spacing-32: 64px;
  --spacing-40: 80px;
  --spacing-44: 88px;

  /* ============================================================
     TOUCH TARGETS
     ============================================================ */
  --touch-min: 28px;
  --touch-default: 44px;
  --touch-padding: 12px;
  --touch-padding-no-bezel: 24px;

  /* ============================================================
     BORDER RADIUS
     ============================================================ */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-2xl: 28px;
  --radius-3xl: 32px;
  --radius-4xl: 40px;
  --radius-full: 9999px;

  /* ============================================================
     SHADOWS
     ============================================================ */
  --shadow-level-1: 0 1px 2px oklch(0% 0 0 / 0.04), 0 1px 4px oklch(0% 0 0 / 0.02);
  --shadow-level-2:
    0 2px 4px oklch(0% 0 0 / 0.04), 0 4px 12px oklch(0% 0 0 / 0.03), 0 8px 24px oklch(0% 0 0 / 0.02);
  --shadow-level-3:
    0 4px 8px oklch(0% 0 0 / 0.05), 0 8px 24px oklch(0% 0 0 / 0.04),
    0 16px 48px oklch(0% 0 0 / 0.03), 0 32px 64px oklch(0% 0 0 / 0.015);
  --shadow-solver-glow: 0 2px 8px oklch(52% 0.18 146 / 0.15);

  /* ============================================================
     MOTION
     ============================================================ */
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 150ms;
  --motion-duration-normal: 250ms;
  --motion-duration-slow: 300ms;
  --motion-duration-slower: 350ms;
  --motion-duration-max: 500ms;

  --motion-easing-default: cubic-bezier(0.16, 1, 0.3, 1);
  --motion-easing-overshoot: cubic-bezier(0.175, 0.885, 0.32, 1.1);
  --motion-easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --motion-easing-accelerate: cubic-bezier(0.4, 0, 1, 1);

  /* ============================================================
     Z-INDEX
     ============================================================ */
  --z-background: -1;
  --z-content: 0;
  --z-elevated: 10;
  --z-sticky: 100;
  --z-header: 200;
  --z-drawer: 300;
  --z-cookie-banner: 400;
  --z-modal: 500;
  --z-overlay: 600;
  --z-toast: 700;
  --z-skip-link: 999;
  --z-easter-egg: 1000;

  /* ============================================================
     GLASS MATERIALS
     ============================================================ */
  --glass-ultra-thin: blur(10px) saturate(180%);
  --glass-thin: blur(20px) saturate(180%);
  --glass-regular: blur(24px) saturate(180%);
  --glass-thick: blur(40px) saturate(180%);
  --glass-card: blur(20px) saturate(120%);
  --glass-card-strong: blur(30px) saturate(120%);
}

/* ============================================================
   DARK MODE
   ============================================================ */
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode Surfaces */
    --color-warm-paper: oklch(10% 0.01 264);
    --color-warm-paper-secondary: oklch(16% 0.015 264);
    --color-warm-paper-tertiary: oklch(20% 0.02 264);
    --color-warm-paper-elevated: oklch(20% 0.02 264);
    --color-warm-paper-grouped: oklch(10% 0.01 264);

    --color-surface: oklch(16% 0.015 264);
    --color-surface-secondary: oklch(20% 0.02 264);

    /* Dark Mode Text — HIG Elevated */
    --color-ink: oklch(95% 0.01 264); /* HIG: label (dark) */
    --color-ink-muted: oklch(95% 0.01 264 / 0.65); /* HIG: secondaryLabel (dark) */
    --color-ink-faint: oklch(95% 0.01 264 / 0.35); /* HIG: tertiaryLabel (dark) */
    --color-ink-quaternary: oklch(95% 0.01 264 / 0.18); /* HIG: quaternaryLabel (dark) */

    /* Dark Mode Structural */
    --color-separator: oklch(100% 0 0 / 0.12);
    --color-opaque-separator: #38383a;

    /* Dark Mode System Colors */
    --color-system-red: #ff453a;
    --color-system-orange: #ff9f0a;
    --color-system-yellow: #ffd60a;
    --color-system-green: #32d74b;
    --color-system-teal: #64d2ff;
    --color-system-blue: #0a84ff;
    --color-system-indigo: #5e5ce6;
    --color-system-purple: #bf5af2;
    --color-system-pink: #ff375f;
    --color-system-brown: #ac8e68;
    --color-system-gray: #8e8e93;
    --color-system-gray2: #636366;
    --color-system-gray3: #48484a;
    --color-system-gray4: #3a3a3c;
    --color-system-gray5: #2c2c2e;
    --color-system-gray6: #1c1c1e;

    /* Dark Mode Shadows */
    --shadow-level-1: 0 1px 2px oklch(0% 0 0 / 0.15), 0 1px 4px oklch(0% 0 0 / 0.08);
    --shadow-level-2:
      0 2px 4px oklch(0% 0 0 / 0.18), 0 4px 12px oklch(0% 0 0 / 0.12),
      0 8px 24px oklch(0% 0 0 / 0.08);
    --shadow-level-3:
      0 4px 8px oklch(0% 0 0 / 0.2), 0 8px 24px oklch(0% 0 0 / 0.15),
      0 16px 48px oklch(0% 0 0 / 0.1), 0 32px 64px oklch(0% 0 0 / 0.06);
    --shadow-solver-glow: 0 2px 8px oklch(65% 0.18 146 / 0.2);
  }
}

/* ============================================================
   INCREASED CONTRAST (HIG Accessibility)
   ============================================================ */
@media (prefers-contrast: more) {
  :root {
    --color-ink-muted: oklch(20% 0.02 264 / 0.78);
    --color-ink-faint: oklch(20% 0.02 264 / 0.55);
    --color-separator: oklch(0% 0 0 / 0.12);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --color-ink-muted: oklch(95% 0.01 264 / 0.78);
      --color-ink-faint: oklch(95% 0.01 264 / 0.55);
      --color-separator: oklch(100% 0 0 / 0.2);
    }
  }
}

/* ============================================================
   REDUCED MOTION (HIG Accessibility)
   ============================================================ */
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

buttons (12px). A subtle fill replaces the hard bordered rectangle.

#### Input Specifications

- **Style**: Warm Paper Secondary background, Separator border, 12px radius, 28px height (line-height controlled).
- **Focus**: Border shifts to Study Green, 2px Study Green ring at 30% opacity.
- **States**: Disabled at 50% opacity. Error shows Destructive border and ring.
- **Touch Target**: Minimum 44px height for all interactive controls via `--touch-target-min`.
- **Textarea**: Same base style, `field-sizing-content` for auto-height, 16px minimum height, `resize-none`.

### 9.5 TabSwitcher / Segmented Control

Two variants, one behavior: spring-animated indicator follows your tap.

#### Tabs Variant

- Warm Paper Secondary background tray (12px radius, 4px padding).
- Study Green pill indicator, white text on active, Ink Muted on inactive.

#### Segmented Variant

- Surface Secondary tray (6px radius, 3px padding).
- Surface pill indicator with level-1 shadow, Study Green text on active, Ink Muted on inactive.

#### Motion

Spring animation via Base UI's built-in animated indicator. Never use `type: "spring"` with non-zero `bounce`.

### 9.6 Sheets (HIG)

**Purpose**: Present a modal task, options, or in-depth content.

#### Sheet Types (HIG)

| Type            | Height | Use Case                             |
| --------------- | ------ | ------------------------------------ |
| **Fixed**       | 50%    | Simple tasks, confirmation           |
| **Medium**      | ~60%   | Standard modal tasks                 |
| **Large**       | ~85%   | Complex tasks, forms                 |
| **Full-screen** | 100%   | Immersive experiences, exam sessions |

#### Sheet Rules (HIG)

1. **Always provide dismiss gesture** — swipe down or Done button.
2. **Confirm data loss** before dismissing if user-generated content exists.
3. **Avoid stacking sheets** — dismiss current before presenting new.
4. **Title the sheet's task** — help users keep their place.
5. **Keep modal tasks simple** — avoid "app within an app" hierarchy.

#### Lumni Sheet

```tsx
<Sheet height="large" title="Exam Settings" dismissGesture onDismiss={handleDismiss}>
  <SheetContent>{/* settings form */}</SheetContent>
</Sheet>
```

### 9.7 Alerts (HIG)

**Purpose**: Deliver critical information requiring user action.

#### Alert Anatomy

- Title (required, max 2 lines)
- Message (optional, brief)
- Text field (optional, for input)
- Buttons (1-3, max)

#### Alert Rules (HIG)

1. **Use sparingly** — interrupts current study session.
2. **Never use for informational-only** — find non-intrusive alternatives.
3. **Never alert on startup** — make info discoverable instead.
4. **Don't alert for common undoable actions** — e.g., skipping a practice question.
5. **Button titles**: Specific verbs ("Erase", "Convert"), not "OK" (unless purely informational).
6. **Button placement**:
   - Primary action: trailing side (row) or top (stack)
   - Cancel: leading side (row) or bottom (stack)
   - Destructive: trailing, styled red
7. **Never make Cancel the default button** — use Done for single-button alerts.

### 9.8 Search Fields (HIG)

- **Placement**: Navigation bar (trailing) or as dedicated tab.
- **Style**: Rounded rectangle with magnifying glass icon.
- **Behavior**:
  - Show scope bar below for filtering categories (Mathematics, Physical Sciences, etc.).
  - Provide search suggestions as user types.
  - Include clear button when text exists.
  - Cancel button when active.

### 9.9 Progress Indicators (HIG)

| Type                             | Use Case              | Duration |
| -------------------------------- | --------------------- | -------- |
| **Activity Indicator** (spinner) | Indeterminate loading | Unknown  |
| **Progress Bar**                 | Determinate loading   | Known    |
| **Progress View** (circular)     | Determinate, compact  | Known    |

#### Rules (HIG)

1. **Use activity indicator** when duration is unknown.
2. **Use progress bar** when duration is known (0-100%).
3. **Always show progress** for operations > 1 second.
4. **Consider skeleton screens** instead of spinners for content loading — improves perceived performance.

#### Lumni Progress Patterns

- **Segmented progress bar**: Animated segments with numeric counter (e.g., "3/10"). Each segment pulses on completion.
- **Skeleton shapes**: Show ghost layout while content loads. A spinner says "wait." A skeleton says "something is coming."

### 9.10 Segmented Controls (HIG)

- **Use**: Switch between related views or content categories (e.g., "All Topics", "Weak Areas", "Mastered").
- **Placement**: Navigation bar (top level only) or content area.
- **Maximum segments**: 5
- **Style**: Equal width, single-line labels.

### 9.11 Chips / Badges

Small, fast, expressive. 20px tall with 8px radius.

| Variant                | Background              | Text        | Usage                |
| ---------------------- | ----------------------- | ----------- | -------------------- |
| **Default**            | Study Green             | White       | Primary status       |
| **Secondary**          | Surface Secondary       | Ink         | Neutral status       |
| **Destructive**        | Destructive at 10% tint | Destructive | Error state          |
| **Outline**            | Transparent             | Ink         | Neutral, border only |
| **Ghost**              | Transparent             | Muted       | Subtle status        |
| **Difficulty: Easy**   | Success tint            | Success     | Easy questions       |
| **Difficulty: Medium** | Warning tint            | Warning     | Medium questions     |
| **Difficulty: Hard**   | Destructive tint        | Destructive | Hard questions       |

### 9.12 Dropdown Menu

- **Content**: 12px radius, 4px padding. Surface background. Level-2 shadow with 1px Separator ring (fixes dark mode visibility). Fade-in + zoom-in animation on open.
- **Item**: 28px min height, 8px radius, 8px horizontal padding. Hover/focus: Accent background with Accent Foreground text.
- **Separator**: 1px Separator at 50% opacity.

### 9.13 Switch

- **Track**: 28×17px (default) or 24×14px (sm). Rounded-full, muted background by default. Checked: Study Green background.
- **Thumb**: Circular, white. Checked translates to fill the track.
- **Touch Target**: `after:-inset-x-3 after:-inset-y-2` for 44pt compliance.

### 9.14 Checkbox

- **Box**: 16×16px, 4px radius, Separator border. Checked: Study Green background with white checkmark icon.
- **Touch Target**: `after:-inset-x-3 after:-inset-y-2`.

### 9.15 Bottom Navigation (Lumni Mobile)

The primary mobile navigation, always present during app use.

- **Bar**: Fixed to bottom, 64px + safe area height. Liquid Glass background (80% opacity, 24px blur). Level-2 shadow with subtle Separator ring.
- **Tabs**: Rounded-full tab bar with Study Green tint. Active icon: Study Green with scale(1.1). Inactive: muted foreground.
- **Tools FAB**: 44px circular button, blue (`#007AFF` light / `#0A84FF` dark), level-3 shadow.

---

## 10. Content Presentation

### 10.1 Empty States

Every empty view must include:

1. **Icon or illustration** — visually communicates the empty state.
2. **Title** — explains what's empty (e.g., "No Practice Sessions Yet").
3. **Description** — provides context (optional but recommended).
4. **Action button** — clear next step (e.g., "Start Practicing").

### 10.2 Error States

1. **Explain what happened** — be specific, not generic. "Could not load Mathematics questions" not "Error occurred."
2. **Explain what to do next** — provide recovery path. "Check your connection and try again."
3. **Use non-intrusive indicators** when possible — inline labels, banners, not alerts.
4. **Never show error codes alone** — always translate to human language.

### 10.3 Loading States

1. **Show immediately** — no delay before indicating activity.
2. **Use skeleton screens** for content areas — show ghost layout of incoming content.
3. **Prevent interaction** during loading only when necessary.
4. **Provide cancel option** for long operations.

### 10.4 Onboarding (HIG)

1. **Delay until first use** — don't block launch.
2. **Keep it brief** — 3-5 screens maximum.
3. **Show value, not features** — "Master your exams" not "We have flashcards."
4. **Allow skip** — always provide skip option.
5. **Use progressive onboarding** — teach in context, not all at once.
6. **Never require account creation** before showing value.

### 10.5 Exam Question Presentation

- **Full-screen mode**: Hide all navigation chrome. Tap to restore.
- **Question text**: Body style (17pt), max 65ch line length.
- **Answer options**: List cells, 56px minimum height, full-width touch targets.
- **Feedback**: Immediate visual + haptic on answer selection.
- **Progress indicator**: Segmented bar at top, numeric counter.

---

## 11. User Interaction & Gestures

### 11.1 Gestures (HIG)

| Gesture                | Action                                | Priority       | Lumni Application                 |
| ---------------------- | ------------------------------------- | -------------- | --------------------------------- |
| **Tap**                | Primary selection, activation         | Essential      | Select answer, navigate           |
| **Swipe (horizontal)** | Navigate back, delete, reveal actions | Essential      | Next/prev question, dismiss sheet |
| **Swipe (vertical)**   | Scroll                                | Essential      | Scroll content                    |
| **Pinch**              | Zoom                                  | Contextual     | Zoom diagrams, graphs             |
| **Long press**         | Context menu, preview                 | Secondary      | Preview question details          |
| **Pull to refresh**    | Reload content                        | Standard       | Refresh practice sessions         |
| **Edge swipe**         | Navigate back, open sidebar           | System         | Back from exam question           |
| **Drag (horizontal)**  | Advance quiz questions                | Lumni-specific | Spring reset below threshold      |

#### Gesture Rules (HIG)

1. **Never override system gestures** — especially edge swipe for back navigation.
2. **Provide alternatives** — every gesture must have a tap/button equivalent.
3. **Keep gestures simple** — avoid multi-finger, multi-hand gestures.
4. **Give immediate feedback** — every gesture must produce visible response.

### 11.2 Data Entry (HIG)

1. **Minimize input** — use pickers, toggles, segmented controls instead of text fields where possible.
2. **Use appropriate keyboard** — email, number, URL, search types.
3. **Validate inline** — show errors as user types, not on submit.
4. **Auto-capitalize appropriately** — sentences for names, none for usernames.
5. **Enable auto-correction** where appropriate, disable for usernames/passwords.
6. **Use smart defaults** — pre-fill known information (grade, subjects).

### 11.3 Haptics & Feedback (HIG)

- **Light impact**: Small UI changes (toggle switch, selection).
- **Medium impact**: Standard actions (button press, confirmation).
- **Heavy impact**: Significant actions (delete, submit exam).
- **Success**: Completion of task (correct answer, exam submitted).
- **Error**: Failed operation (wrong answer, network error).
- **Warning**: Caution needed (time running out, difficult question).

#### Implementation

```typescript
// Haptic feedback utility — HIG-aligned
const haptics = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  heavy: () => navigator.vibrate?.(30),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error: () => navigator.vibrate?.([50, 100, 50]),
  warning: () => navigator.vibrate?.([20, 100, 20]),
};
```

---

## 12. Motion & Animation

Motion exists only to clarify a change — never for decoration.

Most interactions should feel instant. A duration of `0ms` with no transition at all is often the snappiest and best choice; the call is context-dependent.

When motion genuinely helps — revealing an element, moving something to a new position, indicating arrival or departure — keep it short and physical:

| Context             | Duration | Easing                                  | Notes                                           |
| ------------------- | -------- | --------------------------------------- | ----------------------------------------------- |
| State changes       | 150ms    | `cubic-bezier(0.16, 1, 0.3, 1)`         | HIG fast. Button presses, toggles.              |
| Popovers / tooltips | 200ms    | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` | Lumni overshoot. Slight physical feel.          |
| Overlays / modals   | 300ms    | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` | Lumni overshoot. Sheet presentations.           |
| Card entrances      | 400ms    | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` | Staggered at 60ms. Total under 500ms.           |
| Page headings       | 300ms    | `cubic-bezier(0.16, 1, 0.3, 1)`         | Fade-in + translate up 12px.                    |
| Ambient gradients   | 20s      | `linear`                                | CSS `@keyframes float-drift`. Slow, continuous. |

### 12.1 Prohibited Motion Patterns

- **No long animations**: Nothing above 500ms except deliberate, user-triggered celebrations (confetti, level-up). An animation longer than 500ms is a waiting room.
- **No looping**: `repeat: Infinity` on motion elements is decorative motion. Remove it. Loading indicators use CSS `animation`, not motion primitives.
- **No spring overshoots**: `type: "spring"` with non-zero `bounce` is prohibited. If you use a spring, `bounce: 0`.
- **No staggered entrances on page load**. Elements arrive when they arrive. Staggering says "watch me appear" instead of "here is the content."
- **No elastic easings**: Bouncy buttons, rubber-band effects — prohibited.

### 12.2 `prefers-reduced-motion` (HIG Accessibility)

Every motion-enabled component must wrap non-essential animations with `useReducedMotion()` from `motion/react`. Essential animations (progress feedback, loading skeletons) may remain. Drop the rest.

```tsx
import { useReducedMotion } from "motion/react";

const shouldReduce = useReducedMotion();
const transition = shouldReduce ? { duration: 0 } : { duration: 0.15, ease: motionEase };
```

### 12.3 CSS transitions vs. motion primitives

Prefer CSS `transition` for simple property changes: `transition-[background-color,transform] duration-150`. Reserve motion primitives (`m.div`, `AnimatePresence`) for layout animations, enter/exit sequences, and drag gestures.

### 12.4 Named Motion Rules

**The Waiting Room Rule.** Any animation over 500ms makes the user wait. Content that arrives in stages does not feel premium — it feels slow.

**The No-Looping Rule.** `repeat: Infinity` on a motion element is decoration. Remove every instance. Use CSS `@keyframes` for loading indicators.

**The Clarify-Not-Decorate Rule.** If removing the animation makes the interface harder to understand, keep it. If removing it makes no difference, remove it.

---

## 13. Feedback & Status

### 13.1 Immediate Feedback (HIG)

Every user action must produce immediate, honest response:

1. **Visual**: State change, animation, color shift.
2. **Haptic**: Vibration matching action significance.
3. **Audio**: Sound cues for important actions (optional, respect silent mode).

### 13.2 State Changes

| State           | Visual Indicator                      |
| --------------- | ------------------------------------- |
| Default         | Normal appearance                     |
| Pressed         | Scale 0.96, opacity 0.8               |
| Active/Selected | Study Green tint, filled icon         |
| Disabled        | Opacity 0.4, no interaction           |
| Loading         | Activity indicator replaces content   |
| Error           | Destructive tint, error icon, message |
| Success         | Success tint, checkmark icon          |

### 13.3 Notifications (HIG)

- **Badges**: Red oval on tab bar icons. Use for critical info only (e.g., "3" on Progress tab for new results).
- **Banners**: Non-intrusive top-of-screen alerts. Auto-dismiss after 5 seconds.
- **Alerts**: Modal interruption. Use only for critical, time-sensitive info (e.g., "Exam time is almost up.").

### 13.4 Exam-Specific Feedback

- **Correct answer**: Success tint + checkmark + light haptic + brief celebration.
- **Wrong answer**: Destructive tint + X icon + medium haptic + explanation reveal.
- **Time warning**: Warning tint + pulse animation + warning haptic at 5 min, 1 min.
- **Exam complete**: Success haptic + confetti (if enabled) + progress summary.

---

## 14. Accessibility (Integrated Throughout)

Accessibility is not a separate section — it is a first-class requirement in every design decision.

### 14.1 Vision

#### Dynamic Type (HIG)

- Support text scaling up to **200%** minimum (310% for iOS AX5).
- Use `rem` units and `clamp()` for fluid scaling.
- Test at largest accessibility size.
- All text sizes multiplied by `--text-scale`.

#### Color Contrast (HIG)

| Text Size | Weight | Minimum | Target |
| --------- | ------ | ------- | ------ |
| ≤ 17pt    | All    | 4.5:1   | 7:1    |
| ≥ 18pt    | All    | 3:1     | 4.5:1  |
| Any       | Bold   | 3:1     | 4.5:1  |

#### Color Independence (HIG)

- Never use color alone to convey meaning.
- Always pair with: icons, text labels, patterns, shapes.
- Example: Wrong answer shows red X + "Incorrect" text, not just red color.

### 14.2 VoiceOver / Screen Reader (HIG)

- **Every interactive element** must have a descriptive `aria-label`.
- **Bad**: "Button" | **Good**: "Submit Mathematics exam, 10 questions remaining"
- **Reading order**: Must match visual order (top-to-bottom, leading-to-trailing).
- **Headings**: Mark all headings with appropriate `aria-level`.
- **Landmarks**: Use `<nav>`, `<main>`, `<aside>`, `<footer>` for structure.
- **Exam questions**: Each question must be announced as a group with its options.

### 14.3 Motor (HIG)

- **Touch targets**: Minimum 44×44pt (28×28pt absolute minimum).
- **Spacing**: 12pt between bezeled elements, 24pt between non-bezel.
- **Gesture alternatives**: Every swipe must have a button equivalent.
- **Full keyboard access**: All functionality accessible via Tab/Enter/Space/Escape.
- **Exam navigation**: Arrow keys must navigate between questions, Enter to select answer.

### 14.4 Cognitive (HIG)

- **Keep actions simple and intuitive** — use familiar system patterns.
- **Minimize time-boxed elements** — avoid auto-dismiss without explicit action.
- **Avoid autoplay** — provide controls for all audio/video.
- **Reduce motion**: Respect `prefers-reduced-motion`.
- **Exam timer**: Must be pausable, must not auto-submit without warning.

### 14.5 Accessibility Checklist

```markdown
- [ ] Dynamic Type: Text scales to 200%+
- [ ] Contrast: All text meets 4.5:1 minimum
- [ ] Touch targets: All interactive elements ≥ 44×44pt
- [ ] VoiceOver labels: All interactive elements labeled
- [ ] Reading order: Logical top-to-bottom, left-to-right
- [ ] Color independence: No color-only state communication
- [ ] Keyboard: Full navigation and activation possible
- [ ] Reduced motion: Animations respect user preference
- [ ] Focus indicators: Visible focus rings on all interactive elements
- [ ] Exam questions: Screen reader announces question + options as group
- [ ] Timer: Pausable, audible warning before auto-submit
```

---

## 15. Platform Adaptations

### 15.1 iOS (Mobile-First)

- **Navigation**: Tab bar at bottom, navigation bar at top.
- **Touch**: Full gesture support, edge swipe for back.
- **Layout**: Single column, full-width content.
- **Safe areas**: Respect notch, dynamic island, home indicator.
- **Liquid Glass**: Tab bar and navigation bar.
- **Haptics**: Full haptic feedback on all interactions.

### 15.2 iPadOS

- **Navigation**: Tab bar at top (can adapt to sidebar), split view support.
- **Touch**: Apple Pencil support, hover states.
- **Layout**: Multi-column where appropriate, master-detail patterns.
- **Popover**: Use for contextual actions instead of full-screen modals.
- **Sidebar**: 240px width, Warm Paper Grouped background.

### 15.3 macOS

- **Navigation**: Sidebar + toolbar, no tab bar.
- **Input**: Hover states, cursor changes, keyboard shortcuts.
- **Layout**: Multi-column, fixed width containers, generous whitespace.
- **Window management**: Support for multiple windows/tabs.
- **Menu bar**: Include standard Edit, View, Window menus.

### 15.4 Desktop Web (Responsive)

- **Navigation**: Sidebar or top navigation, no tab bar.
- **Input**: Hover states, keyboard navigation.
- **Layout**: Responsive, generous whitespace.
- **Breakpoints**: 640px, 768px, 1024px, 1366px.

---

## 16. 2026 Design Language — Ambient, Motion & Easter Eggs

The app has been modernized with 2026 design trends while preserving the "Warm Frame" philosophy. Content still comes first, but the frame now breathes, responds, and occasionally delights.

### 16.1 Page Layout Pattern

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

**Exceptions**: Homepage (marketing), admin pages, dev pages, immersive quiz/exam sessions intentionally differ.

### 16.2 Ambient Gradients

A shared `<AmbientGradient>` component provides subtle floating radial gradients on every page. Three variants:

- **`default`** — Two large blobs (primary at top-right, chart-4 at bottom-left) with `animate-float-drift` (20s cycle, staggered)
- **`subtle`** — Lower opacity blobs offset differently, for pages with dense content
- **`quiz`** — Medium-sized blobs sized for the narrower quiz layout

The blobs are `pointer-events-none`, `blur-3xl`, and use CSS `@keyframes float-drift` for the slow organic drift. Always the first child inside the outer page wrapper.

### 16.3 Fade-In Entrances

Page headings fade in and translate up 12px on mount (`duration: 0.3s, ease: motionEase`). This is the primary entrance animation — it acknowledges the user has navigated without making them wait for a stagger sequence.

**Rules:**

- Headings only (h1 + subtitle), not content cards
- 300ms max (respects the waiting room rule)
- Skipped when `prefersReducedMotion()` is active
- Never staggered — content reveals as one unit

### 16.4 Card Interactions

Cards now have micro-interactions on hover/tap:

- **Gradient overlays:** Gradient that fades in on hover (`opacity-0 → opacity-100`, `duration-500`)
- **Arrow indicators:** Chevron arrow on the right side, fades in on hover
- **Scale on press:** `active:scale-[0.98]` for tactile feedback
- **Icon animation:** Icons scale up and rotate slightly on hover (`scale-110 rotate-[3deg]`)
- **Hover lift:** `hover:shadow-level-2` for perceived elevation

Applied via `group` + `group-hover:` utilities on card containers.

### 16.5 Staggered Card Grids

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

### 16.6 Magnetic 3D Cards (Desktop)

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

### 16.7 High-Impact Hero

The homepage hero uses a morphing blob background that responds to mouse movement:

- **Morphing blob:** CSS `@keyframes morph-shape` (30% → 70% → 40% → 60% border-radius cycle) with a subtle drift
- **Interactive quiz demo card:** Clickable answer buttons with visual correct/incorrect feedback (green/red tint + icon)
- **Animated badge:** Pulsing glow badge via `animate-pulse-glow`
- **Gradient headline:** `bg-gradient-to-r from-foreground via-primary to-chart-4 bg-clip-text text-transparent` for subtle color shift
- **iOS large-title:** `ios-large-title` class for 34px Outfit 800 heading
- **Live indicator:** "No credit card. No limits." with ping dot

### 16.8 Aurora Background (Chat)

The chat page uses an aurora-style animated background:

- Multiple oversized radial gradient blobs positioned at different coordinates
- Each blob has a different `animation-delay` for phase variance
- Uses `animate-aurora-drift` for slow, layered movement
- Combined with `backdrop-blur` on the header and message containers
- Readability maintained via solid message bubbles with shadow

### 16.9 Sticky Headers

Settings page uses a two-part sticky header:

- **Save button bar:** Fixed top-0 with `backdrop-blur-xl`, shows save button + loading state
- **Tab bar:** Sticky below with scrollable pill-style tab buttons
- Content panels slide in/out via `AnimatePresence` with exit/enter transitions

The sticky save bar ensures the user never loses their changes when scrolling through long settings.

### 16.10 Quiz-Specific Patterns

- **Drag-to-navigate:** Active quiz questions support horizontal drag gestures to advance. Spring reset below threshold. Drag indicator with scale transform.
- **Segmented progress bar:** Animated segments with numeric counter (e.g., "3/10"). Each segment pulses on completion.
- **Ambient floating blobs:** Quiz-specific variant of AmbientGradient (smaller, more subdued).

### 16.11 Tab Navigation

Two tab patterns are used:

1. **Dashboard TabNav** — Spring-animated pill indicator with `layoutId="tab-indicator"`. Backdrop blur background. 3 tabs: Today, Practice, Analytics.
2. **Generic TabSwitcher** — Two variants: `tabs` (filled tray + pill) and `segmented` (light tray + elevated pill). Used for filter controls.

Both use framer-motion spring animations for the indicator under `AnimatedTabIndicator`.

### 16.12 Easter Egg System

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

### 16.13 CSS Animation Keyframes

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
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  }
  50% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
  }
}
```

### 16.14 Named 2026 Rules

**The Consistent Shell Rule.** Every app page uses `bg-system-grouped` + `AmbientGradient` + `PageContainer` + fade-in heading. No page invents its own layout. The shell is the frame; the page is the art.

**The Head-Only Fade Rule.** Only page headings get fade-in entrance animation. Content arrives when it arrives. Stagger is for card grids, not for page sections.

**The All-Eggs-Non-Blocking Rule.** Easter eggs are overlays, not redirects. They never interrupt a study session, never change app state, and never persist. If the user refreshes, the egg is gone.

---

## 17. Implementation Guidelines

### 17.1 Next.js Specific

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        {/* iOS Web App Meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Lumni" />
      </head>
      <body className="bg-warm-paper text-ink">{children}</body>
    </html>
  );
}
```

### 17.2 CSS Architecture

```css
/* Use CSS layers for specificity management */
@layer reset, base, components, utilities;

@layer base {
  :root {
    /* All design tokens */
  }

  /* Respect user preferences */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### 17.3 Component Patterns

```tsx
// Button component — HIG + Lumni aligned
interface ButtonProps {
  variant: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size: "xs" | "sm" | "default" | "lg" | "icon";
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children, onPress, disabled, loading }) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-semibold transition-all duration-150
    active:scale-[0.96] active:opacity-80
    disabled:opacity-40 disabled:pointer-events-none
    focus-visible:outline-2 focus-visible:outline-offset-2
    focus-visible:outline-study-green/30
    min-h-[44px] min-w-[44px]
  `;

  const variantClasses = {
    default: "bg-study-green text-white rounded-xl px-4",
    secondary: "bg-surface-secondary text-ink rounded-xl px-4",
    outline: "bg-transparent text-ink border border-separator rounded-xl px-4",
    ghost: "bg-transparent text-ink rounded-xl px-4 hover:bg-warm-paper-secondary",
    destructive: "bg-destructive text-white rounded-xl px-4",
    link: "bg-transparent text-study-green underline-offset-4 hover:underline",
  };

  const sizeClasses = {
    xs: "h-5 text-xs",
    sm: "h-9 text-sm",
    default: "h-11 text-sm",
    lg: "h-12 text-base",
    icon: "h-11 w-11",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onPress}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? <ActivityIndicator /> : children}
    </button>
  );
};
```

---

## 18. Quality Assurance

### 18.1 Design Review Checklist

Before any UI ships, verify:

```markdown
### Navigation

- [ ] Tab bar visible on all non-modal screens
- [ ] Back button uses standard chevron
- [ ] No custom navigation that conflicts with system gestures
- [ ] Title describes current view (not app name)
- [ ] Large titles used at top level

### Typography

- [ ] Body text ≥ 17pt at default size
- [ ] Dynamic Type supported (scales to 200%+)
- [ ] Maximum 2 typefaces used (Outfit + Geist)
- [ ] No light weights for small text
- [ ] OS tracking values used at every size
- [ ] Outfit only above 20px, Geist below

### Layout

- [ ] Content extends to screen edges
- [ ] Safe areas respected
- [ ] Touch targets ≥ 44×44pt
- [ ] 8pt grid alignment maintained
- [ ] PageContainer used for all pages (except exceptions)

### Color

- [ ] Contrast ≥ 4.5:1 for all text
- [ ] Dark Mode supported
- [ ] Increase Contrast supported
- [ ] No color-only state communication
- [ ] Study Green ≤ 10% of any screen
- [ ] Warm neutrals tinted toward 60° hue

### Components

- [ ] One primary action per screen
- [ ] Button titles are specific verbs
- [ ] Alerts used sparingly, never for info-only
- [ ] Sheets have clear dismiss path
- [ ] Cards are solid, not glass
- [ ] Liquid Glass only for navigation

### Accessibility

- [ ] All interactive elements labeled
- [ ] Keyboard navigation works
- [ ] Reduced motion respected
- [ ] Screen reader order matches visual order
- [ ] Exam questions announced as groups
- [ ] Timer pausable with audible warning

### Motion

- [ ] No animations > 500ms
- [ ] No looping decorative animations
- [ ] No spring bounce
- [ ] prefers-reduced-motion handled
- [ ] Only headings get fade-in entrances
- [ ] Card stagger under 500ms total
```

### 18.2 Testing Matrix

| Condition         | Light Mode | Dark Mode |
| ----------------- | ---------- | --------- |
| Default contrast  | Test       | Test      |
| Increase contrast | Test       | Test      |
| Large text (AX5)  | Test       | Test      |
| Reduced motion    | Test       | Test      |
| VoiceOver on      | Test       | Test      |
| Keyboard only     | Test       | Test      |

### 18.3 Performance

- **Target 60fps** for all animations and transitions.
- **Use `transform` and `opacity`** for animations — they don't trigger layout.
- **Lazy load** images and heavy content below the fold.
- **Minimize repaints** — use `will-change` sparingly, remove after animation.
- **Above-fold content loads eagerly** — don't lazy load hero.

---

## 19. Do's and Don'ts

### Do:

- **Do** let Study Green be rare. 10% or less of any surface. When it appears, it should mean something: a button, a focus ring, a selected state.
- **Do** tint every neutral toward 60° warmth at chroma 0.003–0.005. Pure gray reads like a hospital. Warm reads like a desk lamp.
- **Do** use Outfit 800 for headings and Geist 400 for body. This pairing is the voice of a friend who knows the material.
- **Do** make every interactive element at least 44×44pt. Thumbs on a minibus, fingers after a long day: the interface does not penalize imprecision.
- **Do** layer depth through lightness first. A surface one step lighter or darker than its background is hierarchy. A shadow is atmosphere.
- **Do** use the motion easing (`cubic-bezier(0.16, 1, 0.3, 1)`) for every transition. Fast deceleration, no bounce. The app feels alive under your finger.
- **Do** animate only `transform` and `opacity`. Layout properties cause reflow. The page should not stutter.
- **Do** show skeleton shapes while content loads. A spinner says "wait." A skeleton says "something is coming."
- **Do** set `aspect-ratio` on every image and embedded media.
- **Do** use `gap-*` for all vertical and horizontal spacing between siblings. One source of truth.
- **Do** wrap every page in `<PageContainer>` (except home feed and admin dashboards).
- **Do** use design tokens for shadows (`shadow-level-*`), radii (`rounded-*`), and z-index (`--z-*`). Tokens keep dark mode in sync automatically.
- **Do** follow HIG navigation patterns: tab bar at bottom (iOS), sidebar on iPad, toolbar actions. Never invent custom navigation that conflicts with system gestures.
- **Do** use Liquid Glass for navigation bars and tab bars only. Never for cards or content.
- **Do** provide immediate feedback for every user action: visual, haptic, and (where appropriate) audio.
- **Do** test at largest accessibility text size. Dynamic Type is not optional.
- **Do** respect `prefers-reduced-motion`. Every motion-enabled component must handle it.

### Don't:

- **Don't** use gradient text. `background-clip: text` with a gradient is decoration pretending to be typography. Use solid Study Green or Ink. Emphasis comes from weight and size.
- **Don't** use side-stripe borders. A 3px `border-left` in Study Green on a card is not a design decision. It is a reflex. Use full borders, background tints, a leading number or icon, or nothing.
- **Don't** make cards out of glass. Glass materials (backdrop-filter blur) are for transient surfaces that slide in and out. Cards are furniture. Furniture is solid.
- **Don't** build the hero-metric template. Big number. Small label. Supporting stat. Gradient accent. SaaS cliché. The student does not need to be impressed. They need to study.
- **Don't** repeat the same card grid across the page. Icon. Heading. Text. Every card different or the grid is wrong.
- **Don't** reach for a modal first. Inline disclosure, progressive expansion, a sheet from the bottom: exhaust these before a modal. Modals interrupt. Studying requires flow.
- **Don't** put Outfit in labels, buttons, or data text. Outfit is for headings above 20px. Below that, Geist takes over.
- **Don't** invent new affordances. A button that does not look like a button, a scrollbar that disappears, a form control with no visible boundary: these do not feel premium. They feel broken.
- **Don't** paint inactive states with full color. Disabled is 50% opacity, period. Not a desaturated version of the active color.
- **Don't** bounce. Elastic easings, spring overshoots (except the motion curve), bouncy buttons: prohibited. Use the motion easing `cubic-bezier(0.16, 1, 0.3, 1)` for everything.
- **Don't** use dark mode as an excuse for purple gradients, neon accents, or glassmorphism. Dark mode shifts cooler (264° hue) and lifts the accent. The voice stays the same.
- **Don't** spray `will-change` across elements. Apply it to one or two specific properties that genuinely benefit from GPU compositing.
- **Don't** lazy load the hero. Above-fold content loads eagerly. Lazy loading is for content below the fold.
- **Don't** write arbitrary pixel values (`w-[200px]`, `text-[13px]`, `min-h-[250px]`). They bypass the design system and break dark mode, responsive scaling, and dynamic type.
- **Don't** hardcode shadow values. Use `shadow-level-1`, `shadow-level-2`, and `shadow-level-3`.
- **Don't** use `space-y-*` or manual `mt-* mb-*` pairs for sibling spacing. Use `gap-*` on the parent container.
- **Don't** write magic z-index numbers. Use `--z-content`, `--z-elevated`, `--z-sticky`, `--z-header`, `--z-drawer`, `--z-cookie-banner`, `--z-modal`, `--z-overlay`, `--z-toast`, `--z-skip-link`.
- **Don't** create page-level layout rules outside of `<PageContainer>`. The container owns the canvas; pages own the content.
- **Don't** override system gestures. Edge swipe for back navigation is sacred.
- **Don't** use alerts for informational-only messages. Find non-intrusive alternatives.
- **Don't** make Cancel the default button in alerts. Use Done for single-button alerts.
- **Don't** stack sheets. Dismiss current before presenting new.
- **Don't** use color alone to communicate state. Always pair with icons, text, or patterns.
- **Don't** use looping decorative animations. `repeat: Infinity` is prohibited on motion elements.
- **Don't** use spring animations with bounce. `bounce: 0` only.

---

## 20. Appendices

### Appendix A: HIG Cross-Reference

| This Document Section | Apple HIG Source                                    |
| --------------------- | --------------------------------------------------- |
| 2. Design Principles  | Foundations > Design Principles                     |
| 3. Design Tokens      | Foundations > [Various]                             |
| 4. Colors             | Foundations > Color                                 |
| 5. Typography         | Foundations > Typography                            |
| 6. Layout             | Foundations > Layout                                |
| 7. Materials          | Foundations > Materials                             |
| 8. Navigation         | Components > Navigation and Search                  |
| 9. Components         | Components > [Buttons, Lists, Sheets, Alerts, etc.] |
| 10. Content           | Patterns > [Onboarding, Loading, etc.]              |
| 11. Interaction       | Inputs > Gestures                                   |
| 12. Motion            | Patterns > [Motion, Feedback]                       |
| 13. Feedback          | Patterns > Feedback                                 |
| 14. Accessibility     | Accessibility                                       |
| 15. Platforms         | Platform-specific sections                          |

### Appendix B: Liquid Glass Quick Reference

```css
/* Tab Bar */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* Navigation Bar */
.nav-bar {
  position: sticky;
  top: 0;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}
```

### Appendix C: Token Migration Guide (From Old to New)

| Old Token                   | New Token                                 | Notes                      |
| --------------------------- | ----------------------------------------- | -------------------------- |
| `colors.study-green`        | `color.studyGreen`                        | Semantic naming            |
| `colors.warm-paper`         | `color.warmPaper`                         | Semantic naming            |
| `colors.ink`                | `color.ink` / `color.label`               | HIG alias added            |
| `colors.ink-muted`          | `color.inkMuted` / `color.labelSecondary` | HIG alias added            |
| `rounded.button`            | `radius.md`                               | Unified radius scale       |
| `rounded.card`              | `radius.lg`                               | Unified radius scale       |
| `spacing.11`                | `spacing.44`                              | HIG touch target alignment |
| `components.button-default` | `Button variant="default"`                | Component-based            |
| `components.card-default`   | `Card`                                    | Component-based            |

### Appendix D: Exam-Specific Design Patterns

| Pattern               | Implementation                                              | Accessibility                                       |
| --------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| **Question display**  | Full-screen, hidden chrome, tap to restore                  | Screen reader announces question + options as group |
| **Answer selection**  | List cells, 56px height, immediate visual + haptic feedback | Keyboard: arrow keys navigate, Enter selects        |
| **Progress tracking** | Segmented bar + numeric counter                             | Screen reader announces progress on change          |
| **Timer**             | Top-right, pulsing at 5min/1min, pausable                   | Audible warning, never auto-submits without warning |
| **Results**           | Summary card with breakdown by subject                      | Screen reader reads all results                     |
| **Explanation**       | Inline reveal below wrong answers                           | Keyboard accessible, focus moves to explanation     |

### Appendix E: South African NSC Context

- **Target users**: Grade 12 students (17-18 years old).
- **Device context**: Predominantly mobile (Android/iOS), often on limited data.
- **Environmental context**: Studying on minibus, at home, in library. Interface must work in all conditions.
- **Language**: English primary, with Afrikaans and isiZulu support planned.
- **Subjects**: Mathematics, Physical Sciences, Life Sciences, Accounting, Business Studies, Economics, Geography, History, etc.
- **Exam format**: NSC matric exams follow specific patterns that the UI must accommodate (multiple choice, structured questions, essay questions).

---

> **Document Status**: This DESIGN.md is the merged canonical standard. It combines Apple's official Human Interface Guidelines (2026) with Lumni's established brand identity, warm paper palette, and 2026 motion patterns. This document overrides all previous DESIGN.md versions.
>
> **Authority Hierarchy**:
>
> 1. HIG principles govern structure, navigation, accessibility, and platform conventions.
> 2. Lumni identity governs color, typography voice, emotional tone, and motion personality.
> 3. When in conflict, HIG wins on accessibility and platform behavior; Lumni wins on brand expression.
>
> **Next Step**: This document is ready for implementation. All team members should reference this as the single source of truth for design decisions.
> | Study Guide | `src/app/[locale]/study-guide/page.tsx` | study |
> | Problems | `src/app/[locale]/problems/page.tsx` | study |
> | Dictionary | `src/app/[locale]/dictionary/page.tsx` | default |
> | Auth | `src/app/[locale]/auth/layout.tsx` | auth |
> | Sidebar | `src/components/navigation/sidebar-nav.tsx` | glass sidebar |

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
