# Plan 061: Perceived Responsiveness Phase 3 + Redis RateLimiter Deployment

> **Executor instructions**: Design/spike plan. Two independent workstreams:
> Part A implements the Phase 3 responsiveness spec (optimistic bookmarks,
> animation trim, tap feedback, CLS reduction). Part B wires the existing
> RedisStore into production rate-limiting. Each part has its own verify
> steps. Run them in either order.
>
> **Drift check (run first)**: `git diff --stat 169d3704..HEAD -- src/store/bookmarks.ts src/components/ src/app/ src/lib/rate-limiter/`
> If any in-scope file changed significantly, compare excerpts before
> proceeding.

## Status

- **Priority**: P3
- **Effort**: S (2 days)
- **Risk**: LOW — all changes are additive or cosmetic
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `169d3704`, 2026-06-28

## Why this matters

Two independent polish items that cap existing programs:

**Part A — Perceived Responsiveness**: The 3-phase performance program (Cold Start → Navigation Feel → Perceived Responsiveness) was designed to eliminate perceived lag entirely. Phases 1 and 2 are live; Phase 3 closes the loop with optimistic UI, animation discipline, and layout stability.

**Part B — Redis RateLimiter**: The `RedisStore` class at `src/lib/rate-limiter/redis-store.ts` has existed since Session 28 but production still uses `MapStore` (in-memory, lost on server restart). Wiring Redis is a config change + env vars — minimal effort for production hardening.

## Current state

### Part A

- `docs/superpowers/specs/2026-06-23-perceived-responsiveness-design.md` — full spec exists, Phase 3 scope covers:
  - Optimistic bookmark toggle (immediate UI, no server wait, rollback on failure)
  - Animation trim (replace decorative `motion.div` with CSS, audit `AnimatePresence`, add reduced-motion)
  - Standardized tap feedback (`active:scale-[0.96]`) on all interactive elements
  - Layout stability (explicit `min-h` and `aspect-ratio` for dynamic content)
- Recent commits show Phase 1 (cold start) and Phase 2 (navigation feel) work landed. Phase 3 likely not yet implemented.

### Part B

- `src/lib/rate-limiter/redis-store.ts` — 40-line `RedisStore` class implementing `RateLimitStore` with Upstash Redis. Uses `@upstash/redis`.
- Rate limiter is used for auth (3 sign-in/5min), AI budget (2000 calls/day global), and API route protection.
- Current production store is `MapStore` (in-memory). Switching to `RedisStore` requires configuration in the `RateLimiter` constructor call sites.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `pnpm install`                   | exit 0              |
| Typecheck | `pnpm run typecheck`             | exit 0, no errors   |
| Tests     | `pnpm run test`                  | all pass            |
| Lint      | `pnpm exec oxlint`               | exit 0              |
| Build     | `pnpm run build`                 | exit 0              |

## Scope

**Part A in scope**:
- `src/store/bookmarks.ts` — optimistic write with rollback
- `src/components/shared/animation.ts` or individual component files — remove decorative `motion.div` wrappers, audit `AnimatePresence`
- Components missing `active:scale-[0.96]` — add standardized tap feedback
- Components missing `min-h`/`aspect-ratio` on dynamic content — add layout stability
- Add `prefers-reduced-motion` media query to animated components missing it

**Part B in scope**:
- `src/lib/rate-limiter/` — add `createRateLimitStore()` factory that reads env to decide `MapStore` vs `RedisStore`
- `.env.example` — document `REDIS_URL` and `REDIS_TOKEN`
- Rate limiter call sites — use the factory instead of `new MapStore()` directly

**Out of scope**:
- Animation overuse audit (Phase 3 spec mentions it but it's subjective — skip unless egregious)
- New animations or decorative motion
- Rate limiter performance benchmarking
- Redis cluster or sentinel config (single-node Upstash Redis only)

## Steps

### Part A

#### Step A1: Optimistic bookmark toggle

In `src/store/bookmarks.ts`, change the bookmark toggle to:

1. Update the Zustand store immediately (toggle the `isBookmarked` flag)
2. Enqueue the API call (`POST /api/bookmarks/toggle`)
3. If the API call fails, roll back the store change

```typescript
const toggleBookmark = async (questionId: string) => {
  const wasBookmarked = get().bookmarkedIds.has(questionId);

  // Optimistic update
  set((state) => ({
    bookmarkedIds: wasBookmarked
      ? new Set([...state.bookmarkedIds].filter(id => id !== questionId))
      : new Set([...state.bookmarkedIds, questionId]),
  }));

  try {
    await apiFetch("/api/bookmarks/toggle", { method: "POST", body: { questionId } });
  } catch {
    // Rollback
    set((state) => ({
      bookmarkedIds: wasBookmarked
        ? new Set([...state.bookmarkedIds, questionId])
        : new Set([...state.bookmarkedIds].filter(id => id !== questionId)),
    }));
  }
};
```

**Verify**: Click bookmark → UI updates instantly. Disconnect network, click again → UI rolls back to previous state.

#### Step A2: Animation trim

Find and replace decorative `motion.div` wrappers in:

1. Dashboard card entrance animations — replace with plain `<div>` + CSS `transition-opacity`
2. List item exit animations (search results, flashcards) — remove `AnimatePresence` wrapper where exit is purely cosmetic
3. Any `motion.div` that wraps a static surface (card, container) with only `initial/animate` opacity — replace with CSS

Check for each instance whether the animation adds user-facing utility (e.g., a staggered entrance for a list of loaded items) or is purely decorative. Keep the former, replace the latter.

**Verify**: After each replacement, the component renders identically but without the `motion` import.

#### Step A3: Tap feedback sweep

Grep for all clickable elements in `src/components/` and `src/app/` that don't have `active:scale-[0.96]`:

```bash
rg "onClick" src/components/ --include "*.tsx" -l | xargs grep -L "active:scale"
```

For each missing element, add `active:scale-[0.96] transition-transform` to the className. Follow the pattern in `src/components/ui/button.tsx`:

```tsx
className="... active:scale-[0.96] transition-transform ..."
```

**Verify**: `rg "active:scale" src/components/ | wc -l` shows increased count over baseline.

#### Step A4: Layout stability

Find dynamically-loaded content areas missing explicit dimensions:

1. Diagram containers — add `min-h-[200px]` (or the `--space-*` token equivalent)
2. Image containers — add `aspect-ratio` from the image's natural aspect ratio
3. Skeleton loaders — verify they have explicit height (they should, per design system)

**Verify**: Lighthouse CLS audit shows no layout shift on content load (manual check).

#### Step A5: Reduced-motion audit

Check components with `motion` or `AnimatePresence` for `prefers-reduced-motion` support:

```tsx
import { useReducedMotion } from "motion/react";

const shouldReduceMotion = useReducedMotion();
const animationProps = shouldReduceMotion
  ? { initial: {}, animate: {}, exit: {} }
  : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
```

Add to any component where animation could cause discomfort (page transitions, entrance animations, spring-based motions). The `motion` library (formerly `framer-motion`) exposes `useReducedMotion` hook.

**Verify**: Enable OS-level "Reduce motion" → animations are disabled or significantly softened.

### Part B

#### Step B1: Create store factory

In `src/lib/rate-limiter/core.ts` (or a new `factory.ts`), add:

```typescript
import { MapStore } from "./core";
import { RedisStore } from "./redis-store";

export function createRateLimitStore(): RateLimitStore {
  if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
    return new RedisStore();
  }
  return new MapStore();
}
```

**Verify**: `pnpm run typecheck` → exit 0

#### Step B2: Update rate limiter call sites

Find all places that instantiate `new MapStore()`:

```bash
rg "new MapStore" src/ --include "*.ts"
```

Replace each with `createRateLimitStore()`.

**Verify**: `pnpm run typecheck` → exit 0. `rg "new MapStore" src/` returns no matches.

#### Step B3: Update .env.example

Add to `.env.example`:

```bash
# Upstash Redis (optional — for production multi-instance rate limiting)
REDIS_URL=""
REDIS_TOKEN=""
```

**Verify**: `.env.example` contains both vars with empty defaults.

### Step 6: Write tests

**Part A tests**:
- `src/store/__tests__/bookmarks.test.ts` — optimistic toggle succeeds, optimistic toggle fails and rolls back

**Part B tests**:
- `src/lib/rate-limiter/__tests__/factory.test.ts` — `createRateLimitStore()` returns `RedisStore` when env vars set, returns `MapStore` when not set

**Verify**: `pnpm run test -- bookmarks\|rate-limiter` → all pass

## Test plan

- `src/store/__tests__/bookmarks.test.ts` — 2 tests: optimistic toggle success, optimistic toggle failure with rollback
- `src/lib/rate-limiter/__tests__/factory.test.ts` — 2 tests: factory creates correct store type based on env

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` passes; new tests for bookmarks and rate-limiter factory pass
- [ ] Bookmark toggle is instant (optimistic update with rollback on failure)
- [ ] Decorative `motion.div` wrappers replaced with CSS where possible
- [ ] Missing `active:scale-[0.96]` added to interactive elements
- [ ] Dynamic content has explicit `min-h` or `aspect-ratio` dimensions
- [ ] `prefers-reduced-motion` respected in animated components
- [ ] `createRateLimitStore()` factory returns RedisStore when env vars present
- [ ] `.env.example` documents `REDIS_URL` and `REDIS_TOKEN`
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `src/store/bookmarks.ts` doesn't exist or uses a different pattern (e.g., TanStack Query instead of Zustand) — adapt the optimistic update pattern accordingly
- If `useReducedMotion` is not available in the installed `motion` version — check `package.json` `"motion"` version and report
- If `MapStore` is not exported from `src/lib/rate-limiter/core.ts` — check the export exists

## Maintenance notes

- The optimistic bookmark pattern in this plan is the first optimistic UI in the codebase. If it's successful, apply the same pattern to other toggle-like actions (star rating, follow study group, etc.).
- The `createRateLimitStore()` factory pattern is the standard approach for multi-environment store selection. If Redis goes down, the factory should fall back to `MapStore` instead of crashing — consider adding a try/catch in `RedisStore` constructor.
- Redis rate limiting is only valuable in multi-instance deployments (Vercel serverless with multiple lambdas). Single-instance deployments can safely stay on `MapStore`.
