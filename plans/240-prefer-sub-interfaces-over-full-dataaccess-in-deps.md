# Plan 240: Prefer sub-interfaces over full DataAccess in \_deps patterns

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / dependency-graph
- **Generated at**: 2026-07-17

## Why this matters

Several "`_deps`-style" consumers (module-level `let _deps` or function parameter `deps`) accept the full `DataAccess` interface (34 tables) when they only use 1-3 tables. This over-declares the dependency contract, making the function harder to test (need to mock 34 tables instead of 2) and obscuring which data the module actually needs.

## Current state

File-by-file audit reveals sub-interface opportunities:

| File                                      | Current type                  | Tables used                                                                     | Suggested sub-interface            |
| ----------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- |
| `src/lib/ai/chat-context.ts`              | `SyncDataAccess`              | `wrongAnswers`                                                                  | N/A — already narrow               |
| `src/lib/bolt/resolve-weakest.ts`         | `CompetencyDataAccess`        | `competencies`                                                                  | N/A — already narrow               |
| `src/lib/integration/service.ts`          | `IntegrationDb` (= 3 tables)  | `pastPaperQuestions`, `flashcards`                                              | N/A — already custom               |
| `src/lib/observability/events.ts`         | `EventDb` (= 3 tables)        | `analyticsEvents`                                                               | N/A — already custom               |
| `src/lib/orchestrator/handlers/domain.ts` | `DomainDb` (= 4 tables)       | `questions`, `deprecatedQuestions`, `questionEmbeddings`                        | N/A — already custom               |
| `src/lib/retention-loop/next-action.ts`   | `NextActionDb` (= 3 tables)   | `flashcards`, `retentionRecurrence`, `competencies`, `subjects`, `quizAttempts` | Wide enough to justify custom type |
| `src/lib/sync/sync-handler.ts`            | `SyncHandlerDb` (= 10 tables) | 10 tables                                                                       | Full `DataAccess` justified        |
| `src/lib/dictionary/service.ts`           | `DictionaryDataAccess`        | `dictionaryCache`                                                               | N/A — already custom               |
| `src/lib/vocabulary/service.ts`           | `VocabularyDataAccess`        | `vocabularyList`                                                                | N/A — already custom               |

**Finding**: The `_deps` patterns are already reasonably narrow (custom types per module). The main remaining opportunities are in consumer hooks and route handlers that accept full `DataAccess` but should use sub-interfaces:

- `src/store/exam-session.ts` — imports `SyncDataAccess` but only uses `examSessions` → should use narrower type
- `src/app/api/exam-papers/[id]/extract/route.ts` — accepts full `DataAccess` but only uses `pastPaperQuestions` + `subjects` → should use `LegacyDataAccess`

## Target state

Route handlers and store files that accept full `DataAccess` switch to the narrowest available sub-interface. This makes their dependencies explicit and reduces mock surface in tests.

## Scope

- Audit all non-`_deps` consumers that accept `DataAccess` as a type but only use 1-2 tables
- Switch to sub-interface where narrower option exists
- Do NOT change any `_deps` module's custom type (already narrow)
- Update any affected test files

## Steps

### 1. Audit non-\_deps consumers

Read files that import `DataAccess` or `typeof dexieDataAccess` outside of `src/lib/`:

- `src/store/exam-session.ts` — accepts `SyncDataAccess`, uses only `examSessions`
- `src/app/api/exam-papers/[id]/extract/route.ts` — uses `legacyDataAccess` type already, verify
- API route handlers that use `createRouteHandler` with `DataAccess`

### 2. Narrow identified consumers

For each consumer, replace the full interface with the sub-interface. Example:

```ts
// Before
import { dexieDataAccess, type SyncDataAccess } from "@/lib/db";
// After
import { dexieDataAccess, type StudyDataAccess } from "@/lib/db"; // or a narrower custom type
```

### 3. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm run test` — no regressions

Verification: `pnpm run typecheck ; pnpm run test`

## Stop conditions

- A consumer uses tables from 3+ sub-interfaces — keep it on the current interface
- Narrowing to a sub-interface breaks a mock that implements the full interface — update the mock

## Estimated time

20 minutes
