# Plan 015: Enable offline quiz playback from downloaded packs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/quiz-packs/ src/components/dashboard/offline-packs.tsx src/hooks/use-quiz-packs.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

Users download offline quiz packs (spending AI quota and storage) but can never actually use them for practice. `QuizPackService.getQuestions()` exists with zero callers. The `OfflinePackManager` UI has a "Download" button but no "Start Quiz" action. The entire offline quiz flow is write-only. The core value proposition — "download on wifi, practice without data" — is broken at the final step.

## Current state

**`src/lib/quiz-packs/service.ts:85-90`**:

```typescript
async getQuestions(packId: string): Promise<QuizPackQuestion[]> {
  return this.db.packQuestions
    .where("packId")
    .equals(packId)
    .sortBy("questionIndex");
}
```

Zero callers. The `packQuestions` table has compound index `[packId+questionIndex]` ready for efficient retrieval.

**`src/components/dashboard/offline-packs.tsx`**: Renders pack status, delete buttons, and a "Download" button. No "Start Quiz" or "Play" action.

**`src/hooks/use-quiz-packs.ts`**: Exposes `generate` and `remove` but no `startQuiz` or `play` method.

## Commands you will need

| Purpose   | Command                            | Expected on success |
| --------- | ---------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                 | exit 0, no errors   |
| Lint      | `npx biome check` on changed files | 0 errors            |
| Tests     | `bun run test`                     | 1326+ pass, 0 fail  |

## Scope

**In scope**:

- `src/hooks/use-quiz-packs.ts` — add `playPack` method
- `src/components/dashboard/offline-packs.tsx` — add "Start Quiz" button
- `src/lib/quiz-packs/service.ts` — `getQuestions` already exists

**Out of scope**:

- `src/lib/question-engine/` — do not modify the quiz engine
- `src/app/[locale]/quiz/` — quiz page routing

## Git workflow

- Branch: `advisor/015-offline-playback`
- Commit: `feat: enable offline quiz playback from downloaded packs`

## Steps

### Step 1: Add playPack to useQuizPacks

In `src/hooks/use-quiz-packs.ts`, add a `playPack(id)` method:

```typescript
const playPack = useCallback(
  async (packId: string) => {
    const questions = await quizPackService.getQuestions(packId);
    // Map QuizPackQuestion[] to Question[] format expected by quiz engine
    // Navigate to /quiz?packId={packId}
    // Or return questions for the caller to use
  },
  [quizPackService],
);
```

The mapping from `QuizPackQuestion` to `Question` is the critical part. Read both types to understand the shape difference.

### Step 2: Add "Start Quiz" button to OfflinePackManager

In `src/components/dashboard/offline-packs.tsx`, for packs with status `"ready"`, add a "Start Quiz" button next to the "Delete" button:

```tsx
{
  pack.status === "ready" && <Button onClick={() => playPack(pack.id)}>Start Quiz</Button>;
}
```

### Step 3: Handle the quiz flow

The quiz page (`/quiz`) needs to accept a `packId` query parameter and load questions from the pack instead of generating new ones via AI. This may require:

- A new route or query parameter on the existing quiz route
- A hook that loads pack questions and feeds them into the quiz engine

Read `src/app/[locale]/quiz/` to understand the current quiz flow before implementing.

### Step 4: Run full verification

```bash
npx tsc --noEmit
npx biome check src/hooks/use-quiz-packs.ts src/components/dashboard/offline-packs.tsx
bun run test
```

## Test plan

- Add a test in `src/hooks/__tests__/use-quiz-packs.test.ts`:
  - Mock `quizPackService.getQuestions()` to return test questions
  - Call `playPack(id)` → verify questions are returned and navigation would occur
- Add a test for OfflinePackManager:
  - Render with a "ready" pack → verify "Start Quiz" button exists
  - Render with a "generating" pack → verify no "Start Quiz" button

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "playPack\|getQuestions\|Start Quiz" src/hooks/use-quiz-packs.ts src/components/dashboard/offline-packs.tsx` returns matches
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `QuizPackQuestion` and `Question` types are too different to map without a complex adapter.
- The quiz page doesn't support loading pre-stored questions (it may be tightly coupled to AI generation).
- `getQuestions` is not accessible from the hook (DI issue).

## Maintenance notes

- The `QuizPackQuestion` → `Question` mapping is the key complexity. If the types diverge significantly, a thin adapter module may be needed.
- Future: consider a "pack quiz" mode that doesn't show accuracy (since pack questions may not have answer validation).
