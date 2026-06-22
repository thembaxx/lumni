# Plan 009: Replace sequential seen-questions writes with bulkAdd

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/question-engine/adaptive-selector.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

`recordSeenQuestions` writes N records to IndexedDB one at a time in a `for...of` loop. Each `add()` is a separate IndexedDB transaction (~1-5ms). `bulkAdd()` on the same table is ~5ms total. For a past-paper quiz selecting 10-15 questions, this adds 50-75ms of unnecessary latency.

## Current state

**`src/lib/question-engine/adaptive-selector.ts:71-88`**:

```typescript
export async function recordSeenQuestions(
  questionIds: string[],
  subject: string,
  deps: { db: DataAccess },
): Promise<void> {
  try {
    const now = Date.now();
    for (const id of questionIds) {
      await deps.db.seenPastPaperQuestions.add({
        questionId: id,
        subject,
        seenAt: now,
      });
    }
  } catch (e) {
    logError("RecordSeenQuestions", e);
  }
}
```

The `DataAccess` interface exposes `bulkAdd()` on table accessors. The `seenPastPaperQuestions` table already supports `add()` — `bulkAdd()` is a drop-in replacement.

## Commands you will need

| Purpose   | Command                                                        | Expected on success |
| --------- | -------------------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                             | exit 0, no errors   |
| Lint      | `npx biome check src/lib/question-engine/adaptive-selector.ts` | 0 errors            |
| Tests     | `bun run test`                                                 | 1326+ pass, 0 fail  |

## Scope

**In scope**:

- `src/lib/question-engine/adaptive-selector.ts` (lines 71-88)

**Out of scope**:

- Other adaptive-selector logic
- DataAccess interface changes

## Git workflow

- Branch: `advisor/009-bulk-add-seen`
- Commit: `perf: use bulkAdd for recording seen questions`

## Steps

### Step 1: Replace loop with bulkAdd

```typescript
export async function recordSeenQuestions(
  questionIds: string[],
  subject: string,
  deps: { db: DataAccess },
): Promise<void> {
  try {
    const now = Date.now();
    await deps.db.seenPastPaperQuestions.bulkAdd(
      questionIds.map((id) => ({
        questionId: id,
        subject,
        seenAt: now,
      })),
    );
  } catch (e) {
    logError("RecordSeenQuestions", e);
  }
}
```

**Verify**: `npx biome check src/lib/question-engine/adaptive-selector.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/question-engine/adaptive-selector.ts
bun run test
```

## Test plan

- Existing adaptive-selector tests should cover this path.
- If `src/lib/question-engine/__tests__/adaptive-selector.test.ts` exists, verify `recordSeenQuestions` is tested.
- If not, add a simple test:
  - Call `recordSeenQuestions(["q1", "q2", "q3"], "math", { db: inMemoryDb })`
  - Assert `db.seenPastPaperQuestions.toArray()` has 3 entries with correct `questionId`, `subject`, `seenAt`

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/question-engine/adaptive-selector.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "for.*of.*questionIds" src/lib/question-engine/adaptive-selector.ts` returns no matches in `recordSeenQuestions`
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `seenPastPaperQuestions` table accessor doesn't have `bulkAdd()` (check `DataAccess` interface).
- The `add()` call has side effects beyond writing (it doesn't — verified).

## Maintenance notes

- If duplicate question IDs are passed, `bulkAdd` may throw on unique constraint violations. The current `add()` would also throw, so this is existing behavior.
- Consider adding `{ allKeys: false }` option if the table has a primary key and duplicates are expected.
