# Plan 014: Wire vocabulary saves into SM-2 flashcard engine

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/flashcard-engine/vocabulary-bridge.ts src/app/[locale]/flashcards/ src/lib/flashcard-engine/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

Language learners can save vocabulary words from lessons and stories, but the saved words bypass the SM-2 flashcard engine entirely — no spaced repetition scheduling, no `nextReview` timestamps, no ease factor updates. The `createVocabularyCard()` bridge function already exists and calls `flashcardEngine.create()` with the right signature, but it's never imported by any consumer. Connecting this single wire gives language learners genuine spaced repetition instead of one-shot drills.

## Current state

**`src/lib/flashcard-engine/vocabulary-bridge.ts`** (12 lines):
```typescript
export async function createVocabularyCard(
  word: VocabularyEntry,
): Promise<void> {
  const back = word.partOfSpeech
    ? `${word.definition} (${word.partOfSpeech})`
    : word.definition;
  await flashcardEngine.create(word.word, back, word.language, "vocabulary");
}
```

Zero import sites confirmed via grep.

**`src/app/[locale]/flashcards/flashcards-client.tsx:310-337`**: Vocabulary review mode constructs ad-hoc `FlashcardItem` objects directly from `getSavedWords()`, bypassing SM-2 entirely.

**`src/lib/flashcard-engine/engine.ts`**: `FlashcardEngine.create()` supports any topic type including `"vocabulary"`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check` on changed files | 0 errors |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/lib/flashcard-engine/vocabulary-bridge.ts` (already exists)
- `src/app/[locale]/flashcards/flashcards-client.tsx` (modify vocabulary mode)
- Files that call `saveWord()` or handle `SaveVocabularyButton` clicks

**Out of scope**:
- `src/lib/flashcard-engine/engine.ts` — engine already supports vocabulary
- The vocabulary data model — already exists

## Git workflow

- Branch: `advisor/014-vocabulary-sr"
- Commit: `feat: wire vocabulary saves through SM-2 flashcard engine`

## Steps

### Step 1: Call createVocabularyCard when saving a word

Find where `SaveVocabularyButton` or `saveWord()` persists vocabulary to Dexie. After the Dexie write, call `createVocabularyCard()`:

```typescript
import { createVocabularyCard } from "@/lib/flashcard-engine/vocabulary-bridge";

// In the save handler:
await createVocabularyCard(vocabularyEntry);
```

### Step 2: Update flashcards vocabulary mode to load from engine

In `flashcards-client.tsx`, the vocabulary mode should load from `flashcardEngine.getDueCards("vocabulary")` and `flashcardEngine.getNewCards("vocabulary", n)` instead of raw `getSavedWords()`. This ensures the SM-2 scheduling is respected.

### Step 3: Remove dead ad-hoc card construction

Remove the block at lines 310-337 that constructs ad-hoc `FlashcardItem` objects for vocabulary mode.

### Step 4: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/flashcard-engine/vocabulary-bridge.ts src/app/[locale]/flashcards/flashcards-client.tsx
bun run test
```

## Test plan

- Add a test in `src/lib/flashcard-engine/__tests__/vocabulary-bridge.test.ts`:
  - Call `createVocabularyCard(word)` → verify `flashcardEngine.create()` was called with correct args
- Add a test for flashcards vocabulary mode:
  - Seed InMemoryDataAccess with vocabulary flashcards (some due, some not)
  - Verify vocabulary mode loads from engine, not raw Dexie

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0; new tests for vocabulary bridge exist and pass
- [ ] `grep -rn "createVocabularyCard" src/` returns at least 1 import match (not just the definition)
- [ ] `grep -n "getSavedWords" src/app/\[locale\]/flashcards/flashcards-client.tsx` returns no matches in vocabulary mode
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `createVocabularyCard` signature doesn't match `VocabularyEntry` type
- The vocabulary save handler is not in a file you can identify
- The flashcards vocabulary mode has more complex logic than described

## Maintenance notes

- This is the highest-leverage single wire in the codebase — connects existing infrastructure to give language learners real SR.
- Future: consider a "vocabulary review" session type in the flashcard session manager.
