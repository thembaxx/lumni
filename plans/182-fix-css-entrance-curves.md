# 182 — Replace `--ease-default` with `--ease-decelerate` on CSS entrances

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Easing & duration
- **Estimated scope**: 1 file, 4 lines

## Problem

Four CSS entrance animation rules in `globals.css` use `--ease-default` which is a **symmetric ease-in-out** curve `cubic-bezier(0.25, 0.46, 0.45, 0.94)`. AUDIT.md §2: entering elements must use ease-out (starts fast, feels responsive). The symmetric curve means entrances start slow (delaying the moment the user sees the element) and end slow (making the full animation feel sluggish).

Affected rules in `src/app/globals.css`:

```css
/* Line 747 */
.animate-fade-in-up {
  animation: fadeInUp var(--motion-slow) var(--ease-default) forwards;
}

/* Line 750 */
.animate-fade-in-scale {
  animation: fadeInScale var(--motion-normal) var(--ease-default) forwards;
}

/* Line 781 */
.animate-stagger > * {
  animation: fadeInUp var(--motion-slow) var(--ease-default) forwards;
}

/* Line 694 — view transition */
::view-transition-new(practice-trigger) {
  animation: vt-morph-in var(--motion-normal) var(--ease-default) both;
}
```

Note: `.card-entrance` (line 1003) and `.card-entrance-sm` (line 1006) already correctly use `--ease-decelerate`.

## Target

Replace `var(--ease-default)` with `var(--ease-decelerate)` in all 4 entrance rules above:

```css
/* target */
.animate-fade-in-up {
  animation: fadeInUp var(--motion-slow) var(--ease-decelerate) forwards;
}
```

`--ease-decelerate: cubic-bezier(0, 0, 0.2, 1)` starts fast (snappy response), then decelerates smoothly (polished arrival).

## Repo conventions to follow

- The repo already uses `--ease-decelerate` for `.card-entrance` (line 1003) and `.card-entrance-sm` (line 1006) — this is the established pattern for entrance animations.
- Duration tokens remain unchanged: `--motion-slow: 400ms` for fadeInUp and stagger, `--motion-normal: 300ms` for fadeInScale.

## Steps

1. Open `src/app/globals.css`.
2. Line 747: Change `var(--ease-default)` to `var(--ease-decelerate)`.
3. Line 750: Change `var(--ease-default)` to `var(--ease-decelerate)`.
4. Line 781: Change `var(--ease-default)` to `var(--ease-decelerate)`.
5. Line 694: Change `var(--ease-default)` to `var(--ease-decelerate)`.

## Boundaries

- Do NOT change any keyframe definitions, duration tokens, or non-entrance animation rules.
- Do NOT touch `.card-entrance` or `.card-entrance-sm` — they already use `--ease-decelerate`.
- Do NOT change the view transition `::view-transition-old(root)` (lines 698-700) — those use `ease-out` (a CSS keyword) which is acceptable.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors (CSS-only change).
- **Feel check**: Open the app and trigger a fade-in-up entrance animation. The element should appear quickly (no sluggish start) and glide gently to its final position. Compare before and after in DevTools Animations panel at 25% playback speed.
- **DevTools check**: In the Computed panel for an element with `.animate-fade-in-up`, verify `animation-timing-function` shows `cubic-bezier(0, 0, 0.2, 1)`.
- **Done when**: All 4 lines use `--ease-decelerate` instead of `--ease-default`.
