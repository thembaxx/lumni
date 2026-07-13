---
status: TODO
priority: P2
effort: M
risk: LOW
confidence: MED
created: 2026-07-12
commit: 4fcd46a4
---

# 170 — Stale `currentStreak`/`levelInfo` passed into `addXp`/`checkAndUnlockAchievements`

## Context

In `processExamEffect`, `deps.updateStreak()` mutates gamification state synchronously, but `deps.currentStreak` and `deps.levelInfo.level` are captured from a `useMemo`'d object built on the **previous** render (`gamification-wiring.ts:73-86`). So `addXp(totalCount, accuracy, deps.currentStreak)` and `checkAndUnlockAchievements(..., deps.levelInfo.level, ...)` run with a one-step-behind streak/level. Usually benign, but can mis-credit the very streak that was just incremented and mis-evaluate level-based achievements. (Same pattern exists in the bolt/quiz/flashcard processors via `QuizResultDeps`.)

## Current state (verified)

`src/lib/services/quiz-result-processor/exam.ts:16-24`

```ts
deps.updateStreak();
deps.addXp(totalCount, accuracy, deps.currentStreak);
deps.checkAndUnlockAchievements(
  deps.totalQuestionsAnswered + totalCount,
  accuracy,
  deps.currentStreak,
  deps.levelInfo.level,
  accuracy === 100,
);
```

`src/app/[locale]/exam/[id]/exam-session/gamification-wiring.ts:73-86` — `currentStreak`, `levelInfo` captured in `useMemo` deps.

## Goal

Use fresh streak/level values after `updateStreak()`, not the memoized snapshot.

## Steps

1. Read `src/lib/gamification-engine/service.ts` (or the `GamificationService`) to find how `updateStreak()` updates state and whether it returns the new streak/level, or whether there's a getter for current state (e.g. `getState()`, `subscribe`).
2. Preferred fix: make `updateStreak()` return the new streak (and ensure level is recomputed), then pass the returned values:
   - `const streak = deps.updateStreak();` (or `deps.updateStreak()` then read `deps.getStreak()`)
   - `deps.addXp(totalCount, accuracy, streak);`
   - `deps.checkAndUnlockAchievements(..., streak, level, ...)` where `level` is read fresh.
3. Apply the same fresh-read pattern to `quiz.ts`, `bolt.ts`, and `flashcard.ts` processors in `src/lib/services/quiz-result-processor/`.
4. If `QuizResultDeps.currentStreak`/`levelInfo` cannot be made fresh without a larger refactor, instead have the executor read live gamification state inside the effect (e.g. pass a `getGamificationState()` accessor into `QuizResultDeps`). Keep the change minimal and contained to the processor + deps interface.
5. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/services/quiz-result-processor/{exam,quiz,bolt,flashcard}.ts`, `types.ts` (`QuizResultDeps`), the gamification service, `gamification-wiring.ts` if deps interface changes.
- Out of scope: achievement definitions, XP math.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/services/quiz-result-processor` → pass (add/extend: simulate a streak increment, assert `addXp` receives the incremented streak, not the pre-increment value).

## Test plan

- Extend `src/lib/services/quiz-result-processor/__tests__/*`: mock `updateStreak` to return `streak+1` and `addXp` to capture its `streak` arg; assert the captured streak equals the post-increment value. Mirror existing processor test mocking.

## Maintenance

- Any future code reading gamification values inside a result-effect must read fresh state, not the memoized snapshot. Document this in the PR.

## Escape hatches

- If `updateStreak` is fire-and-forget with no return and adding a return requires touching many call sites, prefer adding a `getStreak()`/`getLevel()` accessor to `QuizResultDeps` and reading it post-update. STOP and report if the refactor would touch >5 files beyond the processors.
