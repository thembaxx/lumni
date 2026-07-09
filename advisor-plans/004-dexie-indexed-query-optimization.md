# Plan 004: Replace full-table Dexie scans with indexed queries in retention loop

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat be3a4dfb..HEAD -- src/lib/retention-loop/`
> If any file in `src/lib/retention-loop/` changed since this plan was written,
> compare the "Current state" excerpts against the live code before proceeding;
> on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `be3a4dfb`, 2026-07-09

## Why this matters

The retention loop's `next-action.ts` runs full-table scans (`toArray()`) on the flashcards and competencies tables, then filters in JS. With Dexie indexes already defined on `nextReview` and `competencies.*`, these queries should use indexed lookups — O(matches) instead of O(N). The retention loop triggers every 30-60 seconds on the dashboard (polling for next-best action and feed), so on a user with thousands of flashcards, this adds unnecessary memory pressure and latency on every dashboard load.

## Current state

### `src/lib/retention-loop/next-action.ts` — three problematic spots

**SPOT 1 — `getDueCardCountEffect()` (~line 87-88):**

```typescript
const allCards = await flashcards.toArray();
const dueCards = allCards.filter((c) => c.nextReview <= now);
```

**SPOT 2 — `getFeed()` (~line 226-227):**

```typescript
const allCards = await flashcards.toArray();
// ... filter by nextReview, topic, etc.
```

**SPOT 3 — `getWeakestTopicEffect()` (~line 115):**

```typescript
const allCompetencies = await competencies.toArray();
// ... manual aggregation by topic
```

The Dexie schema (`src/lib/db/schema.ts` ~line 598-600) defines these indexes:

```
flashcards.nextReview, flashcards.id (indexed)
competencies.subjectId, competencies.topicId, competencies.level (indexed)
```

The DataAccess pattern uses `flashcards.where("nextReview").belowOrEqual(now).toArray()` — this directly uses the Dexie index.

**Repo conventions to match:**

- DataAccess is accessed via `_deps.db` in the retention loop file
- `_deps` is the injected DI seam (see the file's top: `let _deps: { db: DataAccess } = Object.freeze(...)`)
- The collection pattern: `db.flashcards.where("nextReview").belowOrEqual(now).toArray()` — see DataAccess interface at `src/lib/db/data-access.ts` for available methods
- The `WhereClause` interface supports: `equals()`, `belowOrEqual()`, `below()`, `startsWith()`, `anyOf()`
- The `Collection` interface supports: `toArray()`, `first()`, `count()`, `limit()`, `filter()`, `reverse()`, `sortBy()`
- Compound `where({subjectId, topicId})` is NOT available on the DataAccess interface (it was removed in Session 23). Use `.where("key").equals(val).filter(...)` chaining instead.

## Commands needed

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm typecheck`          | exit 0              |
| Tests     | `pnpm run test`           | all pass            |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope:**

- `src/lib/retention-loop/next-action.ts` — three query locations

**Out of scope:**

- `src/lib/retention-loop/__tests__/` — tests exist; verify they pass
- Other files in `src/lib/retention-loop/` — only `next-action.ts`
- The DataAccess interface itself
- Any other retention-loop or dashboard component

## Steps

### Step 1: Fix `getDueCardCountEffect()`

Read the file to find exact line numbers. Replace:

```typescript
const allCards = await flashcards.toArray();
const dueCards = allCards.filter((c) => c.nextReview <= now);
```

With:

```typescript
const dueCards = await flashcards.where("nextReview").belowOrEqual(now).toArray();
```

**Verify**: `pnpm typecheck` → exit 0. Read the file to confirm the replacement is correct.

### Step 2: Fix `getFeed()`

Read the function to see if it uses `filter` after `toArray()`. The pattern is typically:

```typescript
const allCards = await flashcards.toArray();
const filtered = allCards.filter((c) => c.nextReview <= now && c.topic === topic);
```

If it filters on `nextReview` plus additional criteria, use:

```typescript
const cards = await flashcards
  .where("nextReview")
  .belowOrEqual(now)
  .filter((c) => c.topic === topic) // second criterion in JS (no compound index needed)
  .toArray();
```

The `.filter()` on the Collection interface runs in JS but on a reduced set (only due cards) instead of all cards.

**Verify**: `pnpm typecheck` → exit 0

### Step 3: Fix `getWeakestTopicEffect()`

Read the function. If it aggregates competencies by topic with manual grouping:

```typescript
const allCompetencies = await competencies.toArray();
// manual group by topic, compute averages, find weakest
```

Replace with one of:

- `await competencies.toArray()` if it genuinely needs all competencies (the table is small per-user)
- Or `await competencies.where("level").belowOrEqual(...).sortBy("topic")` if there's an applicable index

Only change this if `competencies` has a useful index for the grouping. If it needs all records for a correct result (e.g., computing "weakest topic" across all topics), `toArray()` may be the correct query and this finding is not applicable. If so, skip this step and note it.

**Verify**: `pnpm typecheck` → exit 0

### Step 4: Run full gate

**Verify**:

- `pnpm typecheck` → exit 0
- `pnpm exec oxlint` → exit 0
- `pnpm run test` → all pass

## Test plan

No new tests needed. The existing retention-loop tests (`src/lib/retention-loop/__tests__/`) should continue to pass since the return values are semantically identical.

If you want to add verification, run:

```bash
pnpm test -- retention-loop
```

This should show all existing tests passing.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm run test` — all pass
- [ ] `pnpm exec oxlint` — zero warnings on `next-action.ts`
- [ ] No `toArray()` + `.filter()` chains remain on `nextReview` — all use `.where()` first
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report if:

- The `DataAccess` interface doesn't have `.where()` on the flashcards table (read the interface first to confirm — it does per ADR-0011)
- The `belowOrEqual` method is missing from `WhereClause` (it should be there per the interface, but verify)
- The query returns different results (edge case: `nextReview` is a number timestamp and the inequality semantics of `belowOrEqual` match the JS `<=` — they do in Dexie)
- The `getFeed()` function uses additional compound filters that can't be expressed as a single indexed query (the `filter()` fallback is acceptable)

## Maintenance notes

- If Dexie schema adds a compound index on `[nextReview+topic]`, the `.filter((c) => c.topic === topic)` can be replaced with an indexed compound query for even better performance.
- The `weakestTopic` function may need a dedicated Dexie index (`competencies.subjectId+topicId+level`) if it becomes a hot path.
