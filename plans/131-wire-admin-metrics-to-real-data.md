# Plan 131: Wire admin metrics routes to real Appwrite data

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/admin/metrics/ src/lib/sync/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: sync pipeline must push analyticsEvents to Appwrite (verify this is wired)
- **Category**: direction
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

All four admin metrics routes return fabricated random numbers using `Math.sin()` and `Math.random()`. DAU, MAU, retention cohorts, and subject usage are entirely fictional. Any operator relying on this data for decisions would be misled.

## Current state

- `src/app/api/admin/metrics/dau-mau/route.ts:29-43` — `Math.sin(i*0.5) + Math.random()*2` for DAU/MAU
- `src/app/api/admin/metrics/retention/route.ts:17` — `Math.pow(0.58 + Math.random()*0.06, week)`
- `src/app/api/admin/metrics/live/route.ts:11` — `2 + Math.round(Math.random()*13)`
- `src/app/api/admin/metrics/subjects/route.ts:34-36` — hardcoded counts with random noise

The `analyticsEvents` Dexie table exists (v27). The design spec at `docs/superpowers/2026-07-05-admin-metrics-data-model.md` documents the query patterns.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |

## Steps

### Step 1: Verify analyticsEvents sync is wired

Check if `analyticsEvents` is in the sync push tables list at `src/lib/sync/service.ts`. If not, add it. The sync layer must push client-side events to Appwrite for server-side querying.

### Step 2: Rewrite dau-mau route

Replace the `Math.sin` loop with an Appwrite query against the `analytics` collection:

```ts
// Query distinct users per day for the last 30 days
// Query distinct users per month for the last 12 months
// Use the DailyCallTracker pattern from src/lib/ai/daily-call-tracker.ts as reference
```

### Step 3: Rewrite retention route

Query `analytics` collection for cohort-based retention. Group users by registration week, check active status in subsequent weeks.

### Step 4: Rewrite live route

Query `analytics` collection for events in the last 5 minutes, count distinct user IDs.

### Step 5: Rewrite subjects route

Query `analytics` collection for quiz/flashcard events grouped by subject.

### Step 6: Verify

**Verify**: `grep -rn "Math.sin\|Math.random" src/app/api/admin/metrics/` → 0 matches
**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] All four metrics routes query real Appwrite data
- [ ] No `Math.sin` or `Math.random` in metrics routes
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `analyticsEvents` sync to Appwrite is not wired (need to wire first)
- The Appwrite `analytics` collection doesn't have the required indexes
