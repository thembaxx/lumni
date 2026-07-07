# Plan 138: Enforce personalized-feed feature flag

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/components/dashboard/today-tab.tsx src/lib/shared/flags/registry.ts src/hooks/use-feature-flag.ts`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`personalized-feed` is registered in the flag registry at 50% rollout, but `today-tab.tsx` unconditionally renders `PersonalizedFeed` without checking the flag. The experiment infrastructure exists but produces zero signal — every user gets the same feed regardless of their bucket assignment.

## Current state

- `src/lib/shared/flags/registry.ts:15-20` — `personalized-feed` has `defaultEnabled: true` and `rolloutPercentage: 50`
- `src/components/dashboard/today-tab.tsx:58-84` — `FeedSection` always renders; no `useFeatureFlag` check
- `bolt-quiz.tsx:47` shows the correct pattern: `const { enabled } = useFeatureFlag("daily-bolt-v2", userId)`

## Steps

### Step 1: Wire the flag into FeedSection

In `today-tab.tsx`, import `useFeatureFlag` and wrap the feed:

```tsx
function FeedSection({ userId }: { userId: string }) {
  const { enabled: showPersonalizedFeed } = useFeatureFlag("personalized-feed", userId);

  const { data: recommendations } = useQuery({
    queryKey: ["personalized-feed", userId],
    queryFn: async ({ queryKey }) => getFeed(queryKey[1] as string),
    staleTime: 60_000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    enabled: showPersonalizedFeed,
  });

  // ...rest unchanged
}
```

By adding `enabled: showPersonalizedFeed` to the query, when the flag is off the query won't fire and no feed data is fetched.

### Step 2: Show NextBestActionCard fallback when flag is off

When `showPersonalizedFeed` is false, render the fallback content (currently shown when recommendations are empty):

```tsx
if (!showPersonalizedFeed || !recommendations || recommendations.length === 0) {
  return (
    <StaggeredSection>
      <AppErrorBoundary>
        <NextBestActionCard />
      </AppErrorBoundary>
    </StaggeredSection>
  );
}
```

**Verify**: `pnpm run typecheck` → 0 errors

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `today-tab.tsx` imports and uses `useFeatureFlag("personalized-feed", userId)`
- [ ] When flag is off, `PersonalizedFeed` is not rendered and no API call fires
- [ ] `NextBestActionCard` shown as fallback when flag is off
