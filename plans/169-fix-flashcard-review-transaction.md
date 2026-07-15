# Plan 169: Wrap Flashcard Review Writes in a Dexie Transaction

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/flashcard-engine/engine.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

`flashcardEngine.review()` performs 4 independent writes outside a Dexie transaction: `flashcards.put()`, `reviewHistory.add()`, and 2 outbox enqueues. If write 2 fails after write 1 succeeds, the flashcard's SM-2 state (`easeFactor`, `interval`, `repetitions`) is updated but the review evidence is lost. The ease-hell detection (`countConsecutivePasses` reads reviewHistory) then misbehaves, skewing future scheduling. Corrupted SM-2 data accumulates over thousands of review sessions.

## Current state

In `src/lib/flashcard-engine/engine.ts`, lines ~196-207:

```typescript
await this.db.flashcards.put(updatedCard);            // Write 1: flashcard table
await this.saveReview(card.id, quality, updatedCard);  // Write 2: reviewHistory table
this.enqueueFn(...).catch(...);                        // Write 3: sync outbox
enqueueOutbox(...).catch(...);                         // Write 4: sync outbox
```

Dexie supports transactions: `this.db.transaction('rw', [this.db.flashcards, this.db.reviewHistory], async () => { ... })`.

The repo convention for DataAccess: use `this.db.flashcards` accessor which is a `DataAccessTable`. For Dexie transactions, use the raw Dexie instance via `this.db` — check how other engine modules create transactions.

## Commands you will need

| Purpose   | Command                                            | Expected on success |
| --------- | -------------------------------------------------- | ------------------- |
| Install   | `pnpm install`                                     | exit 0              |
| Typecheck | `pnpm run typecheck`                               | exit 0, no errors   |
| Tests     | `pnpm run test -- --run src/lib/flashcard-engine/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                           | exit 0              |

## Scope

**In scope**:

- `src/lib/flashcard-engine/engine.ts`

**Out of scope**:

- Other methods in engine.ts
- Sync outbox enqueue behavior (fire-and-forget is fine)

## Steps

### Step 1: Wrap data writes in a Dexie transaction

Identify the `review()` method in `src/lib/flashcard-engine/engine.ts`. Wrap the flashcard table write and review history write in a single Dexie transaction:

```typescript
// Wrap data writes in a transaction
await this.db.transaction(
  "rw",
  [
    ,/* flashcard table */
    /* reviewHistory table */
  ],
  async () => {
    await this.db.flashcards.put(updatedCard);
    await this.saveReview(card.id, quality, updatedCard);
  },
);
```

Keep the outbox enqueues outside the transaction (they're fire-and-forget and don't need atomicity with the data writes).

The exact table references depend on how `this.db` is typed. If `this.db` is a `DataAccess` seam, you may need to access the underlying Dexie instance. Check `src/lib/db/dexie-data-access.ts` for how to get the raw Dexie table. If direct Dexie access isn't available through `this.db`, import the Dexie instance directly: `import { offlineDB } from "@/lib/db/schema"`.

**Verify**: `pnpm run typecheck` → no errors on transaction API usage

### Step 2: Add try/catch with logError around the transaction

Add a `try/catch` around the transaction with `logError` from `@/lib/shared/logger`:

```typescript
try {
  await this.db.transaction(...);
} catch (error) {
  logError("FlashcardEngine.review", error, { cardId: card.id, quality });
  throw error;
}
```

**Verify**: `rg "logError" src/lib/flashcard-engine/engine.ts` → 1+ match

### Step 3: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/flashcard-engine/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Add a test that simulates a failed `saveReview` and verifies the flashcard was NOT updated (transaction rolled back). Use the existing test structure in `src/lib/flashcard-engine/__tests__/` as the pattern.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/flashcard-engine/` exits 0; transaction test exists
- [ ] `review()` wraps flashcard.put + saveReview in a Dexie transaction
- [ ] Outbox enqueues remain outside the transaction
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `review()` method structure differs from the excerpt
- `this.db` doesn't expose a `transaction()` method (it might be a DataAccess sub-interface, not raw Dexie)
- The DataAccess seam doesn't support transactions — in that case, report and we'll use `offlineDB` directly

## Maintenance notes

If Dexie transaction support isn't available through the DataAccess seam, this is a sign the seam needs a `transaction()` method. Log that as a follow-up finding. For now, direct `offlineDB` access is acceptable inside this engine module.
