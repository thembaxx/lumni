# 183 — Convert `card-entrance` keyframes to Motion transitions

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 2 files, ~20 lines

## Problem

Dashboard cards use CSS `@keyframes card-entrance` and `card-entrance-sm` for their entrance animations. These are applied via the `FadeIn` wrapper component (`src/components/shared/fade-in.tsx`) which maps all entrance directions to these CSS class names.

CSS keyframes **restart from zero** when the element re-mounts mid-animation. Dashboard cards frequently re-render due to:

- Data refresh after quiz completion
- Background sync updates
- Lazy loading of lazy-loaded sections

When a card re-renders mid-entrance, it flashes from `opacity: 0; translateY(12px)` — a jarring visual jump.

Keyframe definition in `src/app/globals.css:1012-1030`:

```css
@keyframes card-entrance {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes card-entrance-sm {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

CSS classes (lines 1001-1011):

```css
.card-entrance {
  animation: card-entrance 400ms var(--ease-decelerate) both;
}
.card-entrance-sm {
  animation: card-entrance-sm 300ms var(--ease-decelerate) both;
}
```

`FadeIn` wrapper in `src/components/shared/fade-in.tsx:29-51`:

```typescript
const entranceClass = {
  up: "card-entrance",
  down: "card-entrance-sm",
  left: "card-entrance-sm",
  right: "card-entrance-sm",
  scale: "card-entrance-sm",
};

export function FadeIn({ children, direction = "up", delay, className, as = "div", ...rest }) {
  const cls = entranceClass[direction];
  // ... applies cls as className
}
```

14+ dashboard consumers including: `dashboard-client.tsx`, `streak-card.tsx`, `study-card.tsx`, `today-focus-card.tsx`, `weak-topics-card.tsx`, `recent-questions-card.tsx`, `dashboard-hero.tsx`, `question-of-the-day-card.tsx`, `daily-progress-ring.tsx`, `daily-challenge-card.tsx`, `competency-overview.tsx`, `countdown-header.tsx`, `login-banner.tsx`, `quiz-results.tsx`.

## Target

Convert `card-entrance` from CSS keyframes to Motion's `initial`/`animate` with `springPresets.fast` (stiffness: 400, damping: 28, mass: 0.7). Motion transitions retarget from the current state mid-animation — no restart flash.

## Repo conventions to follow

- Motion `initial`/`animate` pattern with `springPresets` is already the standard in this codebase (~57 files).
- The `FadeIn` component already imports from Motion internally — but uses className instead of Motion: `src/components/shared/fade-in.tsx` is a plain `<div>` wrapper. The conversion should turn it into a Motion `<m.div>`.
- `springPresets.fast` is the appropriate spring for entrances (used by `stat-card.tsx`, `list-cell.tsx`, `quiz-view.tsx`, etc.).

## Steps

1. Open `src/components/shared/fade-in.tsx`.
2. Add the import:
   ```typescript
   import { m } from "motion/react";
   import { springPresets } from "@/lib/utils/spring-presets";
   ```
3. Replace the `<Tag>` wrapper (line 43-50) with a Motion component:

   ```typescript
   const MotionTag = m[Tag as "div"];

   return (
     <MotionTag
       initial={{ opacity: 0, y: direction === "up" || direction === "down" ? 12 : 0, x: direction === "left" ? -12 : direction === "right" ? 12 : 0, scale: direction === "scale" ? 0.95 : 1 }}
       animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
       transition={{ ...springPresets.fast, delay: delay || 0 }}
       className={className}
       {...rest}
     >
       {children}
     </MotionTag>
   );
   ```

4. Remove the `entranceClass` map (lines 22-27) — no longer needed.
5. Remove the `cls` variable and the `Tag` variable's usage of it.
6. The CSS classes `.card-entrance` and `.card-entrance-sm` in `globals.css` (lines 1001-1011) can be left in place for now — they may have other non-FadeIn consumers. Check with `grep -r "card-entrance" src/` to confirm.

## Boundaries

- Do NOT remove `.card-entrance` / `.card-entrance-sm` CSS classes from `globals.css` until confirming no other consumers use them directly (not via `FadeIn`).
- Do NOT change any other dashboard component files — the fix is in the `FadeIn` wrapper itself.
- Do NOT touch the reduced-motion reduce rule — `motion-reduce:animate-none` on individual cards already exists.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors. `pnpm exec oxlint` — 0 warnings.
- **Feel check**: Navigate the dashboard. Cards should enter with a spring-like settle (not a linear slide). Refresh data (complete a quiz) — cards should NOT flash/restart their entrance animation. They should remain in place or smoothly transition if they need to re-render.
- **Interruptibility check**: In DevTools, use the Application tab to clear IndexedDB. The dashboard will re-render as data disappears. Cards should not flash from `opacity:0` during this transition.
- **Done when**: `FadeIn` uses Motion `m.div` with `springPresets.fast` instead of CSS keyframe class names.
