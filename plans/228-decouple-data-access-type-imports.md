# Plan 228: Decouple data-access.ts from 15+ domain modules — extract type definitions locally

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: tech-debt / dependency-graph
- **Generated at**: 2026-07-17

## Why this matters

`src/lib/db/data-access.ts` imports types from 15+ domain modules (`@/hooks/use-wrong-answer-journal`, `@/lib/competency-engine/types`, `@/lib/flashcard-engine/types`, `@/lib/gamification-engine/types`, `@/lib/knowledge-graph/types`, `@/lib/orchestrator/types`, `@/lib/quiz-packs/types`, `@/lib/stories/types`, `@/lib/study-guide/types`, `@/lib/tinyfish/cache`, `@/lib/webhooks/types`, `@/lib/dictionary/types`, `@/lib/embedding/types`, `@/lib/exam-paper-ingestion/past-paper-question-types`, `@/lib/lesson/types`, `@/types/user-consent`). This creates a reverse dependency graph: changing any of these domain-level type files forces recompilation of the entire db layer and anything depending on it. It also creates import cycles in some cases.

## Current state

`src/lib/db/data-access.ts:1-58`:

```ts
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { FlashcardReview, FlashcardSM2 } from "@/lib/flashcard-engine/types";
import type { StoredGamification } from "@/lib/gamification-engine/types";
import type { CachedGraph } from "@/lib/knowledge-graph/types";
// ... 15+ more type imports from domain modules
```

Most of these types are simple data shapes used in Dexie table definitions. They don't need to live in their respective domain modules from the data-access layer's perspective.

## Target state

- Domain-type-only interfaces (data shapes for Dexie rows) moved into `src/lib/db/schema.ts`
- `data-access.ts` only imports from `schema.ts` and standard library types
- Domain modules re-export shared types from `schema.ts` if needed, removing the reverse dependency

## Scope

- `src/lib/db/data-access.ts` — remove type imports from domain modules
- `src/lib/db/schema.ts` — add any missing type definitions currently imported from domain modules
- Domain type files — optionally re-export from schema.ts instead of defining types locally
- `src/hooks/use-wrong-answer-journal.ts` — move `WrongAnswerEntry` to `schema.ts` and import it there
- Do NOT change any table accessor signatures
- Do NOT move logic, only type definitions

## Steps

### 1. Audit all type imports in data-access.ts

Each import at `src/lib/db/data-access.ts:1-58`:

- `WrongAnswerEntry` from `@/hooks/use-wrong-answer-journal` — this is a hook type, should move to schema
- `CompetencyRecord` from `@/lib/competency-engine/types` — check if defined there or re-exported
- `FlashcardReview`, `FlashcardSM2` from `@/lib/flashcard-engine/types` — check if needed as distinct types
- `StoredGamification` from `@/lib/gamification-engine/types` — data shape for Dexie
- `CachedGraph` from `@/lib/knowledge-graph/types`
- `JobRecord` from `@/lib/orchestrator/types`
- `QuizPack`, `QuizPackQuestion`, `QuizPackVisualAsset` from `@/lib/quiz-packs/types`
- `CachedStory`, `StoryQuestionSet` from `@/lib/stories/types`
- `CachedStudyGuide` from `@/lib/study-guide/types`
- `TinyFishCacheEntry`, `TinyFishUsageEntry` from `@/lib/tinyfish/cache`
- `WebhookDelivery`, `WebhookEndpoint` from `@/lib/webhooks/types`
- `DictionaryCacheEntry` from `@/lib/dictionary/types`
- `QuestionEmbedding` from `@/lib/embedding/types`
- `PastPaperQuestion` from `@/lib/exam-paper-ingestion/past-paper-question-types`
- `CachedLesson` from `@/lib/lesson/types`
- `UserConsent` from `@/types/user-consent`

### 2. Move type definitions to schema.ts

For each type:

- Copy the interface/type definition into `src/lib/db/schema.ts`
- If the domain module re-exports it, update the re-export to import from `@/lib/db/schema`
- If the domain module owns the type (e.g., `CompetencyRecord` is part of competency logic), define a `DbCompetencyRecord` alias in schema.ts instead

### 3. Update data-access.ts imports

Replace:

```ts
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
```

with:

```ts
import type { WrongAnswerEntry } from "@/lib/db/schema";
```

### 4. Verify no import cycles

- `pnpm run typecheck` must pass
- Run a cycle check: `pnpm exec oxlint` — ensure no circular dependency warnings appear

Verification: `pnpm run typecheck ; pnpm exec oxlint ; pnpm run test`

## Stop conditions

- Any type move creates a circular dependency — revert that type's move and use a schema-level alias instead
- The `WrongAnswerEntry` type references hooks or React types that can't be moved — keep it in schema as a plain interface

## Estimated time

3-4 hours
