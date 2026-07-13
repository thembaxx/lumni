# 195 — Add entrance animation to leaderboard rank changes

- **Status**: TODO
- **Commit**: 4fcd46a4
- **Severity**: LOW
- **Category**: Missed opportunity
- **Estimated scope**: 1 file, ~5 lines

## Problem

When leaderboard data refreshes, rank positions appear instantly with **no entrance animation**. Users cannot visually track how positions changed between refreshes. The rank list simply updates its children — no motion communicates the transition.

In `src/components/social/leaderboard-card.tsx`:

- Line 112: Each rank item uses `flex items-center gap-3 rounded-xl p-2.5 transition-colors` — only `transition-colors` is animated. No transform/opacity entrance.

AUDIT.md §8: "State changes that teleport (content swaps, layout jumps) where a brief transition would prevent a jarring change."

## Target

Add a staggered entrance animation to leaderboard rank items using Motion's `initial`/`animate` pattern. Each item fades in with a subtle `y` offset, staggered by index. Use `layout` prop if items can reorder (so they smoothly animate to their new position).

## Repo conventions to follow

- Staggered entrances use `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}` with a delay based on index — used in `stat-card.tsx:52`, `learn-page-client.tsx:96-98`.
- `springPresets.fast` for entrance timing.
- `layout` prop for position interpolation on reorder.

## Steps

1. Open `src/components/social/leaderboard-card.tsx`.
2. Convert the rank item container from a `<div>` to a `<m.div>`.
3. Add entrance animation:
   ```tsx
   <m.div
     initial={{ opacity: 0, y: 12 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ ...springPresets.fast, delay: index * 0.05 }}
     layout
   >
     {/* rank item content */}
   </m.div>
   ```
4. The `layout` prop will smoothly interpolate position changes if rank items reorder based on new data.

## Boundaries

- Do NOT change the leaderboard data fetching, sorting, or display logic.
- Do NOT change the rank styling (avatar, name, score, medal).
- Do NOT add new dependencies.

## Verification

- **Mechanical**: `pnpm run typecheck` — 0 errors.
- **Feel check**: Open the leaderboard. Items should stagger in from bottom (fade+slide up). If the leaderboard refreshes and ranks change, items should smoothly slide to their new position instead of teleporting.
- **Done when**: Each leaderboard rank item fades in with a staggered entrance, and items use `layout` for position interpolation on reorder.
