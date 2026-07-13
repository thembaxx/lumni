# 188 — Reduce excessive `backdrop-filter: blur()` values

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 1 file, 4 CSS rules

## Problem

Four CSS utility classes in `globals.css` define `backdrop-filter: blur()` values that exceed the 20px AUDIT §5 threshold — heavy blur is expensive, especially in Safari:

```css
/* Line 830 */
.glass-regular {
  backdrop-filter: blur(24px); /* 24px — exceeds 20px threshold */
}

/* Line 834 */
.glass-thick {
  backdrop-filter: blur(40px); /* 40px — 2x threshold */
}

/* Line 838 */
.glass-card {
  backdrop-filter: blur(20px); /* 20px — at threshold */
}

/* Line 843 */
.glass-card-strong {
  backdrop-filter: blur(30px); /* 30px — 1.5x threshold */
}
```

The `.glass-thin` class at line 826 uses `blur(20px)` which is at the threshold — borderline but acceptable.

The bottom navigation bar (`bottom-nav.tsx:151`) uses `.glass-regular` with `blur(24px)` and is always visible on mobile — this is the highest-impact case since it persists across all page interactions.

AUDIT.md §5: "Keep transition-time `filter: blur()` under 20px — heavy blur is expensive, especially in Safari."

## Target

Reduce blur values to ≤ 20px:

```css
.glass-regular {
  backdrop-filter: blur(20px);
} /* 24→20 */
.glass-thick {
  backdrop-filter: blur(24px);
} /* 40→24 (or 20) */
.glass-card {
  backdrop-filter: blur(16px);
} /* 20→16 */
.glass-card-strong {
  backdrop-filter: blur(20px);
} /* 30→20 */
```

The optical difference between `blur(24px)` and `blur(20px)` is nearly imperceptible, but the performance cost difference is significant (blur is O(n²) in radius).

## Repo conventions to follow

- Glass utility classes are defined in `src/app/globals.css` at lines 820-845.
- The `--system-blur` variable at line 41 (`20px`) is used elsewhere — the glass classes should follow it.
- The `@media (prefers-reduced-transparency: reduce)` rule at lines 943-954 already handles the accessibility side.

## Steps

1. Open `src/app/globals.css`.
2. Line 830: Change `blur(24px)` to `blur(20px)`.
3. Line 834: Change `blur(40px)` to `blur(24px)` — 24px is the `.glass-regular` value and provides a meaningful visual distinction between "regular" and "thick" while staying reasonable.
4. Line 838: Change `blur(20px)` to `blur(16px)` — keeps the glass-card lighter than .glass-regular.
5. Line 843: Change `blur(30px)` to `blur(20px)` — matches the threshold.

## Boundaries

- Do NOT touch the `@media (prefers-reduced-transparency: reduce)` rule (lines 943-954).
- Do NOT remove the glass utility classes — only reduce the blur radius.
- Do NOT change any other CSS properties on these classes (background colors, borders, etc.).

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors (CSS-only change).
- **Performance check**: In Chrome DevTools, enable `Rendering → Layer borders`. Verify the bottom nav and glass surfaces still have a compositor layer (orange border). Record a Performance profile while scrolling — there should be fewer Composite layer repaints compared to before.
- **Feel check**: The glass blur should still be clearly visible but subtly lighter. The optical difference between `blur(24px)` and `blur(20px)` should be nearly imperceptible.
- **Done when**: No `backdrop-filter: blur()` value exceeds 24px, and all but `.glass-thick` are ≤ 20px.
