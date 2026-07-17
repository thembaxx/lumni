# Plan 217: Replace domMax with domAnimation in root LazyMotion

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf

## Why this matters

`domMax` loads Framer Motion's full layout measurement engine (`layout` animations, `AnimatePresence mode="popLayout"`) and gesture recognition (`drag`, `pan`, `hover`) into the initial JavaScript bundle. This adds ~15 KB gzipped to every page load, even pages that use nothing more than `opacity`/`y` transitions. The root layout in `src/app/[locale]/layout.tsx` wraps the entire app tree — every route pays this cost regardless of whether it needs it.

Replacing `domMax` with `domAnimation` (animate/exit/children only) saves the bundle overhead app-wide and defers the full engine load to pages that genuinely need it.

## Current state

- `src/app/[locale]/layout.tsx:2` — `import { domMax, LazyMotion } from "motion/react"`
- `src/app/[locale]/layout.tsx:201` — `<LazyMotion features={domMax}>` wraps all route content
- `src/components/quiz/quiz-view.tsx:268` — `drag={isQuizActive && isTouchDevice ? "x" : false}` on `m.main` — this is the only drag usage in the app

## Target state

- Root layout uses `domAnimation` instead of `domMax`
- Quiz view page imports `domMax` locally and wraps its drag-using section with a nested `<LazyMotion features={domMax}>`
- All other routes get the smaller `domAnimation` bundle

## Scope

- `src/app/[locale]/layout.tsx` — change import and prop
- `src/components/quiz/quiz-view.tsx` — add local import of `domMax` and wrap drag-using UI

## Steps

### 1. Update root layout

In `src/app/[locale]/layout.tsx`:

- Change `import { domMax, LazyMotion } from "motion/react"` to `import { domAnimation, LazyMotion } from "motion/react"`
- Change `<LazyMotion features={domMax}>` to `<LazyMotion features={domAnimation}>`

### 2. Confirm quiz-view uses drag features

`src/components/quiz/quiz-view.tsx:268` has `drag` prop — this requires `domMax`. Wrap the drag-enabled `m.main` section:

- Add `import { domMax, LazyMotion } from "motion/react"` at the top
- Wrap the `<m.main ... drag={...}>` block (lines 263–322) with `<LazyMotion features={domMax}>`

If the full `<m.main>` block cannot be cleanly extracted, another approach: scope the nested `<LazyMotion>` to just the `AnimatePresence` + `m.div` inner card (lines 297–322), since the drag handler fires `onDragEnd` which lives on `m.main` but the actual drag gesture recognition can be scoped to the card area.

### 3. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Manually verify: load a quiz question, drag/swipe to next question works. Load dashboard — no drag features needed, so no regressions.

## Stop conditions

- `pnpm run typecheck` fails — revert and check motion/react API surface for `domAnimation`
- Drag/swipe interaction on quiz cards breaks

## Estimated time

30 min
