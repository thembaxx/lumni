# AI × Past Papers Adaptive Pool

**Date:** 2026-06-08
**Status:** Approved — Implemented
**Author:** Agent (Session 35–36)

## Problem

The quiz engine generates questions purely by AI prompt engineering. It retrieves past exam questions as few-shot examples via `retrievePastPaperExamples()` — but it cannot:

1. **Serve past exam questions directly** as quiz questions (when a pool question already matches the student's need)
2. **Deduplicate** AI-generated questions against previously-cached pool questions
3. **Semantically search** the pool by topic/intent rather than keyword-match

Result: students see repeated AI-generated questions, the AI wastes tokens on obvious re-generations, and the pool sits unused except as few-shot examples.

## Solution

**Approach 1 (selected)**: Dexie-hosted embedding vectors with in-memory cosine similarity. Embed each `PastPaperQuestion` once, store the 512-dim vector in a new `questionEmbeddings` Dexie table. At generation time, vector-search the pool, serve questions directly when similarity > 0.8, use as few-shot when 0.5–0.8, and dedup new generations against the pool at cosine > 0.85.

### Why not alternatives

| Approach                      | Rejected because                                              |
| ----------------------------- | ------------------------------------------------------------- |
| Appwrite vector search        | No vector index support in Appwrite free tier                 |
| Server-side pgvector          | No Postgres in the stack                                      |
| External vector DB (Pinecone) | Adds infra complexity, latency, and cost for <10K vectors     |
| WebWorker background search   | Overengineering for pool this small; main-thread sync is fine |

## Architecture

```
                  ┌─────────────────────────┐
                  │  Exam Paper Upload       │
                  │  (extract route)          │
                  └──────┬──────────────────┘
                         │ extractQuestionsFromPaper()
                         ▼
                  ┌─────────────────────────┐
                  │  PastPaperQuestion[]     │
                  │  + topic field (new)     │
                  └──────┬──────────────────┘
                         │ enqueue embedding job
                         ▼
                  ┌─────────────────────────┐
                  │  EmbeddingService        │
                  │  embedOne(text)          │
                  │  → Gemini REST API       │
                  │    gemini-embedding-exp  │
                  │    -03-07, 512 dims      │
                  └──────┬──────────────────┘
                         │ store in Dexie v33
                         ▼
                  ┌─────────────────────────┐
                  │  questionEmbeddings      │
                  │  { id, questionId,       │
                  │    vector: Float32Array, │
                  │    subject, updatedAt }  │
                  └──────┬──────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
  ┌──────────────────┐    ┌─────────────────────┐
  │  enrichParams()  │    │  Dedup (generate)    │
  │  → findTopK()    │    │  → findTopK() for    │
  │  similarity >0.8 │    │  new question text   │
  │  → serve direct  │    │  cosine > 0.85       │
  │  0.5-0.8 → few-  │    │  → regenerate        │
  │  shot in prompt  │    └─────────────────────┘
  └──────────────────┘
```

## Data Model

### Dexie v33 — `questionEmbeddings` table

```typescript
interface QuestionEmbedding {
  id: string; // `questionId` from PastPaperQuestion
  questionId: string; // same — primary key
  vector: Float32Array; // 512-dim embedding (stored as ArrayBuffer in IndexedDB)
  subject: string; // for filtered queries
  updatedAt: string; // ISO timestamp
}
```

Schema string: `"&id, subject, updatedAt"`

### `PastPaperQuestion` — `topic` field

The `topic` field already exists as optional on the type. The `question-extractor.ts` will be updated to populate it by extracting from the section title or paper metadata. The `questions/route.ts` topic filter will be changed from client-side `String.includes()` to server-side `Query.equal()`.

### New module — `src/lib/embedding/`

```
src/lib/embedding/
├── client.ts           # Gemini REST API call for embedding
├── similarity.ts       # cosineSimilarity(a, b), findTopK()
├── cache.ts            # Dexie CRUD for questionEmbeddings table
├── types.ts            # QuestionEmbedding, EmbeddingResult, FindTopKParams
├── index.ts            # barrel exports
```

## Embedding Provider

**Provider**: Gemini REST API (`gemini-embedding-exp-03-07`)
**Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${GEMINI_API_KEY}`
**Dimensions**: 512 (explicit parameter)
**Free tier**: 1500 reqs/day, 0.1 req/s — safe for our pool size
**API key**: Already in `.env.local` as `GEMINI_API_KEY`
**Cost tracking**: Already configured in `latency-tracker.ts` as `embed: 0.001¢` per call

### Request shape

```json
{
  "model": "models/gemini-embedding-exp-03-07",
  "content": { "parts": [{ "text": "question text here" }] },
  "outputDimensionality": 512
}
```

### Response shape

```json
{
  "embedding": {
    "values": [0.012, -0.034, ...]  // 512 floats
  }
}
```

### Why Gemini only

Nvidia NIM and Groq do not expose compatible text embedding endpoints. The provider chain is single-provider. If Gemini fails, the question is skipped for embedding (empty fallback — still available via keyword).

### Fallback strategy

When embedding generation fails (network, rate limit, API error):

- The `questions/route.ts` topic filter falls back to the existing client-side `String.includes()` behavior
- The `findTopK()` function returns `[]` (no semantic match → AI generation continues as before)
- The dedup check in `generate/route.ts` returns `false` (question passes as non-duplicate)

## Similarity Engine

**In-memory cosine similarity** on `Float32Array` vectors:

```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
```

**`findTopK(params: FindTopKParams): Promise<ScoredPoolQuestion[]>`**

1. Load all embeddings for `subject` from Dexie `questionEmbeddings`
2. Compute cosine similarity against query embedding
3. Sort by similarity descending, take top K
4. Hydrate full `PastPaperQuestion` data from `pastPaperQuestions` table
5. Return scored results

**Performance**: Pool <10K per subject. 10K × 512 floats × 4 bytes = ~20MB in memory. Main-thread sync computation takes <50ms on modern hardware. No WebWorker needed.

## Serving Strategy (enrichParams → findTopK)

The existing `enrichParams()` in `QuestionEngine` is enhanced:

```
Current: retrievePastPaperExamples() → linear keyword search → return top N
New:     findTopK() → if poolQuestions.length > 0:
           - build 3 tiers:
             - serveDirect: similarity > 0.8 → include as actual quiz questions
             - fewShot: 0.5–0.8 → include as prompt examples
             - ignore: < 0.5 → skip
           - adjust count: requested = count - serveDirect.length
           - fall through to AI generation for remaining
         else:
           - fall back to retrievePastPaperExamples() (existing)
```

### Enriched GenerationParams

```typescript
{
  ...existing,
  poolQuestions?: PastPaperQuestion[];   // serveDirect tier (sim > 0.8)
  pastPaperExamples?: [...];             // fewShot tier (0.5–0.8)
}
```

The `generate()` route handler needs to:

1. Accept `poolQuestions` in `GenerationParams`
2. When present, serve them first (no AI generation needed)
3. Adjust `count` for remaining AI-generated questions

## Dedup (generate route)

After AI generates a question, before returning:

```
1. Embed the new question text
2. findTopK(embedding, subject, k=1)
3. If best match cosine > 0.85 → mark as duplicate → regenerate
4. Max 3 retries per question
5. After 3 failures → omit question, mark partial delivery
```

This runs in the existing `execute` function of the `generate` route. The orchestrator's `generateQuestionSet` is the correct place because it already handles partial delivery.

## Schema Changes

### Dexie v33 (additive, no migration)

```typescript
this.version(33).stores({
  questionEmbeddings: "&id, subject, updatedAt",
});
```

All v32 tables remain unchanged.

### DataAccess sub-interface

New `EmbeddingDataAccess`:

```typescript
export interface EmbeddingDataAccess {
  questionEmbeddings: DataAccessTable<QuestionEmbedding, string>;
}
```

Added to composite `DataAccess`.

### Appwrite `past_paper_questions` collection

Add `topic` as a string attribute (size 255, optional). This enables server-side `Query.equal("topic", value)` filtering instead of the current client-side `String.includes()`.

## Test Plan

| Test file                                                   | Tests | What it covers                                                             |
| ----------------------------------------------------------- | ----- | -------------------------------------------------------------------------- |
| `src/lib/embedding/__tests__/client.test.ts`                | 2     | Raw request shape, error handling                                          |
| `src/lib/embedding/__tests__/similarity.test.ts`            | 4     | `cosineSimilarity` (identical, orthogonal, opposite, partial) + `findTopK` |
| `src/lib/embedding/__tests__/cache.test.ts`                 | 3     | CRUD via `questionEmbeddings` table in InMemoryDataAccess                  |
| `src/lib/question-engine/__tests__/adaptive-pool.test.ts`   | 3     | `findTopK` integration, enrichParams with pool, dedup flow                 |
| `src/app/api/exam-papers/__tests__/questions-route.test.ts` | 1     | Topic filter uses server-side Query.equal                                  |

## Integration Points

| File                                                 | Change                                              |
| ---------------------------------------------------- | --------------------------------------------------- |
| `src/lib/embedding/`                                 | New module (6 files)                                |
| `src/lib/db/schema.ts`                               | Dexie v33 + `questionEmbeddings` table              |
| `src/lib/db/data-access.ts`                          | Add `EmbeddingDataAccess` sub-interface             |
| `src/lib/db/dexie-data-access.ts`                    | Wire `questionEmbeddings` adapter                   |
| `src/lib/db/in-memory-data-access.ts`                | Wire `InMemoryTable<QuestionEmbedding, string>`     |
| `src/lib/db/index.ts`                                | Export `EmbeddingDataAccess`                        |
| `src/lib/db/ensure-schema.ts`                        | Add `past_paper_questions` topic attribute          |
| `src/lib/exam-paper-ingestion/question-extractor.ts` | Populate `topic` from `section.title`               |
| `src/app/api/exam-papers/[id]/extract/route.ts`      | Enqueue embedding generation job after extraction   |
| `src/app/api/exam-papers/questions/route.ts`         | Replace client-side topic filter with `Query.equal` |
| `src/lib/question-engine/question-engine.ts`         | Enhance `enrichParams()` with `findTopK()`          |
| `src/lib/question-engine/types.ts`                   | Add `poolQuestions` to `GenerationParams`           |
| `src/lib/orchestrator/index.ts`                      | Wire dedup after `generateQuestionSet`              |
| `src/app/api/engine/generate/route.ts`               | Add dedup check after AI generation                 |

## Rollout Plan

1. **Phase 1** (this session): Foundation + embedding module + Dexie schema + DataAccess wiring
2. **Phase 2** (this session): Topic population + server-side filter + embedding generation on extract
3. **Phase 3** (this session): findTopK + enrichParams enhancement + dedup + tests
4. **Phase 4** (future): Backfill embeddings for existing PastPaperQuestions via `npm run embed:backfill`

## Future Work (out of scope)

- **Progressive embedding backfill**: CLI script to embed all existing 5000+ pool questions
- **WebWorker offload**: If pool grows beyond 50K, move `findTopK` to a WebWorker
- **Cross-subject search**: Currently subject-scoped; future could search across related subjects
- **User-specific pruning**: Dedup against questions the user has already seen (requires `learnedQuestions` tracking)
