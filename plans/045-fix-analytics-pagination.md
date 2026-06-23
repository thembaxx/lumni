# Plan 045: Fix AnalyticsService 10K sequential Appwrite requests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/analytics/analytics-service.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — changing the analytics data source may produce slightly different aggregation results; confirm with existing UI output
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`AnalyticsService.fetchAllSessions()` loops with `PAGE_LIMIT=100` and `MAX_SESSIONS=10000`, making up to 100 sequential `listDocuments` API calls to Appwrite per invocation. This is called by `computeComparative()` which loads ALL study sessions into memory for JS-based aggregation. Every request to `POST /api/analytics/comparative` triggers 100 serialized network requests and loads up to 10K records client-side.

## Current state

`src/lib/analytics/analytics-service.ts:34-49`:

```typescript
async fetchAllSessions(): Promise<StudySession[]> {
    const allSessions: StudySession[] = [];
    let offset = 0;

    while (allSessions.length < MAX_SESSIONS) {
      const page = await listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
        Query.limit(PAGE_LIMIT),
        Query.offset(offset),
      ]);
      allSessions.push(...page);
      if (page.length < PAGE_LIMIT) break;
      offset += PAGE_LIMIT;
    }

    return allSessions;
  }
```

Then `computeComparative()` (line 99) receives this array and JS-aggregates averages and percentiles.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/analytics/analytics-service.ts`
- `src/lib/analytics/__tests__/` (create or update)

**Out of scope**:

- `src/app/api/analytics/` routes — they just call the service
- The `ComputeAggregationsService` or any other analytics infrastructure
- Appwrite query APIs (you can't add server-side aggregation to Appwrite in this plan)

## Steps

### Step 1: Add Appwrite aggregation alternatives

Appwrite's `listDocuments` supports `Query.sum()`, `Query.avg()`, etc. Replace the full-table scan with server-side aggregation queries:

```typescript
async fetchAllSessions(): Promise<StudySession[]> {
    // If comparative analytics only needs averages, not individual sessions,
    // use Appwrite aggregation instead
    // ... but Appwrite's free tier may not support all aggregation types
    // Fallback: paginate with concurrency — batch 4 requests at a time
    return this.fetchAllSessionsBatched();
}

private async fetchAllSessionsBatched(): Promise<StudySession[]> {
    // Fetch first page to get a sense of total
    const firstPage = await listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
      Query.limit(PAGE_LIMIT),
      Query.offset(0),
    ]);
    if (firstPage.length < PAGE_LIMIT) return firstPage;

    // Estimate total pages and fetch in parallel batches
    const totalEstimate = Math.min(MAX_SESSIONS, firstPage.length * 5); // rough estimate
    const pageCount = Math.ceil(totalEstimate / PAGE_LIMIT);
    const BATCH_SIZE = 4;

    const allPages = [firstPage];
    for (let batchStart = 1; batchStart < pageCount; batchStart += BATCH_SIZE) {
      const batch = [];
      for (let i = batchStart; i < batchStart + BATCH_SIZE && i < pageCount; i++) {
        batch.push(
          listDocuments<StudySession>(COLLECTIONS.STUDY_SESSIONS, [
            Query.limit(PAGE_LIMIT),
            Query.offset(i * PAGE_LIMIT),
          ]),
        );
      }
      const pages = await Promise.all(batch);
      for (const page of pages) {
        allPages.push(page);
        if (page.length < PAGE_LIMIT) break;
      }
    }

    return allPages.flat();
}
```

This reduces the 100 sequential requests to ~25 sequential batches (each batch has 4 parallel requests).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Add a cached aggregate

In `computeComparative()`, add an in-memory cache (module-level) keyed by date so the endpoint doesn't re-fetch all sessions on every request:

```typescript
let _cachedComparative: { data: ComparativeResult; expiresAt: number } | null = null;

async computeComparative(userId: string): Promise<ComparativeResult> {
  if (_cachedComparative && _cachedComparative.expiresAt > Date.now()) {
    return _cachedComparative.data;
  }
  // ... existing logic
  _cachedComparative = { data: result, expiresAt: Date.now() + 5 * 60 * 1000 };
  return result;
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Update tests

Check for existing tests at `src/lib/analytics/__tests__/` and update any that assert on `fetchAllSessions` behavior:

```bash
pnpm exec grep -rn "fetchAllSessions\|computeComparative" src/ --include="*.test.*"
```

**Verify**: `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `fetchAllSessions()` does not make more than ~25 sequential requests (batches 4 pages in parallel)
- [ ] `computeComparative()` has a short TTL cache (5 min) to avoid re-fetching on every request
- [ ] `plans/README.md` status row updated

## STOP conditions

- Code at `analytics-service.ts:34-49` doesn't match excerpts
- Appwrite API doesn't support parallel `listDocuments` calls for the same collection (it does — they're independent queries)
- An existing test asserts exact number of sequential API calls
