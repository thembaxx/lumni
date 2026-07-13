# 186 — Convert rAF+setState number tween to Motion springs

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 2 files, ~40 lines

## Problem

Two components use `requestAnimationFrame` + `setState` for number tweening/ counting animations, causing 60 React re-renders per second during the animation. This triggers full Virtual DOM diffing and reconciliation on every frame.

**1. `src/hooks/use-animated-number.ts:36-40`**:

```typescript
const animate = (now: number) => {
  const elapsed = now - startRef.current;
  const progress = Math.min(elapsed / duration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const current = Math.round(from + (target - from) * eased);
  setDisplayValue(current); // ← triggers React re-render every frame
  if (progress < 1) {
    rafRef.current = requestAnimationFrame(animate);
  }
};
rafRef.current = requestAnimationFrame(animate);
```

**2. `src/components/home/animated-stats-section.tsx:25-27`** — same pattern used for scroll-triggered counter animation.

The repo already has the correct pattern in `src/components/dashboard/stats-cards.tsx:27-30`:

```typescript
const springValue = useSpring(0, springPresets.standard);
useMotionValueEvent(springValue, "change", (latest) => {
  setDisplayValue(Math.round(latest));
});
```

Motion's `useSpring` + `useMotionValueEvent` drives the animation on the compositor without triggering React reconciliation every frame. The `setDisplayValue` only runs on the `change` event (which Motion throttles to ~30fps for `change` callbacks, and it doesn't trigger layout/reflow).

## Target

Replace the rAF-based `useAnimatedNumber` hook with a Motion `useSpring`-based implementation. Update `animated-stats-section.tsx` to use the refactored hook.

## Repo conventions to follow

- The repo already uses `useSpring` for number tweens — see `stats-cards.tsx:27` and `quiz-header.tsx:20`.
- `springPresets` from `@/lib/utils/spring-presets` is the standard spring config source (~57 files).
- `useMotionValueEvent` for driving display updates — see `stats-cards.tsx:30`.

## Steps

1. Open `src/hooks/use-animated-number.ts`.
2. Replace the entire implementation:

   ```typescript
   "use client";

   import { useEffect, useRef } from "react";
   import { useMotionValueEvent, useSpring } from "motion/react";
   import { springPresets } from "@/lib/utils/spring-presets";

   export function useAnimatedNumber(target: number, duration = 400, shouldAnimate = true) {
     const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : target);
     const springValue = useSpring(0, {
       ...springPresets.standard,
       stiffness: springPresets.standard.stiffness * (400 / duration),
     });

     useEffect(() => {
       if (!shouldAnimate) {
         setDisplayValue(target);
         return;
       }
       springValue.set(target);
     }, [target, duration, shouldAnimate, springValue]);

     useMotionValueEvent(springValue, "change", (latest) => {
       setDisplayValue(Math.round(latest));
     });

     return displayValue;
   }
   ```

   Note: Ensure `useState` is imported (it currently is at line 5).

3. Open `src/components/home/animated-stats-section.tsx`.
4. Replace the rAF-based animation with `useAnimatedNumber()` (already using the hook, but the hook now has the better implementation).

## Boundaries

- Do NOT change the hook's public API — `useAnimatedNumber(target, duration, shouldAnimate)` must keep the same signature.
- Do NOT change `animated-stats-section.tsx` logic beyond removing any rAF code.
- Do NOT touch `canvas-confetti.tsx` or other canvas-based rAF loops — those are acceptable.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Performance check**: Open DevTools Performance panel. Trigger a number tween. There should be zero forced reflows/layouts during the animation (check for purple Layout markers in the flame chart).
- **Feel check**: The number should spring smoothly to its target with a subtle deceleration settle. It should feel the same as before — the visual behavior should be a near-match.
- **Done when**: `useAnimatedNumber` no longer contains `requestAnimationFrame`. It uses `useSpring` + `useMotionValueEvent`.
