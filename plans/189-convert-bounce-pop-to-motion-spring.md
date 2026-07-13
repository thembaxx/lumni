# 189 — Convert `bounce-pop` keyframe to Motion spring

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 2 files, ~10 lines

## Problem

`bounce-pop` is a CSS `@keyframes` animation used on the bolt celebration overlay icon and XP display. CSS keyframes **restart from zero** mid-animation — if the celebration re-triggers (e.g., rapid quiz completion), the icon shrinks to `scale(0.3)` mid-sequence.

Keyframe in `src/app/globals.css:1098-1113`:

```css
@keyframes bounce-pop {
  0% {
    transform: scale(0.3);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

Used in `src/components/dashboard/bolt-celebration.tsx:46,69`:

```tsx
<div className="animate-bounce-pop" style={{ animationDelay: "0.15s" }}>
```

Also used in `quiz-results.tsx:85` and `easter-egg-context.tsx:321` (lower risk).

AUDIT.md §4: "Anything triggered rapidly or reversible mid-motion must use transitions or springs."

## Target

Convert `bounce-pop` from a CSS keyframe to a Motion spring entrance. The equivalent spring config is:

```typescript
transition={{ type: "spring", stiffness: 300, damping: 12, mass: 0.6 }}
```

This creates a similar overshoot-settle feel (`scale: 0.3 → 1.2 → 0.9 → 1`) but is interruptible — if the component re-renders mid-animation, Motion retargets from the current scale, not from `scale(0.3)`.

## Repo conventions to follow

- Motion `initial`/`animate` pattern is standard for entrances.
- `springPresets` isn't a perfect match here — this spring needs visible bounce (damping: 12), unlike the standard `bounce: 0` presets. Add a new spring config or inline it with a comment referencing the `bounce-pop` keyframe.
- The `className="animate-bounce-pop"` pattern should be replaced with Motion props on the innermost `<div>`.

## Steps

1. Open `src/components/dashboard/bolt-celebration.tsx`.
2. Replace the outer `animate-bounce-pop` `<div>` (line 46) with a Motion `<m.div>`:

   ```tsx
   <m.div
     initial={{ scale: 0.3, opacity: 0.5 }}
     animate={{ scale: 1, opacity: 1 }}
     transition={{ type: "spring", stiffness: 300, damping: 12, mass: 0.6, delay: 0.15 }}
     className={cn("relative flex size-24 items-center justify-center rounded-3xl", correct ? "bg-success/15 ring-1 ring-success/25" : "bg-destructive/10 ring-1 ring-destructive/20")}
   >
   ```

   Note: The outer container currently has two classes — one for the background styling and `animate-bounce-pop`. This means the bounce-pop wrapper `<div>` is the same element as the background container. Wrap the icon in a Motion div directly.

3. Replace the second `animate-bounce-pop` at line 69 (XP display area) similarly:

   ```tsx
   <m.div
     initial={{ scale: 0.3, opacity: 0.5 }}
     animate={{ scale: 1, opacity: 1 }}
     transition={{ type: "spring", stiffness: 300, damping: 12, mass: 0.6, delay: 0.28 }}
     className="flex items-center gap-3"
   >
   ```

4. Open `src/app/globals.css` — remove the `@keyframes bounce-pop` block (lines 1098-1113) ONLY if no other consumers exist. Check with `grep -r "bounce-pop" src/` for remaining references in `quiz-results.tsx` and `easter-egg-context.tsx`.

## Boundaries

- Do NOT remove the `bounce-pop` keyframe from `globals.css` if other files still use it. Only remove after confirming zero remaining consumers.
- Do NOT change the background/container styling of the celebration elements — only the bounce animation.
- Do NOT touch the `materialize` animation (lines 1115-1123) — that's a separate finding.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Complete a quiz in the daily bolt. The icon should pop in with a satisfying overshoot (scale 0.3→1.2→settle) but feel continuous. Rapidly trigger the celebration (e.g., by clicking rapidly) — the icon should NOT shrink mid-sequence; it should smoothly retarget.
- **Interruptibility check**: In DevTools Animations panel at 10% speed, trigger the celebration, then immediately trigger it again. The first animation should seamlessly redirect to the new target without resetting to `scale(0.3)`.
- **Done when**: `bolt-celebration.tsx` uses Motion springs for the bounce effect, and the `bounce-pop` CSS class is verified as unused or removed.
