# Plan 010: Fix analytics service parallel retry

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/services/analytics-service.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The `getComparativeAnalytics` method uses `Promise.allSettled([1, 2].map(...))` to "retry" — but both attempts fire simultaneously. The `setTimeout` delay inside the second attempt is a dead store because the promise already started. This means a transient failure triggers 2 parallel API calls instead of 1 + 1 retry, doubling load during failures.

## Current state

**`src/lib/services/analytics-service.ts:31-49`**:

```typescript
const attempts = await Promise.allSettled(
  [1, 2].map(async (attempt) => {
    try {
      const res = await fetch(`/api/analytics/comparative?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      logError("AnalyticsService", error);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
      throw error;
    }
  }),
);
```

`Promise.allSettled` resolves all promises concurrently. The `setTimeout` on `attempt 2` is meaningless because the promise was already created and started executing.

## Commands you will need

| Purpose   | Command                                                 | Expected on success |
| --------- | ------------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                      | exit 0, no errors   |
| Lint      | `npx biome check src/lib/services/analytics-service.ts` | 0 errors            |
| Tests     | `bun run test`                                          | 1326+ pass, 0 fail  |

## Scope

**In scope**:

- `src/lib/services/analytics-service.ts` (lines 30-50)

**Out of scope**:

- Other analytics methods
- The comparative analytics API route

## Git workflow

- Branch: `advisor/010-fix-analytics-retry"
- Commit: `fix: sequential retry in analytics service`

## Steps

### Step 1: Replace parallel with sequential retry

Replace the `Promise.allSettled` pattern with a simple sequential retry:

```typescript
async getComparativeAnalytics(userId: string): Promise<ServiceResult<{
  userPercentile: number;
  subjectRankings: Record<string, number>;
  globalAverage: number;
  userAverage: number;
}>> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(
        `/api/analytics/comparative?userId=${encodeURIComponent(userId)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return success(await res.json());
    } catch (error) {
      logError("AnalyticsService", error);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
  return success({
    userPercentile: 50,
    subjectRankings: {},
    globalAverage: 65,
    userAverage: 0,
  });
}
```

**Verify**: `npx biome check src/lib/services/analytics-service.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/services/analytics-service.ts
bun run test
```

## Test plan

- Add a test in `src/lib/services/__tests__/analytics-service.test.ts`:
  - Mock `fetch` to fail once then succeed → verify second attempt succeeds
  - Mock `fetch` to fail twice → verify fallback value returned

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/services/analytics-service.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "Promise.allSettled" src/lib/services/analytics-service.ts` returns no matches
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `getComparativeAnalytics` return type doesn't match the excerpt (it may have changed).
- The fallback value structure doesn't match.

## Maintenance notes

- The fallback value (percentile 50, average 65) is a reasonable default that doesn't alarm users.
- Consider adding exponential backoff if retry frequency increases.
