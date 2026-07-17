# Plan 222: Remove AnimatePresence layout prop to avoid full layout measurement on every question nav

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: perf

## Why this matters

In `quiz-view.tsx`, the question card transition uses `AnimatePresence mode="popLayout"` with an inner `m.div layout`. The `layout` prop triggers Framer Motion's full layout measurement engine — it captures the bounding box of every exiting and entering element, computes position deltas, and animates the transition. This is expensive on every question navigation (potentially 20+ times per quiz). Combined with `mode="popLayout"` (which removes the exiting element from layout flow immediately), the layout animation on a single card that doesn't change size is entirely wasted work.

Switching to `mode="wait"` and removing the `layout` prop eliminates layout measurement while preserving the exit/enter animation.

## Current state

- `src/components/quiz/quiz-view.tsx:297-322`:

```tsx
<AnimatePresence mode="popLayout">
  <m.div
    key={currentIndex}
    layout
    initial={{ opacity: 0, scale: 0.96, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.94, y: -6, transition: springPresets.cardExit }}
    transition={prefersReducedMotion ? undefined : springPresets.standard}
  >
    {/* QuestionCard */}
  </m.div>
</AnimatePresence>
```

- `mode="popLayout"` immediately removes the exiting element from layout flow (no space held)
- `layout` on `m.div` forces Framer Motion to compare old/new bounds on every render
- The card is a single child with fixed dimensions — layout animation adds zero visual value

## Target state

- `AnimatePresence mode="wait"` — only one card present at a time, no layout shift
- Remove `layout` prop from `m.div`
- Exit/enter animation preserved as-is

## Scope

- `src/components/quiz/quiz-view.tsx` — two prop changes

## Steps

### 1. Change `mode="popLayout"` to `mode="wait"`

In `src/components/quiz/quiz-view.tsx:297`, change:

```tsx
<AnimatePresence mode="popLayout">
```

to:

```tsx
<AnimatePresence mode="wait">
```

### 2. Remove `layout` prop from `m.div`

In `src/components/quiz/quiz-view.tsx:300`, remove the `layout` line.

### 3. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Manually verify: navigate through 3+ quiz questions. Each card should fade in from below and fade out upward. No layout shift/popping. The transition should feel identical.

## Stop conditions

- Exit animation doesn't play (element disappears instantly)
- Enter animation doesn't play (new card appears without transition)
- Quiz question counter or layout jumps on navigation

## Estimated time

30 min
