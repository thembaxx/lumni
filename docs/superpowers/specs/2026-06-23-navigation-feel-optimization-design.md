# Navigation Feel Optimization — Phase 2

**Date**: 2026-06-23
**Goal**: Eliminate perceived navigation latency and enable instant repeat-visit loads through service worker enhancements, route prefetching, and ISR.

## Scope

Phase 2 of a 3-phase performance program (Cold Start → Navigation Feel → Perceived Responsiveness). Focuses on **subsequent-navigation performance** and **offline app shell**.

### In Scope

- SW navigation preload (shaves ~500ms off first navigation)
- Route shell precaching (instant repeat visits)
- Background sync for offline mutations
- Route prefetching on sidebar mount and idle time
- ISR for static content pages

### Out of Scope

- Animation overuse audit (Phase 3)
- Optimistic UI wiring (Phase 3)

## Changes

### 1. SW: Navigation Preload

Add `navigationPreload.enable()` in the SW activate handler. Use `event.preloadResponse` in `networkFirstHtml` to race preload vs network:

```js
// activate
event.waitUntil(
  Promise.all([
    self.registration.navigationPreload.enable(),
    // existing cleanup...
  ]),
);

// networkFirstHtml
async function networkFirstHtml(event) {
  const preloadResponse = event.preloadResponse;
  // Race preload vs network; cache the winner; fall back to cache
}
```

### 2. SW: Route Shell Precaching

Add to `STATIC_ASSETS`:

```
/dashboard, /quiz, /flashcards, /settings, /solve, /search
```

These are the < 5KB HTML shells that enable instant repeat-visit rendering while the full page hydrates.

### 3. SW: Background Sync

Register a `sync` event handler. On `sync` events, read from a Dexie-backed `offlineMutations` queue table and replay each mutation via `fetch()`. Wired from the client via `navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-mutations'))`.

### 4. Route Prefetching

In `sidebar-nav.tsx`, on mount:

```ts
router.prefetch("/[locale]/dashboard");
router.prefetch("/[locale]/quiz");
router.prefetch("/[locale]/flashcards");
router.prefetch("/[locale]/solve");
```

In `dashboard-client.tsx`, on idle (`requestIdleCallback`):

```ts
queryClient.prefetchQuery for quiz engine (next-topics, competency data)
```

### 5. ISR for Static Content

Add `revalidate = 3600` (1 hour) to:

- `src/app/[locale]/study/[subjectId]/[topicId]/[subtopicId]/page.tsx` (lesson content)
- `src/app/[locale]/past-papers/page.tsx` (static paper listings)

## Verification

1. `pnpm run test` — 0 failures
2. `pnpm exec oxlint` — 0 errors on changed files
3. Manual: navigate between dashboard → quiz → flashcards — verify no blank loading states
4. Manual: go offline, visit dashboard — should render cached shell
5. ISR: check that study pages return immediately on repeat visit

## File Changes

| File                                                                 | Action                                                      |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `public/sw.js`                                                       | Edit: navigation preload, shell precaching, background sync |
| `src/components/navigation/sidebar-nav.tsx`                          | Edit: add route prefetch on mount                           |
| `src/components/dashboard/dashboard-client.tsx`                      | Edit: add idle-time prefetch for quiz data                  |
| `src/app/[locale]/study/[subjectId]/[topicId]/[subtopicId]/page.tsx` | Edit: add revalidate                                        |
| `src/app/[locale]/past-papers/page.tsx`                              | Edit: add revalidate                                        |

## Risks

| Risk                                                  | Mitigation                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| Navigation preload doesn't work in all browsers       | Feature-detect `self.registration.navigationPreload`        |
| SW shell precache causes stale content                | Cache-bust via version string, no user data in shell        |
| Background sync increases offline mutation complexity | Keep simple: Dexie queue, replay on sync, delete on success |
| ISR serves stale content                              | Set conservative TTL (1h), content changes infrequently     |
