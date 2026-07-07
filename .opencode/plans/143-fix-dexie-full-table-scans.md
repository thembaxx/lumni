# Plan 143: Fix 4 full-table Dexie scans — use indexed `where()` queries

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/digest/digest-service.ts src/lib/services/notification-service/alert-schedulers.ts src/lib/db/repositories/conflicts.ts src/components/settings/tabs/progress-export.tsx src/lib/vocabulary/service.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: perf
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Four locations load entire Dexie tables into memory then filter in-memory, instead of using Dexie's indexed `where()` queries. For users with years of history or thousands of records, each of these operations loads all records into JS heap. Fixing them reduces memory allocation from unbounded to O(window size).

## Current state

**Location 1 — digest-service.ts:34**:

```typescript
const attempts = (await this.deps.db.quizAttempts.toArray()).filter(
  (a) => a.completedAt >= sevenDaysAgo,
);
```

The `quizAttempts` table has a `completedAt` index. This should use `where("completedAt").above(sevenDaysAgo).toArray()`.

**Location 2 — alert-schedulers.ts:50**:

```typescript
const allAttempts = await getDeps().db.quizAttempts.toArray();
const attempts = allAttempts.filter((a) => a.completedAt >= sevenDaysAgo);
```

Same pattern, same fix.

**Location 3 — conflicts.ts:13** (`src/lib/db/repositories/conflicts.ts`):

```typescript
(await this.db.conflicts.toArray()).filter((c) => !c.resolvedAt);
```

The `conflicts` table needs a `resolvedAt` index. Check the Dexie schema at `src/lib/db/schema.ts` for the `conflicts` table index string.

**Location 4 — progress-export.tsx:55**:

```typescript
_deps.db.examSessions.toArray(); // No limit
```

The adjacent line `quizAttempts` correctly uses `.limit(100)`. Add `.limit(100)` here.

**Location 5 — vocabulary/service.ts:64-65** (if language filter is active):

```typescript
const all = await _deps.db.vocabularyList.where("userId").equals(userId).toArray();
return all.filter((e) => e.language !== filters.language);
```

Add a compound index and use it when language filter is provided.

## Commands you will need

| Purpose   | Command            | Expected on success |
| --------- | ------------------ | ------------------- |
| Typecheck | `pnpm typecheck`   | exit 0, no errors   |
| Tests     | `pnpm test`        | all pass            |
| Lint      | `pnpm exec oxlint` | exit 0              |

## Scope

**In scope**:

- `src/lib/digest/digest-service.ts`
- `src/lib/services/notification-service/alert-schedulers.ts`
- `src/lib/db/repositories/conflicts.ts`
- `src/components/settings/tabs/progress-export.tsx`
- `src/lib/vocabulary/service.ts`
- `src/lib/db/schema.ts` (add `resolvedAt` index, add compound `[userId+language]` index)

## Steps

### Step 1: Fix digest-service.ts

```typescript
// Before
const attempts = (await this.deps.db.quizAttempts.toArray()).filter(
  (a) => a.completedAt >= sevenDaysAgo,
);
// After
const attempts = await this.deps.db.quizAttempts.where("completedAt").above(sevenDaysAgo).toArray();
```

### Step 2: Fix alert-schedulers.ts

```typescript
// Before
const allAttempts = await getDeps().db.quizAttempts.toArray();
const attempts = allAttempts.filter((a) => a.completedAt >= sevenDaysAgo);
// After
const attempts = await getDeps().db.quizAttempts.where("completedAt").above(sevenDaysAgo).toArray();
```

### Step 3: Add resolvedAt index to conflicts table

Read `src/lib/db/schema.ts`, find the `conflicts` table definition. The current index likely is `conflicts: "++id"`. Change to `conflicts: "++id, resolvedAt"`. This requires a Dexie version bump — find the current latest version and increment it. Follow the existing migration pattern.

### Step 4: Fix conflicts.ts query

```typescript
// Before
(await this.db.conflicts.toArray()).filter((c) => !c.resolvedAt);
// After
await this.db.conflicts.where("resolvedAt").equals(0).toArray();
// or use .below(1) / .notEqual()
```

Use a query pattern that matches how `resolvedAt` stores its value — if it's `null` for unresolved, use `.equals(null)`. If it's `0`, use `.equals(0)`.

### Step 5: Fix progress-export.tsx

```typescript
// Before: _deps.db.examSessions.toArray()
// After: _deps.db.examSessions.orderBy("completedAt").reverse().limit(100).toArray()
```

### Step 6: Add vocabulary compound index (schema.ts)

Add `[userId+language]` compound index to the vocabularyList table. Find the current version and table definition, add the index. This also requires a Dexie version bump.

### Step 7: Fix vocabulary/service.ts language filter

When `filters?.language` is provided, use the compound index:

```typescript
if (filters?.language) {
  return await _deps.db.vocabularyList
    .where("[userId+language]")
    .equals([userId, filters.language])
    .toArray();
}
```

### Step 8: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. `pnpm exec oxlint` → exit 0.

## Test plan

Update the existing schema migration test (`src/lib/db/__tests__/schema-migration.test.ts`) to verify the new indexes exist. Add a test case for the vocabulary compound index query.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 (schema migration tests pass with new version)
- [ ] No `.toArray()` followed by `.filter()` on `quizAttempts` (check digest-service + alert-schedulers)
- [ ] `conflicts` table has `resolvedAt` index in schema
- [ ] `progress-export.tsx` examSessions query has `.limit(100)`
- [ ] `vocabularyList` table has `[userId+language]` index

## STOP conditions

Stop and report if the Dexie schema migration pattern differs from what's described — read the existing migration code at `src/lib/db/schema.ts` and match its pattern exactly.
