# Plan P013: Extract Hooks and Sub-Components from Large Page Components

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/app/[locale]/flashcards/ src/app/[locale]/exam/ src/app/[locale]/pronunciation/ src/app/[locale]/stories/ src/app/[locale]/questions/`
> If any file changed, compare the current state against the live code.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

5 page-level components exceed 400 lines each, mixing data fetching, UI layout, business logic, and side effects in a single file:

- `flashcards-client.tsx` (512 lines) — session state, gamification wiring, swipe deck, inline QuizResultDeps
- `exam-session-client.tsx` (486 lines) — 7 related states, auto-save effects, exam phase machine, gamification wiring
- `pronunciation-client.tsx` (452 lines) — recording state machine, assessment rendering, charts, history, STT fallback chain
- `story-reader-client.tsx` (434 lines) — reading state, comprehension questions, progress tracking, offline persistence
- `question-bank-client.tsx` (424 lines) — pagination/filtering, inline QuestionCard sub-component, past-paper browsing

Each mixes ~3 separable concerns, making unit testing harder (must mount full page), slowing onboarding, and increasing merge conflict surface. The codebase already has exemplar extraction patterns (`use-quiz-view.ts` extracted from `quiz-view.tsx` in Session 39).

## Current state

This plan targets one extraction per page component. The high-value extractions:

1. **`flashcards-client.tsx:512`** — Extract `useFlashcardSession` hook (state machine for card advance, quality pick, session completion). ~150 lines out of 512.
2. **`exam-session-client.tsx:486`** — Extract `useExamSession` hook (exam phase machine, auto-save, scroll tracking). ~180 lines out of 486.
3. **`pronunciation-client.tsx:452`** — Extract `usePronunciationSession` hook (recording state, assessment, STT fallback). ~120 lines out of 452.

The remaining two (`story-reader-client.tsx`, `question-bank-client.tsx`) are lower priority and can be deferred.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope** (extract these hooks):

- `src/app/[locale]/flashcards/flashcards-client.tsx` → extract `useFlashcardSession` hook
- `src/app/[locale]/exam/[id]/exam-session-client.tsx` → extract `useExamSession` hook
- `src/app/[locale]/pronunciation/pronunciation-client.tsx` → extract `usePronunciationSession` hook

**Out of scope**:

- `story-reader-client.tsx` and `question-bank-client.tsx` — defer to a future batch
- Extracting sub-components (only hooks in this plan)
- Adding test files
- Changing component behavior or UI

## Git workflow

- Branch: `advisor/P013-extract-page-hooks`
- Commit message: `refactor: extract useFlashcardSession, useExamSession, usePronunciationSession hooks`
- Do NOT push or open a PR

## Steps

### Step 1: Extract `useFlashcardSession` hook

Create `src/hooks/use-flashcard-session.ts`:

1. Identify the state variables in `flashcards-client.tsx` that manage: current card index, flip state, swipe progress, session completion, consecutive correct counter
2. Identify the `useEffect` blocks for: auto-advance, gamification wiring, QuizResultDeps initialization
3. Move these into a hook that returns: `{ currentIndex, isFlipped, isComplete, consecutiveCorrect, advanceCard, flipCard, reset }`
4. Import and use the hook in `flashcards-client.tsx`
5. Verify the component renders identically

### Step 2: Extract `useExamSession` hook

Create `src/hooks/use-exam-session.ts`:

1. Identify: exam phase state machine, timer, auto-save effects, scroll tracking, question navigation state
2. Move into hook returning: `{ phase, setPhase, currentQuestion, answers, timeRemaining, submitAnswer, navigateToQuestion, saveProgress }`
3. Import and use in `exam-session-client.tsx`

### Step 3: Extract `usePronunciationSession` hook

Create `src/hooks/use-pronunciation-session.ts`:

1. Identify: recording state, STT chain, assessment results, history state
2. Move into hook returning: `{ isRecording, audioBlob, transcript, assessment, startRecording, stopRecording, submitAssessment }`
3. Import and use in `pronunciation-client.tsx`

### Step 4: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

Open each modified page component and confirm the return value snapshot looks identical (same structure, same imports, same CSS classes).

## Test plan

No new tests. The extraction is additive — existing behavior is preserved by keeping the same state/effect logic in a hook instead of inline.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] 3 new hook files exist: `use-flashcard-session.ts`, `use-exam-session.ts`, `use-pronunciation-session.ts`
- [ ] Each page component is reduced by at least 100 lines
- [ ] `grep -n "useFlashcardSession\|useExamSession\|usePronunciationSession" src/app/` shows usage in the corresponding page component
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any hook extracts more than 200 lines (means the seam isn't clean — stop and report the complexity)
- The extracted hook creates import cycles (hook imports page-level types, or page imports hook that imports page)
- The component's behavior changes after extraction

## Maintenance notes

- Extraction follows the existing pattern from Session 39: `use-quiz-view.ts` extracted from `quiz-view.tsx`
- Future work: extract sub-components (QuestionCard from question-bank-client, reading toolbar from story-reader-client)
- After extraction, the page components should be mostly JSX layout + hook calls, making them much easier to unit-test with mounting-based tests
