---
status: TODO
priority: P2
effort: M
risk: MED
confidence: MED
created: 2026-07-12
commit: 4fcd46a4
---

# 177 — Repository singletons bypass the DataAccess seam

## Context

Session 23/33 established the `DataAccess` seam (DI via `dexieDataAccess`), but several repository classes still instantiate module-level singletons hard-bound to `dexieDataAccess` and are consumed directly in hooks, partially defeating DI and complicating test backing-store swaps.

## Current state (verified)

`src/lib/db/repositories/exam-session.ts:1,55`

```ts
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
...
export const examSessionRepo = new ExamSessionRepository();
```

Same pattern in `pdf-cache.ts:46` (`pdfCacheRepo`), `question-cache.ts:42`, `progress.ts:44`, `conflicts.ts:34`. Consumed in `src/hooks/use-pdf-cache.ts`, `src/hooks/use-exam-session-persistence.ts`, etc.

## Goal

Make the repositories receive `DataAccess` via DI (constructor or a `__setDepsForTesting` seam) instead of importing `dexieDataAccess` at module load, consistent with `CompetencyService`/`FlashcardEngine` in Sessions 23/33.

## Steps

1. Read each repository (`exam-session.ts`, `pdf-cache.ts`, `question-cache.ts`, `progress.ts`, `conflicts.ts`) and its hook consumers.
2. For each repository class, accept `db: DataAccess = dexieDataAccess` via constructor (or a `setDb` seam) instead of importing `dexieDataAccess` directly:
   ```ts
   export class ExamSessionRepository {
     constructor(private db: DataAccess = dexieDataAccess) {}
     private get table() {
       return this.db.examSessions;
     }
   }
   ```
3. Update the exported singleton to `new ExamSessionRepository()` (still defaults to `dexieDataAccess` for production) and update hook consumers to optionally inject a test double in tests (or rely on the default).
4. Verify no other module imports `dexieDataAccess` from inside these repositories post-change (grep).
5. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/db/repositories/{exam-session,pdf-cache,question-cache,progress,conflicts}.ts` and their hook consumers.
- Out of scope: `DexieDataAccess`/`InMemoryDataAccess` implementations, `offlineDB` (already contained).

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/db/repositories src/hooks/use-pdf-cache src/hooks/use-exam-session-persistence` → pass.
- A test can inject `InMemoryDataAccess` into a repository and confirm it reads/writes there, not `dexieDataAccess`.

## Test plan

- Extend `src/lib/db/repositories/__tests__/*`: construct `new ExamSessionRepository(inMemoryDb)`, `save`/`get`, assert the record lands in `inMemoryDb.examSessions`. Mirror existing repo test patterns.

## Maintenance

- New repositories must take `DataAccess` via DI, not import `dexieDataAccess`. Keep the `DataAccess` seam intact.

## Escape hatches

- If a consumer constructs the repo at module scope and cannot easily inject, keep the default `dexieDataAccess` singleton but remove the internal import (constructor default). That alone restores testability. Do not break production by forcing injection everywhere.
