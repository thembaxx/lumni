# Plan 039: Fix FlashcardEngine.update() data corruption on partial writes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7525d6ed..HEAD -- src/lib/flashcard-engine/engine.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: HIGH (fixing active data corruption — test coverage essential)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`FlashcardEngine.update()` sends a sync payload to Appwrite that replaces every field on the server document with either the update value or a default (empty string/zero). A partial update such as `update(id, { status: "buried" })` sends `front: ""`, `back: ""`, `easeFactor: 0`, `interval: 0`, etc., silently corrupting the server-side flashcard record. Every call path that does partial mutations (bury, suspend, activate) loses all prior field values.

## Current state

`src/lib/flashcard-engine/engine.ts:181-197`:

```typescript
async update(id: string, updates: Partial<FlashcardSM2>): Promise<void> {
    const merged = { ...updates, updatedAt: Date.now() };
    await this.db.flashcards.update(id, merged);
    this.enqueueFn("appwrite-flashcard-sync", {
      id,
      front: updates.front ?? "",
      back: updates.back ?? "",
      subject: updates.subject ?? "",
      topic: updates.topic,
      easeFactor: updates.easeFactor ?? 0,
      interval: updates.interval ?? 0,
      repetitions: updates.repetitions ?? 0,
      nextReview: updates.nextReview ?? 0,
      lastReview: updates.lastReview ?? null,
      createdAt: updates.createdAt ?? 0,
      updatedAt: Date.now(),
    }).catch((e: unknown) => console.warn("[FlashcardEngine] update sync:", e));
  }
```

The repo uses conventional commits (e.g., `fix:`, `feat:`, `perf:`). Example from `git log`: `fix: add missing DiagramColors type import in chart.tsx`.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `src/lib/flashcard-engine/engine.ts` — fix the `update()` method

**Out of scope** (do NOT touch, even though they look related):

- `src/lib/flashcard-engine/` test files — the fix should keep existing tests green
- `src/lib/flashcard-engine/algorithms.ts` — no algorithm changes
- `src/lib/orchestrator/` — the sync handlers are consumers; changing them is unnecessary

## Steps

### Step 1: Read existing card before building sync payload

In `update()`, replace the current sync payload construction with one that reads the existing card from Dexie, merges updates, and sends the full merged state:

```typescript
async update(id: string, updates: Partial<FlashcardSM2>): Promise<void> {
    const merged = { ...updates, updatedAt: Date.now() };
    await this.db.flashcards.update(id, merged);

    // Read the full card after the Dexie update so the sync payload is complete
    const card = await this.db.flashcards.get(id);
    if (!card) {
      console.warn(`[FlashcardEngine] update: card ${id} not found after update`);
      return;
    }

    this.enqueueFn("appwrite-flashcard-sync", {
      id: card.id,
      front: card.front,
      back: card.back,
      subject: card.subject,
      topic: card.topic,
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      nextReview: card.nextReview,
      lastReview: card.lastReview,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    }).catch((e: unknown) => console.warn("[FlashcardEngine] update sync:", e));
  }
```

**Verify**: `pnpm run typecheck` → exit 0. `pnpm run test` → all pass.

### Step 2: Confirm the fix by reading the test file

Open `src/lib/flashcard-engine/__tests__/engine.test.ts` (if it exists) and verify the existing tests still pass. If there's a test for `update()`, confirm the expected behavior now includes reading the card before sync.

**Verify**: `pnpm run test` → exit 0. Manually inspect that no test for `update` asserts the OLD (broken) behavior of sending empty/zero fields.

## Test plan

- Existing flashcard engine tests must still pass.
- No new tests required for this fix (the bug is straightforward and the existing test coverage should catch regressions).
- If there is no test for `update()` today, consider adding one that calls `update(id, { status: "buried" })` and asserts the sync payload's `front` and `back` fields are non-empty (read from the stored card).

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0; no new failures
- [ ] The `update()` method reads the card from `this.db.flashcards.get(id)` before building the sync payload
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The code at `engine.ts:181-197` doesn't match the excerpts (codebase has drifted)
- `this.db.flashcards.get(id)` returns a type that doesn't match `FlashcardSM2` fields
- A step's verification fails twice after a reasonable fix attempt
- The fix requires touching an out-of-scope file

## Maintenance notes

- If `FlashcardSM2` gains new fields in the future, the sync payload in `update()` must also include them. Add a comment at the sync payload construction: `// Keep in sync with FlashcardSM2 fields — all fields must be included to avoid partial-write corruption`.
- The same pattern exists in `review()` method (line 207+) which also calls `enqueueFn("appwrite-flashcard-sync")` — that path correctly reads the card first via `this.db.flashcards.get(id)`, so it's not affected.
