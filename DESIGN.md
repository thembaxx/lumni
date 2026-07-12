# DESIGN.md

# Lumni — Warm-Tinted Design System

## AI-powered South African NSC Grade 12 Exam Preparation

# Version: 4.0.0 | Warm Color Introduction

## Design Philosophy

Warm-tinted neutrals with a restrained amber/gold accent. The interface feels
like a well-lit study room — warm, focused, purposeful. Color is strategic,
not decorative: a single accent for interaction, semantic hues for meaning,
and subtle warmth in every surface.

Typography, spacing, and opacity still do the heavy lifting. Color supports
hierarchy without competing with content.

---

## Design Tokens

### Colors

Warm-tinted neutrals (oklch hue ~60) with a restrained accent palette:

| Token           | Light                 | Dark                   |
| --------------- | --------------------- | ---------------------- |
| Background      | oklch(99% 0.008 60)   | oklch(8% 0.006 60)     |
| Background Sec. | oklch(97% 0.012 60)   | oklch(12% 0.008 60)    |
| Surface (cards) | oklch(100% 0.005 60)  | oklch(14% 0.008 60)    |
| Surface Sec.    | oklch(97% 0.012 60)   | oklch(18% 0.01 60)     |
| Separator       | oklch(0% 0 0 / 0.08)  | oklch(100% 0 0 / 0.12) |
| Text Primary    | oklch(12% 0 0)        | oklch(92% 0 0)         |
| Text Secondary  | oklch(12% 0 0 / 0.6)  | oklch(92% 0 0 / 0.6)   |
| Text Tertiary   | oklch(12% 0 0 / 0.35) | oklch(92% 0 0 / 0.35)  |
| Accent (CTA)    | oklch(58% 0.2 70)     | oklch(72% 0.2 70)      |
| Destructive     | oklch(48% 0.18 28)    | oklch(58% 0.2 28)      |
| Success         | oklch(52% 0.14 145)   | oklch(58% 0.16 145)    |
| Warning         | oklch(62% 0.16 70)    | oklch(68% 0.18 70)     |
| Info            | oklch(52% 0.08 220)   | oklch(56% 0.1 220)     |

**Accent usage**: primary CTA, active/selected state, current nav item, focus rings, links only. One accent, ≤10% of surface area. Semantic colors reserved for state indicators and badges.

**Text remains achromatic** (chroma 0) for maximum readability against warm backgrounds.

**Chart colors** — data-viz palette aligned with semantic hues:

- Chart 1 (emerald): oklch(52% 0.14 145)
- Chart 2 (green): oklch(58% 0.13 145)
- Chart 3 (amber): oklch(62% 0.18 70)
- Chart 4 (blue): oklch(55% 0.13 230)
- Chart 5 (coral): oklch(50% 0.18 28)

### Typography

**Font**: Open Runde (self-hosted via `@fontsource/open-runde`, 400/500/600/700 weights)

Three sizes only:

| Token         | Size            | Usage                           |
| ------------- | --------------- | ------------------------------- |
| Large Heading | 1.5rem (24px)   | Page titles, section headers    |
| Small Heading | 1.125rem (18px) | Card headers, subsection titles |
| Body          | 1rem (16px)     | All text, labels, captions      |

### Border Radius

Consistent 12px everywhere: cards, buttons, inputs, sheets, badges, tabs, list groups.

### Shadows

Three levels, pure grayscale (oklch 0% chroma):

- Level 1: subtle float for resting cards
- Level 2: elevated cards
- Level 3: modals, drawers, overlays

### Motion

Mac-like smooth. Eased transitions at 300-400ms.

The system expresses motion through Framer Motion's `spring` solver with `bounce: 0` (critically damped — no overshoot). This is the implementation of the `Decelerate` curve below; it is the accepted, consistent vocabulary across the codebase. Do not substitute raw cubic-bezier literals in isolated components — that diverges from the rest of the app.

| Token      | Duration | Curve                             |
| ---------- | -------- | --------------------------------- |
| Fast       | 200ms    | cubic-bezier(0.25,0.46,0.45,0.94) |
| Normal     | 300ms    | cubic-bezier(0.25,0.46,0.45,0.94) |
| Slow       | 400ms    | cubic-bezier(0.25,0.46,0.45,0.94) |
| Decelerate | —        | cubic-bezier(0, 0, 0.2, 1)        |
| Accelerate | —        | cubic-bezier(0.4, 0, 1, 1)        |

### Spacing

8px grid: 2, 4, 6, 8, 12, 14, 16, 20, 22, 24, 32, 40, 48, 64, 80, 88px.

## Prohibited

- No accent color usage beyond 10% of surface area
- No more than one accent color (the system amber)
- No gradient text
- No glassmorphism as default
- No bounce/overshoot/elastic easings (spring with `bounce: 0` is allowed — it is the critically-damped decelerate the system uses)
- No side-stripe borders
- No gradient borders or glow effects
- No particle/ambient effects
- No looping animations beyond loading indicators

## Accessibility

- WCAG 2.2 AA target
- Focus-visible rings use `--system-accent`
- Touch targets min 44px
- Respects `prefers-reduced-motion`
- Contrast-enhanced variant via `prefers-contrast: more`
