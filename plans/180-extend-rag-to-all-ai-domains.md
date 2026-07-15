# Plan 180: Extend RAG Pipeline to Flashcards, Study Guides, Stories, and Dictionary

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/flashcard-engine/ src/lib/study-guide/ src/lib/stories/ src/lib/dictionary/ src/lib/tinyfish/ src/lib/ai/cached-ai-generator.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The TinyFish RAG pipeline (web-grounded AI with CAPS/DBE sources) only powers quiz generation and the solve flow. Flashcards, study guides, stories, and dictionary — all AI-generated content — are produced without curriculum grounding. For SA-specific content, this means potential hallucination or cultural irrelevance. The `CachedAIGenerator<T>` pattern and `buildPromptInstruction()` helper already exist, making this cheap to extend.

## Current state

- `src/lib/tinyfish/` — `searchWithRAG()`, `buildRagContext()`, `buildPromptInstruction()` ready
- `src/lib/ai/cached-ai-generator.ts` — `CachedAIGenerator<T>` pattern for fetch→AI→cache
- `src/lib/question-engine/rag-enricher.ts` — shows the RAG injection pattern (3s timeout, try/catch fail-open)
- `src/lib/knowledge-graph/service.ts:66-88` — shows RAG-grounded AI for knowledge graphs (three-tier fallback)

The 4 target domains have zero RAG usage:

- `src/lib/flashcard-engine/` — flashcard back-content generation
- `src/lib/study-guide/` — study guide content generation
- `src/lib/stories/` — story content and comprehension questions
- `src/lib/dictionary/` — dictionary definitions

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- RAG injection points in the 4 target domains

**Out of scope**:

- The RAG pipeline itself (it's already correct)
- The knowledge graph (already wired)
- Quiz generation and solve (already wired)

## Steps

### Step 1: Add RAG to flashcard back-content generation

Find where flashcards generate AI content (likely in `src/lib/flashcard-engine/` or a `flashcard-generator.ts`). Before the AI call, fetch RAG context:

```typescript
import { searchWithRAG } from "@/lib/tinyfish";
import { buildRagContext } from "@/lib/tinyfish";

const ragContext = await searchWithRAG(subject, topic).catch(() => null);
const userPrompt = ragContext?.xml ? `${ragContext.xml}\n\n---\n\n${basePrompt}` : basePrompt;
```

### Step 2: Add RAG to study guide generation

In `src/lib/study-guide/service.ts` or wherever study guides are AI-generated, apply the same `<reference_material>` XML injection pattern before the AI prompt.

### Step 3: Add RAG to story generation

In `src/lib/stories/`, find the AI generation point for story content or comprehension questions. Apply the same pattern.

### Step 4: Add RAG to dictionary definition AI fallback

In `src/lib/dictionary/`, if there's an AI fallback for definitions (when Wiktionary API fails), add RAG grounding.

### Step 5: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests for each module should pass (the RAG injection is additive — it doesn't change the output shape). Add tests that verify RAG context is fetched when a subject/topic is available, following the pattern in `rag-enricher.test.ts`.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] RAG context is fetched and injected for flashcard generation
- [ ] RAG context is fetched and injected for study guide generation
- [ ] RAG context is fetched and injected for story generation
- [ ] RAG context is fetched and injected for dictionary AI fallback
- [ ] Existing behavior preserved when RAG fetch fails (fail-open)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the 4 domains doesn't use AI generation (if dictionary uses only Wiktionary API with no AI fallback, skip it)
- The `searchWithRAG` function signature has changed
- A domain's AI prompt structure can't accept prepended XML

## Maintenance notes

The `buildPromptInstruction()` helper (`src/lib/tinyfish/wrap.ts`) should be included in the system prompt for each domain. The `<reference_material>` block and instruction should mirror the pattern in `rag-enricher.ts`. Follow the fail-open pattern — if RAG is unavailable, generate without it.
