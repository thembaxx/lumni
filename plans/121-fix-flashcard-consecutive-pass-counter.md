# Plan 121: Fix flashcard consecutive-pass counter ordering

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/flashcard-engine/engine-helpers.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

`countConsecutivePasses` is supposed to count the 10 most recent reviews and count consecutive passes from the end. But `.toReversed()` followed by `.sortBy("reviewedAt")` is a no-op — `sortBy` re-sorts ascending regardless of prior ordering. The subsequent `slice(-10)` grabs the 10 oldest records. This means ease-hell recovery gets the wrong window, and SM-2 scheduling degrades for struggling cards.

## Current state

`src/lib/flashcard-engine/engine-helpers.ts:33-49`:

```ts
export async function countConsecutivePasses(db: DataAccess, cardId: string): Promise<number> {
  const history = await db.reviewHistory
    .where("cardId")
    .equals(cardId)
    .toReversed() // ← no-op before sortBy
    .sortBy("reviewedAt"); // ← re-sorts ascending
  const recent = history.toReversed().slice(-10); // ← grabs oldest 10
  let count = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].quality >= 3) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
```

Called from `src/lib/flashcard-engine/engine.ts:168-181` in ease-hell recovery logic.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`      | exit 0, no errors   |
| Tests     | `pnpm run test -- engine` | all pass            |

## Steps

### Step 1: Fix the query ordering

Replace the entire function body with:

```ts
export async function countConsecutivePasses(db: DataAccess, cardId: string): Promise<number> {
  const history = await db.reviewHistory.where("cardId").equals(cardId).sortBy("reviewedAt");
  const recent = history.slice(-10); // last 10 by timestamp
  let count = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].quality >= 3) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
```

The fix: remove both `.toReversed()` calls. `.sortBy("reviewedAt")` returns ascending order; `.slice(-10)` grabs the last 10 (most recent). The loop then walks backward from the end (most recent), which is correct.

**Verify**: `pnpm exec oxlint src/lib/flashcard-engine/engine-helpers.ts` → 0 errors

### Step 2: Add characterization test

Create `src/lib/flashcard-engine/__tests__/engine-helpers.test.ts` with test cases:

- Empty history → 0
- 5 consecutive passes (quality >= 3) → 5
- 3 passes then 1 fail → 3
- More than 10 reviews → only counts last 10
- All fails → 0

Use `InMemoryDataAccess` from `@/lib/db/in-memory-data-access` for the `db` parameter.

**Verify**: `pnpm run test -- engine-helpers` → all pass

### Step 3: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] Both `.toReversed()` calls removed
- [ ] New tests cover empty, all-pass, mixed, overflow (>10), all-fail cases
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The Dexie `.sortBy()` API returns a Promise<Array> (confirm this is the case in Dexie 4.x)
- The `quality` field on review history records doesn't exist or uses a different name
