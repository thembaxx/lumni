# Plan 013: Add tests for enrichment pipeline

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
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The enrichment pipeline orchestrates 3 data sources (curriculum, embeddings, past papers) with fallback chains and branching logic (pastPaperMode, similarity thresholds). It feeds the question generation path — the content quality depends on what examples the AI sees. Zero test coverage means a regression in example selection directly affects question quality.

## Current state

**`src/lib/question-engine/enrichment-pipeline.ts`**: 274 lines. `createEnrichmentPipeline()` returns an `enrich()` method. Uses `__setDepsForTesting()` for DI. Three sources: `createCurriculumSource()`, `createEmbeddingSource(db)`, `createPastPaperSource()`.

**Test convention**: Tests in `__tests__/` subdirectories. InMemoryDataAccess for DB mocking. Mock external APIs (`fetch`, `embedText`, `findTopK`).

## Commands you will need

| Purpose   | Command                                                                         | Expected on success |
| --------- | ------------------------------------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                                              | exit 0, no errors   |
| Lint      | `npx biome check src/lib/question-engine/__tests__/enrichment-pipeline.test.ts` | 0 errors            |
| Tests     | `bun run test -- enrichment-pipeline`                                           | all new tests pass  |

## Scope

**In scope**:

- `src/lib/question-engine/__tests__/enrichment-pipeline.test.ts` (create)

**Out of scope**:

- `src/lib/question-engine/enrichment-pipeline.ts` — do not modify
- `src/lib/embedding/` — do not modify

## Git workflow

- Branch: `advisor/013-enrichment-tests`
- Commit: `test: add test coverage for enrichment pipeline`

## Steps

### Step 1: Read the full source

Read `src/lib/question-engine/enrichment-pipeline.ts` fully. Identify:

- `_deps` interface and `__setDepsForTesting()`
- `createCurriculumSource()` — likely fetches from Appwrite or static data
- `createEmbeddingSource(db)` — calls `embedText`, `findTopK`, reads `questionEmbeddings` table
- `createPastPaperSource()` — may call external API or read from Dexie
- The `enrich()` method logic: curriculum context → embedding results → past paper fallback

### Step 2: Create the test file

Create `src/lib/question-engine/__tests__/enrichment-pipeline.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { createEnrichmentPipeline } from "../enrichment-pipeline";
import { __setDepsForTesting } from "../enrichment-pipeline";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";

// Mock external modules
vi.mock("@/lib/embedding/client", () => ({
  embedText: vi.fn(),
}));

vi.mock("@/lib/embedding/similarity", () => ({
  findTopK: vi.fn(),
}));

describe("enrichment pipeline", () => {
  let db: InMemoryDataAccess;

  beforeEach(() => {
    db = new InMemoryDataAccess();
    __setDepsForTesting({ db });
    vi.clearAllMocks();
  });

  test("merges curriculum context when topic provided", async () => {
    // ...
  });

  test("populates poolQuestions when similarity > 0.8", async () => {
    // ...
  });

  test("uses embedding examples in 0.5-0.8 range", async () => {
    // ...
  });

  test("falls back to API when embedding examples empty", async () => {
    // ...
  });

  test("uses adaptive selection in pastPaperMode", async () => {
    // ...
  });

  test("returns params unchanged when all sources empty", async () => {
    // ...
  });
});
```

### Step 3: Implement each test

The mocking strategy depends on how each source fetches data:

- `createCurriculumSource` may import Appwrite dynamically — mock the dynamic import
- `createEmbeddingSource` calls `embedText` and `findTopK` — mock these
- `createPastPaperSource` may call `fetch` for past paper examples — mock global fetch

### Step 4: Run the tests

```bash
bun run test -- enrichment-pipeline
```

## Test plan

- 6-8 test cases covering:
  - Curriculum context merging
  - Pool questions from embeddings (high similarity)
  - Past paper examples from embeddings (medium similarity)
  - API fallback when embeddings empty
  - PastPaperMode branching
  - Empty state handling

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/question-engine/__tests__/enrichment-pipeline.test.ts` exits 0
- [ ] `bun run test -- enrichment-pipeline` exits 0 with 6+ passing tests
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `__setDepsForTesting` is not exported from `enrichment-pipeline.ts`.
- The source implementations are too tightly coupled to mock (e.g., no DI seam).
- More than 3 tests fail after reasonable mock fixes.

## Maintenance notes

- The embedding similarity thresholds (0.8, 0.5) are load-bearing — tests should document these boundaries.
- If the pipeline adds a 4th source, add corresponding tests.
