# Plan 060: AI × Past Papers Adaptive Pool — Full Integration

> **Executor instructions**: Design/spike plan. Investigate the existing pool
> infrastructure (enrichment pipeline, question extractor, embedding source),
> identify and close the gap between "infrastructure exists" and "default
> generation flow uses past papers," then verify with integration tests.
>
> **Drift check (run first)**: `git diff --stat 169d3704..HEAD -- src/lib/question-engine/enrichment-pipeline.ts src/lib/question-engine/question-engine.ts src/lib/exam-paper-ingestion/`
> If any in-scope file changed, compare excerpts before proceeding.

## Status

- **Priority**: P2
- **Effort**: M (3-4 days)
- **Risk**: LOW — additive enrichment path, existing generation flow unchanged
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `169d3704`, 2026-06-28

## Why this matters

AI-generated questions are good but generic. Questions grounded in real past exam papers are dramatically more relevant for NSC candidates — they match the actual exam format, difficulty distribution, and topic weighting. The infrastructure to ingest, embed, and retrieve past paper questions already exists in the enrichment pipeline. What's missing is making this the **default** generation path (not just an enrichment opt-in).

Currently the pool path (`poolQuestions`) is only activated when `enrich()` runs and the `EmbeddingSource` finds questions with similarity > 0.8. In practice this means: if no past papers have been ingested for a given topic, the pool is empty and the AI generates from scratch. This plan makes the pool the primary source and AI generation the fallback.

## Current state

- `src/lib/question-engine/enrichment-pipeline.ts` — `EmbeddingSource.fetchEmbeddingResults()` returns `poolQuestions` (similarity > 0.8) and `pastPaperExamples` (0.5-0.8). The `PastPaperSource` interface exists with `fetchPastPaperExamples()` calling `GET /api/exam-papers/questions`.
- `src/lib/question-engine/question-engine.ts` — `mapPoolToQuestion()` (extracted to standalone adapter by Plan 056, now DONE) converts `poolQuestions` into `Question[]`. These are used as direct questions when available, and as seed context for AI generation otherwise.
- `src/lib/exam-paper-ingestion/question-extractor.ts` — `extractQuestionsFromPaper()` parses past paper PDFs into `PastPaperQuestion[]`.
- `POST /api/exam-papers/extract` and questions ingestion routes exist.
- The pool is NOT wired into the default quiz flow — it only activates through the enrichment pipeline, which requires explicit `enrich()` calls (currently used by `QuestionEngine.generate()` but only when `EnrichmentPipeline` is configured in the constructor).

## Commands you will need

| Purpose   | Command                                        | Expected on success |
| --------- | ---------------------------------------------- | ------------------- |
| Install   | `pnpm install`                                 | exit 0              |
| Typecheck | `pnpm run typecheck`                           | exit 0, no errors   |
| Tests     | `pnpm run test -- enrichment\|question-engine` | all pass            |
| Lint      | `pnpm exec oxlint`                             | exit 0              |

## Scope

**In scope**:

- `src/lib/question-engine/question-engine.ts` — make pool the primary generation path (use `poolQuestions` directly when similarity > 0.8, fall back to AI generation only when pool is empty)
- `src/lib/question-engine/enrichment-pipeline.ts` — tune similarity thresholds per subject domain (Math may need higher threshold than History)
- `src/lib/exam-paper-ingestion/` — add a backfill script to process all existing past papers through the embedding pipeline
- `src/app/api/engine/generate/route.ts` — add a `pastPaperMode` query param that forces pool-only generation
- `src/components/quiz/` — add a "Past Paper Questions" toggle to the quiz configuration UI
- Tests for the pool-as-primary flow

**Out of scope**:

- OCR for scanned PDF past papers (only works with already-parsed digital papers)
- Real-time past paper question generation (AI-generated questions based on past paper structure, separate feature)
- The `mapPoolToQuestion` adapter itself (Plan 056 already extracted it)

## Steps

### Step 1: Audit existing pool coverage

Count how many past paper questions have been ingested and embedded:

1. Check `PastPaperQuestion` store in Dexie or Appwrite — how many questions exist?
2. Run the embedding backfill: `pnpm run embed:backfill` (script at `scripts/embed-backfill.ts`)

**Verify**: Document the count of embedded questions per subject. If < 100 questions exist, the pool won't be useful yet — the plan must include an ingestion step.

### Step 2: Make poolQuestions the primary generation path

In `src/lib/question-engine/question-engine.ts`, modify the generation flow:

```typescript
async generateInternal(params: GenerationParams): Promise<GenerateResult> {
  // 1. If enrichment pipeline is configured, run it
  const enriched = this.enrichmentPipeline
    ? await this.enrichmentPipeline.enrich(params)
    : params;

  const { poolQuestions = [], pastPaperExamples = [] } = enriched;

  // 2. NEW: If pool has enough questions, use them directly instead of AI generation
  if (poolQuestions.length >= (params.count ?? 1)) {
    const questions = poolQuestions
      .slice(0, params.count)
      .map(mapPoolToQuestion);
    return { questions, ragContext: this.lastRagContext };
  }

  // 3. Existing AI generation flow, now seeded with poolQuestions + pastPaperExamples
  // (existing code continues here...)
}
```

The threshold `poolQuestions.length >= params.count` means: if we have enough high-similarity past paper questions to fill the quiz, skip AI entirely. Otherwise, seed AI with what we have and generate the rest.

**Verify**: `pnpm run test -- question-engine` → all existing tests pass with new logic

### Step 3: Tune similarity thresholds per subject cluster

In `enrichment-pipeline.ts`, replace the hardcoded 0.8/0.5 thresholds with a configurable map:

```typescript
const SIMILARITY_THRESHOLDS: Record<string, { pool: number; example: number }> = {
  default: { pool: 0.8, example: 0.5 },
  mathematics: { pool: 0.85, example: 0.6 }, // Math questions are formulaic — higher bar
  "physical-sciences": { pool: 0.85, example: 0.6 },
  history: { pool: 0.7, example: 0.4 }, // History answers are prose — more tolerance
  geography: { pool: 0.75, example: 0.45 },
  "life-sciences": { pool: 0.8, example: 0.5 },
  accounting: { pool: 0.85, example: 0.6 },
};

function getThresholds(subject: string) {
  return SIMILARITY_THRESHOLDS[subject] ?? SIMILARITY_THRESHOLDS.default;
}
```

These are starting values — the executor should pick 2-3 subjects with known question formats and propose reasonable thresholds based on the existing similarity scoring logic in `selectAdaptiveQuestions()`.

**Verify**: `pnpm run test -- enrichment` → all tests pass with new configurable thresholds

### Step 4: Add backfill ingestion for existing past papers

Create or update `scripts/embed-backfill.ts` to process all past papers that haven't been embedded yet:

```typescript
// Pseudocode
const papers = await getPapersWithoutEmbeddings();
for (const paper of papers) {
  const questions = extractQuestionsFromPaper(
    paper,
    null,
    paper.subject,
    paper.year,
    paper.paperNumber,
  );
  for (const q of questions) {
    const embedding = await embedText(q.questionText);
    await storeEmbedding(q.id, embedding, q);
  }
}
```

**Verify**: `pnpm run embed:backfill` → processes N questions, exit 0

### Step 5: Add `pastPaperMode` query parameter to API

In `src/app/api/engine/generate/route.ts`, add a `pastPaperMode` boolean to `GenerationParams`. When true:

- Only return pool questions (no AI generation)
- If pool has < `count` questions, return what's available with a `notice` field

```typescript
const generationParams: GenerationParams = {
  ...body,
  ...(body.pastPaperMode ? { poolOnly: true } : {}),
};
```

In `question-engine.ts`, when `poolOnly` is set:

```typescript
if (params.poolOnly) {
  return { questions: poolQuestions.slice(0, params.count).map(mapPoolToQuestion), ragContext };
}
```

**Verify**: `POST /api/engine/generate` with `{ pastPaperMode: true }` returns only pool questions

### Step 6: Add UI toggle to quiz configuration

In the quiz configuration UI (likely in `QuizView` or a quiz setup dialog), add a toggle:

- "Use past paper questions" — when enabled, sets `pastPaperMode=true` in the generate call
- When pool questions are insufficient, show a notice: "Only N past paper questions found for this topic. Supplementing with AI-generated questions."

**Verify**: Toggle appears in quiz setup, selecting it changes the generate call parameters

### Step 7: Write tests

Create `src/lib/question-engine/__tests__/adaptive-pool.test.ts`:

- Pool with enough questions → returns pool questions only, no AI call
- Pool with insufficient questions → returns pool questions + supplements with AI
- `pastPaperMode=true` and pool empty → returns empty `questions` with `notice`
- Similarity thresholds per subject — Math uses higher threshold than History
- Backfill script doesn't reprocess already-embedded questions

**Verify**: `pnpm run test -- adaptive-pool` → all tests pass

## Test plan

- `src/lib/question-engine/__tests__/adaptive-pool.test.ts` — 5-6 tests:
  - Pool-as-primary: returns pool-only questions when count met
  - Pool supplement: returns pool + AI-generated when pool insufficient
  - `pastPaperMode`: pool-only mode returns notice when empty
  - Subject-specific thresholds: Math requires higher similarity
  - Backfill idempotency: already-embedded questions are skipped

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test -- adaptive-pool\|enrichment\|question-engine` all pass
- [ ] Pool questions are used as primary source when available (no AI call)
- [ ] `pastPaperMode` param works on the generate API
- [ ] Backfill script processes all unembedded past papers
- [ ] Quiz UI has "Use past paper questions" toggle
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `mapPoolToQuestion` adapter is not importable from `@/lib/question-engine/pool-adapter` — check Plan 056 was completed and the export exists
- If fewer than 50 past paper questions exist across all subjects — the pool won't be useful; document and stop
- If `embedText()` or `storeEmbedding()` functions don't exist — the embedding infrastructure may be incomplete

## Maintenance notes

- The similarity threshold map should eventually be data-driven (per-subject analytics on pool question quality), not hardcoded.
- When the pool grows to thousands of questions per subject, consider adding a diversity filter (don't return 5 questions from the same year's paper).
- The backfill script should be added to CI or a cron job to run periodically as new past papers are ingested.
- Monitor the pool hit rate: if >90% of quizzes are pool-only, the AI budget savings are substantial.
