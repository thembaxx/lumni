# Plan 034: Polish/hardening — a11y, error handling, performance

## Status: In Progress

## Problem

Across 30 plans and many features, some polish items have accumulated: keyboard navigation gaps, unhandled promise rejections, animation performance, loading states.

## Scope

- Accessibility fixes for new components (story exercises, word of day, live session monitor, teacher dashboard)
- Error boundary coverage for new routes
- Loading states for dictionary search, story content, Gutenberg imports
- Performance: lazy loading for large story JSON files, memo-ization for new components

## Steps

1. Check all components created in plans 018-030 for:
   - Keyboard navigation (focus rings, tab order)
   - aria-labels on icon-only buttons
   - Role attributes on interactive elements
   - Loading states during async operations
2. Add error boundaries around new async components
3. Ensure story JSON imports use React.lazy or dynamic import patterns
4. Verify: `npx tsc --noEmit`, `npx biome check`, `bun run test`

## Done criteria

- All icon buttons in new components have aria-labels
- New async routes/components have error boundaries
- Story imports use dynamic import pattern
- No unhandled promise rejections in new code
