# Perceived Responsiveness Optimization — Phase 3

**Date**: 2026-06-23
**Goal**: Eliminate perceived lag through optimistic UI, animation discipline, and interaction feedback.

## Scope

Phase 3 of a 3-phase performance program.

### In Scope

- Optimistic bookmark toggle (immediate UI update, no server wait)
- Animation trim: replace decorative `motion.div` with CSS, audit AnimatePresence, add reduced-motion where missing
- Standardized tap feedback (`active:scale-[0.96]`) on all interactive elements
- Layout stability for dynamic content (CLS reduction)

### Out of Scope

- Service worker changes
- Route prefetching
- ISR
- Bundle size

## Changes

### 1. Optimistic bookmark toggle

File: `src/store/bookmarks.ts` (Zustand)

Add optimistic write: when user toggles a bookmark, update the Zustand store immediately, enqueue the API call, and roll back on failure.

### 2. Animation audit

Replace decorative `motion.div` with plain `<div>` + CSS transitions in:

- Surface-level cards where entrance animation adds no UX value
- List items with `AnimatePresence` where exit animation is purely cosmetic

Add `prefers-reduced-motion` to components missing it.

### 3. Tap feedback

Audit interactive elements (buttons, cards, list items) and add `active:scale-[0.96]` + `transition-transform` where missing.

### 4. Layout stability

Add explicit `min-h` and `aspect-ratio` to dynamically-loaded content areas (diagrams, images, skeleton loaders) to prevent layout shift.

## Verification

1. `pnpm run test` — 0 failures
2. `pnpm exec oxlint` — 0 errors
3. Manual: bookmark feels instant, buttons have press animation, no layout shift on content load
