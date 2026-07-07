# Plan 155: Extract dashboard god hook — split useDashboard into domain-specific hooks

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/components/dashboard/ src/hooks/use-dashboard.ts`

## Status

- **Priority**: P2 | **Effort**: L | **Risk**: LOW | **Depends on**: 156 (if localStorage refactor is happening concurrently) | **Category**: arch
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The dashboard client component or its hook (`useDashboard` or embedded in `dashboard-client.tsx`) is a god hook — it orchestrates 6+ data sources (competencies, recent quizzes, streak, daily challenge, next-best-action, study plan), manages local state for each, and handles loading/error states for all of them. This makes it hard to test, hard to modify individual sections, and means any dashboard metric change requires understanding the entire hook.

## Current state

`src/components/dashboard/dashboard-client.tsx` is a very large component (~500+ lines). It likely contains inline data fetching, state management, and UI rendering for all dashboard sections. The hook logic should be extracted into domain-specific hooks.

## Steps

### Step 1: Identify extractable hook boundaries

Read the current dashboard-client.tsx and identify the following potential domain boundaries:

- UseCompetencyData — competencies, weakest topic, topic scores
- UseRecentQuizzes — recent quiz attempts, average score
- UseStreak — streak count, freeze status
- UseDailyChallenge — daily challenge state, progress
- UseNextBestAction — next-best-action card data

### Step 2: Extract each domain hook

For each domain, create a hook file at `src/hooks/dashboard/use-{domain}.ts` that:

1. Owns its own query (TanStack Query or Dexie)
2. Returns `{ data, isLoading, error }`
3. Is independently testable

### Step 3: Compose in dashboard-client.tsx

Replace inline fetching with hook composition:

```typescript
const { data: competencies } = useCompetencyData(subject);
const { data: recentQuizzes } = useRecentQuizzes();
const { data: streak } = useStreak();
// ...
```

### Step 4: Each section gets its own loading/error state

Previously, a single `isLoading` state covered the entire dashboard. Now each section renders its own skeleton based on its own loading state. This means the dashboard is interactive sooner — sections render as they load instead of waiting for all 6+ queries.

### Step 5: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. Manually verify dashboard renders each section independently.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] `dashboard-client.tsx` reduced (aiming for < 300 lines or less, not the primary metric)
- [ ] Each domain hook independently testable
- [ ] Dashboard sections render progressively (not all-or-nothing loading)

## STOP conditions

If the dashboard has already been refactored since `649afc3b`, skip this plan. Read the current dashboard-client.tsx first to verify it still needs extraction.
