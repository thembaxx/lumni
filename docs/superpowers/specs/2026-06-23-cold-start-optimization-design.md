# Cold Start Optimization — Phase 1

**Date**: 2026-06-23
**Goal**: Reduce initial JS bundle size and Time-to-Interactive toward native-app equivalence.

## Scope

Phase 1 of a 3-phase performance program (Cold Start → Navigation Feel → Perceived Responsiveness). This phase focuses on **first-load performance** via config tuning, dead code removal, and streaming SSR.

### In Scope

- Tune Sentry client config (tracesSampleRate, enableLogs)
- Disable production browser source maps
- Remove 645KB dead Lottie animation asset
- Re-add loading.tsx for streaming SSR on key routes
- Verify with bundle analyzer, tests, and lint

### Out of Scope

- Service worker rewrite (Phase 2)
- Route prefetching / preloading (Phase 2)
- ISR on static content pages (Phase 2)
- Animation overuse audit (Phase 3)
- Optimistic UI wiring (Phase 3)

## Background

Initial analysis flagged 5 heavy libraries (three.js, konva, recharts, @xyflow/react, react-pdf) as code-split candidates. Investigation confirmed all 5 are **already behind `next/dynamic` or `await import()`** and do not appear in the main bundle. The real cold-start levers are config-level knobs and dead assets.

## Changes

### 1. Tune Sentry client config

File: `src/instrumentation-client.ts`

| Setting            | Before | After                                   | Rationale                                                              |
| ------------------ | ------ | --------------------------------------- | ---------------------------------------------------------------------- |
| `tracesSampleRate` | `1`    | `0.1`                                   | 100% tracing adds overhead. 10% captures enough to detect regressions. |
| `enableLogs`       | `true` | `process.env.NODE_ENV !== "production"` | Debug logs in production consume console bandwidth.                    |

### 2. Disable production browser source maps

File: `next.config.ts`

```ts
// Before
productionBrowserSourceMaps: true,

// After
productionBrowserSourceMaps: false,
```

Source maps in production expose full source code to end users and add significant download overhead. Disable for production; debug via Sentry stack traces and source map uploads.

### 3. Remove dead asset

File: `src/assets/animations/page-404.json` (645KB)

This Lottie animation JSON is not imported or referenced by any code in the codebase. Delete it.

### 4. Re-add loading.tsx for streaming SSR

Add loading.tsx files with `<PageSkeleton />` for these routes, previously removed in Session 31:

- `src/app/[locale]/dashboard/loading.tsx`
- `src/app/[locale]/quiz/loading.tsx`
- `src/app/[locale]/flashcards/loading.tsx`
- `src/app/[locale]/exam/[id]/loading.tsx` (note: route was `exam/`, now `exam/[id]/`)
- `src/app/[locale]/settings/loading.tsx`
- `src/app/[locale]/search/loading.tsx`
- `src/app/[locale]/bookmarks/loading.tsx`
- `src/app/[locale]/admin/loading.tsx`
- `src/app/[locale]/parent/loading.tsx`
- `src/app/[locale]/teacher/loading.tsx`
- `src/app/[locale]/loading.tsx` (root locale)

Each exports a default `<PageSkeleton />` wrapper. This enables Next.js streaming SSR — the shell renders immediately while the server streams page content.

### 5. (Optional) Run bundle analyzer

```bash
ANALYZE=true pnpm run build
```

Inspect `.next/analyze/client.html` for any remaining anomalous chunks. This is diagnostic only; no mandatory changes.

## Verification

1. `pnpm run test` — 0 failures
2. `pnpm exec oxlint` — 0 errors on changed files
3. `pnpm run build` — succeeds, no new warnings
4. Manual smoke: dashboard loads, quiz loads, settings page renders
5. Optional: `ANALYZE=true pnpm run build` and confirm initial JS chunk is smaller

## File Changes Summary

| File                                      | Action                                         |
| ----------------------------------------- | ---------------------------------------------- |
| `src/instrumentation-client.ts`           | Edit: tracesSampleRate 1→0.1, enableLogs gated |
| `next.config.ts`                          | Edit: productionBrowserSourceMaps false        |
| `src/assets/animations/page-404.json`     | Delete (645KB, unreferenced)                   |
| `src/app/[locale]/loading.tsx`            | Create                                         |
| `src/app/[locale]/dashboard/loading.tsx`  | Create                                         |
| `src/app/[locale]/quiz/loading.tsx`       | Create                                         |
| `src/app/[locale]/flashcards/loading.tsx` | Create                                         |
| `src/app/[locale]/exam/[id]/loading.tsx`  | Create                                         |
| `src/app/[locale]/settings/loading.tsx`   | Create                                         |
| `src/app/[locale]/search/loading.tsx`     | Create                                         |
| `src/app/[locale]/bookmarks/loading.tsx`  | Create                                         |
| `src/app/[locale]/admin/loading.tsx`      | Create                                         |
| `src/app/[locale]/parent/loading.tsx`     | Create                                         |
| `src/app/[locale]/teacher/loading.tsx`    | Create                                         |

## Risks

| Risk                                                        | Mitigation                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tracesSampleRate` 0.1 misses production errors             | Sentry still captures 100% of errors. Only trace sampling is reduced.                                                                                         |
| `productionBrowserSourceMaps: false` makes debugging harder | Source maps still available via Sentry. Dev environments unchanged.                                                                                           |
| loading.tsx skeleton flash on fast navigations              | Skeleton is `<PageSkeleton />`, 1-line component; flash is imperceptible on subsequent SPA navigations because loading.tsx only activates on full page loads. |
| page-404.json was actually used somehow                     | Grep confirmed zero imports. Safe to delete.                                                                                                                  |

## Success Criteria

- [ ] Bundle analyzer (optional) shows measurable reduction
- [ ] All tests pass
- [ ] Oxlint clean on changed files
- [ ] Manual smoke: no blank pages on dashboard, quiz, settings, admin
