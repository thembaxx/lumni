# 181 — Add `@media (hover: hover)` gating for touch devices

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 CSS file + 15+ TSX files

## Problem

The entire codebase uses Tailwind `hover:` and `group-hover:` utilities with **zero** `@media (hover: hover) and (pointer: fine)` gating. On touch devices (iPad, phone), after tapping an element, the `:hover` CSS state **lingers** — showing sticky visual feedback (background color changes, scale transforms, shadow changes) until the user taps elsewhere.

AUDIT.md §6: "In JS: `useReducedMotion()` and branch transform values. Touch fires false hovers on tap."

Affected patterns include:

- Background color changes on cards (`hover:bg-muted/50`)
- Scale transforms (`hover:scale-105`, `group-hover:scale-110`)
- Opacity reveals (`group-hover:opacity-100`, `hover:opacity-100`)
- Border/color changes (`hover:border-foreground/15`)

Found across ~100+ `hover:` usages on the dashboard (competency-overview, daily-challenge-card, study-card, streak-card, search-results, exam-card, etc.), home page (features-grid:109-121 with 3 group-hover effects), and tool cards.

## Target

Add `@media (hover: hover)` gating to all `hover:` and `group-hover:` utilities that affect visual state (scale, opacity, background). The cleanest approach is a Tailwind v4 custom variant:

```css
@custom-variant hoverable (@media (hover: hover) and (pointer: fine));
```

Then migrate `hover:` → `hoverable:` for any effect that changes **transform**, **opacity**, or **scale**. Color-only changes (`hover:bg-*`, `hover:text-*`) are lower priority but should ideally also be gated.

Alternatively, for a faster fix: wrap the global CSS with a rule that disables hover effects on touch devices:

```css
@media (hover: none) and (pointer: coarse) {
  .hover\:scale-\[1\.02\]:hover {
    transform: none !important;
  }
}
```

But the Tailwind variant approach is cleaner and more maintainable.

## Repo conventions to follow

- The project already uses `@custom-variant` in `globals.css:4` (`@custom-variant dark (&:is(.dark *));`).
- Motion already has `useReducedMotion()` guards for hover effects in some components (e.g., `stat-card.tsx:72` — `whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}`).

## Steps

1. Open `src/app/globals.css`.
2. Add a new `@custom-variant` right after the existing `dark` variant (line 4):
   ```css
   @custom-variant hoverable (@media (hover: hover) and (pointer: fine));
   ```
3. Identify the highest-impact files first. Priority order:
   - **Group 1** (transform/scale/opacity hover effects on touch devices = highest impact): `features-grid.tsx:109-121`, `tool-card.tsx:51,54`, all `group-hover:scale-*` instances.
   - **Group 2** (background color hover on cards): `streak-card.tsx:24`, `competency-overview.tsx:175`, `study-card.tsx:20`, `daily-challenge-card.tsx:31`, `search-results.tsx:215`, `exam-card.tsx:65`.
4. For each `hover:` or `group-hover:` that changes transform/scale/opacity, replace `hover:` with `hoverable:` and `group-hover:` with `group-hoverable:`.

## Boundaries

- Do NOT touch `@media (hover: hover)` rules that are already present — there are currently zero.
- Do NOT remove hover effects entirely — only gate them so touch devices don't see them.
- Color-only transitions (`transition-colors`) on hover are lower priority — consider them secondary.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Open the app on a touch device (or use Chrome DevTools device emulation with touch enabled). Tap a card — the hover effect should NOT persist after the tap. On a desktop with a mouse, hover effects should work normally.
- **Done when**: All `group-hover:scale-*`, `hover:scale-*`, and `group-hover:opacity-*` effects are gated behind the `hoverable` media query.
