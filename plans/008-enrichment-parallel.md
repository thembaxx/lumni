# Plan 008: Parallelize independent enrichment pipeline sources

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/question-engine/enrichment-pipeline.ts`
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

The enrichment pipeline runs `curriculum.fetchCurriculumContext()` and `embeddings.fetchEmbeddingResults()` sequentially, but these are independent — neither depends on the other's result. Running them in parallel saves 200-500ms per quiz generation on the hot path.

## Current state

**`src/lib/question-engine/enrichment-pipeline.ts:241-254`**:

```typescript
async enrich(params: GenerationParams): Promise<GenerationParams> {
  const curriculumContext = await curriculum.fetchCurriculumContext(
    params.subject,
    params.topic,
  );
  const exampleCount = params.pastPaperMode ? 5 : 3;

  const { poolQuestions, pastPaperExamples: embeddingExamples } =
    await embeddings.fetchEmbeddingResults(
      params.subject,
      params.topic,
      exampleCount,
      params.pastPaperMode,
    );
  // ...
}
```

Both `fetchCurriculumContext` and `fetchEmbeddingResults` are awaited sequentially. They take `params.subject` and `params.topic` as input — no data dependency between them.

## Commands you will need

| Purpose   | Command                                                          | Expected on success |
| --------- | ---------------------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                               | exit 0, no errors   |
| Lint      | `npx biome check src/lib/question-engine/enrichment-pipeline.ts` | 0 errors            |
| Tests     | `bun run test`                                                   | 1326+ pass, 0 fail  |

## Scope

**In scope**:

- `src/lib/question-engine/enrichment-pipeline.ts` (lines 241-264)

**Out of scope**:

- The curriculum, embedding, or pastPaper source implementations
- Other enrichment pipeline logic

## Git workflow

- Branch: `advisor/008-enrichment-parallel`
- Commit: `perf: parallelize curriculum and embedding fetches in enrichment pipeline`

## Steps

### Step 1: Parallelize the independent fetches

Replace the sequential awaits with `Promise.all`:

```typescript
async enrich(params: GenerationParams): Promise<GenerationParams> {
  const exampleCount = params.pastPaperMode ? 5 : 3;

  // Run independent fetches in parallel
  const [curriculumContext, embeddingResults] = await Promise.all([
    curriculum.fetchCurriculumContext(params.subject, params.topic),
    embeddings.fetchEmbeddingResults(
      params.subject,
      params.topic,
      exampleCount,
      params.pastPaperMode,
    ),
  ]);

  const { poolQuestions, pastPaperExamples: embeddingExamples } = embeddingResults;

  let pastPaperExamples = embeddingExamples ?? [];

  if (pastPaperExamples.length === 0) {
    pastPaperExamples = await pastPapers.fetchPastPaperExamples(
      params.subject,
      params.topic,
      exampleCount,
    );
  }

  return {
    ...params,
    ...(curriculumContext ? { curriculumContext } : {}),
    ...(poolQuestions && poolQuestions.length > 0 ? { poolQuestions } : {}),
    ...(pastPaperExamples.length > 0 ? { pastPaperExamples } : {}),
  };
}
```

**Verify**: `npx biome check src/lib/question-engine/enrichment-pipeline.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/question-engine/enrichment-pipeline.ts
bun run test
```

## Test plan

- If `src/lib/question-engine/__tests__/enrichment-pipeline.test.ts` exists, verify it still passes.
- If not, this is a low-risk refactor — the existing question-engine tests exercise this path.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/question-engine/enrichment-pipeline.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "Promise.all" src/lib/question-engine/enrichment-pipeline.ts` returns a match in the `enrich` method
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `fetchCurriculumContext` and `fetchEmbeddingResults` share mutable state (they don't — verified).
- The past paper fallback (embeddingExamples empty → API fetch) creates a waterfall that can't be parallelized (it can — the fallback is after the parallel block).

## Maintenance notes

- If a third independent source is added to the pipeline, add it to the `Promise.all` array.
- The past paper fallback remains sequential because it depends on the embedding result.
