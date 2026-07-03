# Plan P011: Add QuestionEngine.generate() Characterization Tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/lib/question-engine/`
> If any file changed, compare excerpts against live code.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (but P010 provides mock patterns for AI calls)
- **Category**: tests
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

The `QuestionEngine` is the core of the application — it generates, validates, and grades all 11 question types. Its `generate()` method (73 lines) orchestrates enrichment, pool-question mapping, retry logic (MAX_RETRIES=2), RAG fetch, and batch generation. Yet the existing test file (`question-engine.test.ts`, 68 lines) only tests `validate()` and `listTypes()`. `generate()`, `grade()`, `generateHint()`, and the entire orchestration pipeline run with zero test coverage.

## Current state

**`src/lib/question-engine/question-engine.ts`** — key methods:

- `generate()` (73 lines) — retrieves config, runs enrichment, maps pool questions, retries with MAX_RETRIES=2, calls batch generator, handles RAG context
- `generateEffect()` — Effect TS wrapper around generate
- `grade()` / `gradeEffect()` — grading orchestration
- `generateHint()` — hint generation
- `validate()` (tested) — question validation
- `listTypes()` (tested) — registered types enumeration

**Existing test file** `src/lib/question-engine/__tests__/question-engine.test.ts` — 3 tests, only covers `validate()` and `listTypes()`.

## Commands you will need

| Purpose   | Command                            | Expected on success |
| --------- | ---------------------------------- | ------------------- |
| Test      | `pnpm run test -- question-engine` | all pass            |
| Typecheck | `pnpm run typecheck`               | exit 0, no errors   |
| Lint      | `pnpm exec oxlint`                 | exit 0              |

## Scope

**In scope**:

- `src/lib/question-engine/__tests__/question-engine.test.ts` — extend with `generate()` and `grade()` tests

**Out of scope**:

- Changes to any production code
- Tests for `batch-generator.ts`, `pool-mapper.ts`, `persistence.ts` (these are covered in suggestion but out of scope for this plan)
- Integration tests with real AI SDK

## Git workflow

- Branch: `advisor/P011-engine-tests`
- Commit message: `test: add characterization tests for QuestionEngine.generate() and grade()`
- Do NOT push or open a PR

## Steps

### Step 1: Understand mock patterns

Read the existing test file. The `QuestionEngine` constructor likely accepts optional DI for:

- `ai?: AIClient` (Session 37: AI client is threaded through processors)
- `cachingStrategy?: CachingStrategy`
- `enrichmentPipeline?: EnrichmentPipeline`

Check the constructor signature and available imports in the existing file.

### Step 2: Add `generate()` tests

Extend the test file with a `describe("generate")` block. The engine's `generate()` returns `GenerateResult { questions, ragContext }`.

Test cases:

1. **generates from pool only when past paper mode** — set `params.pastPaperOnly: true`, expect questions from pool, no AI call
2. **generates from AI + pool** — full flow, expect mixed question list
3. **retries on empty batch** — mock the processor to return empty first batch, expect retry up to MAX_RETRIES
4. **handles RAG connection failure gracefully** — RAG fetch throws, engine should still generate (fail-open)
5. **returns questions within count limit** — verify `questions.length` matches requested count (or less if not enough generated)

### Step 3: Add `grade()` tests

Test cases:

1. **grades multiple-choice question correctly** — submit known answer, verify `isCorrect`
2. **grades short-answer with correct/incorrect** — submit exact match and wrong answer
3. **returns `GradingResult` with feedback** — verify result shape matches type

### Step 4: Add `generateHint()` test

Test case:

1. **returns hint string** — call `generateHint()` with a question, verify string return

### Step 5: Verify

**Verify**: `pnpm run test -- question-engine` → 8+ new tests pass. `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

## Test plan

7-10 new test cases across 3 describe blocks. Follow the same vitest pattern as the existing file. Mock AI calls, caching, and enrichment — the engine accepts DI for all of these.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test -- question-engine` shows 10+ tests (up from 3), all pass
- [ ] `grep -n "describe.*generate" src/lib/question-engine/__tests__/question-engine.test.ts` matches
- [ ] `grep -n "describe.*grade" src/lib/question-engine/__tests__/question-engine.test.ts` matches
- [ ] No production code modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The `QuestionEngine` constructor requires complex setup (Appwrite, Dexie) that can't be easily mocked — report the specific DI requirement
- The `generate()` method is async and relies on Effect TS making it hard to test with vitest — report and mark as a higher-effort plan

## Maintenance notes

- When AI provider chain or RAG injection changes, these tests must be updated to reflect new mock expectations
- The existing 3 tests should continue passing unchanged
