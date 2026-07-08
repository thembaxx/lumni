# DESIGN.md

# Lumni — Pure Grayscale Design System

## AI-powered South African NSC Grade 12 Exam Preparation

# Version: 3.0.0 | Monochrome Overhaul

## Design Philosophy

Pure grayscale. No accent color. Contrast via font-weight, spacing, and opacity.

The interface is a reading room — quiet, focused, nothing decorative. Every pixel exists
to make the content clearer. The typography and layout do all the work.

---

## Design Tokens

### Colors

Pure grayscale (oklch chroma 0 throughout):

| Token             | Light                 | Dark                   |
| ----------------- | --------------------- | ---------------------- |
| Background        | oklch(99% 0 0)        | oklch(8% 0 0)          |
| Background Sec.   | oklch(97% 0 0)        | oklch(12% 0 0)         |
| Surface (cards)   | oklch(100% 0 0)       | oklch(14% 0 0)         |
| Surface Sec.      | oklch(97% 0 0)        | oklch(18% 0 0)         |
| Separator         | oklch(0% 0 0 / 0.08)  | oklch(100% 0 0 / 0.12) |
| Text Primary      | oklch(12% 0 0)        | oklch(92% 0 0)         |
| Text Secondary    | oklch(12% 0 0 / 0.6)  | oklch(92% 0 0 / 0.6)   |
| Text Tertiary     | oklch(12% 0 0 / 0.35) | oklch(92% 0 0 / 0.35)  |
| Selected / Accent | oklch(12% 0 0)        | oklch(100% 0 0)        |
| Destructive       | oklch(45% 0 0)        | oklch(45% 0 0)         |
| Success           | oklch(40% 0 0)        | oklch(40% 0 0)         |

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

| Token      | Duration | Curve                                |
| ---------- | -------- | ------------------------------------ |
| Fast       | 200ms    | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| Normal     | 300ms    | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| Slow       | 400ms    | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| Decelerate | —        | cubic-bezier(0, 0, 0.2, 1)           |
| Accelerate | —        | cubic-bezier(0.4, 0, 1, 1)           |

### Spacing

8px grid: 2, 4, 6, 8, 12, 14, 16, 20, 22, 24, 32, 40, 48, 64, 80, 88px.

## Prohibited

- No accent color with chroma > 0
- No gradient text
- No glassmorphism as default
- No bounce/spring/elastic easings
- No side-stripe borders
- No gradient borders or glow effects
- No particle/ambient effects
- No looping animations beyond loading indicators

## Accessibility

- WCAG 2.2 AA target
- Focus-visible rings in pure grayscale
- Touch targets min 44px
- Respects `prefers-reduced-motion`
- Contrast-enhanced variant via `prefers-contrast: more`
