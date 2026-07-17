# Plan 221: Remove redundant refetchOnWindowFocus from personalized-feed query

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf

## Why this matters

The personalized-feed query in `dashboard-view.tsx` has both a 60-second `refetchInterval` AND `refetchOnWindowFocus: true`. When the user switches back to the dashboard tab after more than 60 seconds, both triggers fire simultaneously — the interval fires the next tick and the window focus trigger fires immediately — causing two concurrent network requests for the same data. This wastes server capacity and bandwidth on a low-priority feed that refreshes anyway within the minute.

## Current state

- `src/components/dashboard/dashboard-view.tsx:148-155`:

```tsx
const { data: recommendations } = useQuery({
  queryKey: ["personalized-feed", userId],
  queryFn: async ({ queryKey }) => getFeed(queryKey[1] as string),
  staleTime: 60_000,
  refetchInterval: 60000,
  refetchOnWindowFocus: true,
  enabled: showPersonalizedFeed,
});
```

`staleTime: 60_000` + `refetchInterval: 60000` already ensures fresh data every minute. `refetchOnWindowFocus: true` is redundant — by the time the user returns, either the data is still fresh (<60s), or the interval has already refetched it.

## Target state

- Remove `refetchOnWindowFocus: true` from the query config
- Data stays fresh via the 60s interval alone

## Scope

- `src/components/dashboard/dashboard-view.tsx` — single line deletion

## Steps

### 1. Remove the redundant option

In `src/components/dashboard/dashboard-view.tsx`, delete line 153: `refetchOnWindowFocus: true,`

### 2. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

## Stop conditions

- TypeScript error (extremely unlikely — the option is valid, just redundant)
- If the personalized feed stops updating on tab focus (it shouldn't — `refetchInterval` handles it)

## Estimated time

5 min
