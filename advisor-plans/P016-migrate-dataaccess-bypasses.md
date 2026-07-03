# Plan P016: Migrate 19 DataAccess Seam Bypasses to Typed Access

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: No drift check needed. Use grep to find current locations.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

The `DataAccess` seam (ADR-0011, Sessions 23-24) was created specifically to abstract all database access behind a typed interface with two implementations: `DexieDataAccess` (production) and `InMemoryDataAccess` (tests). 19 consumer files bypass this by importing `offlineDB` directly from `@/lib/db/schema`. Every bypass:

- Can't be mocked in tests
- Can't use the swap-to-InMemory pattern in test setup
- Couples the consumer to Dexie internals
- Compound `where({...})` calls won't compile under the DataAccess interface

## Current state

The 19 bypass files (identified by grep for `from "@/lib/db/schema"` or `offlineDB` imports outside `DataAccess` implementations):

Key examples:

- `src/lib/share/share-service.ts` — imports `offlineDB` directly
- `src/lib/export/export-service.ts` — imports from schema
- `src/lib/vocabulary/service.ts` — direct schema import
- `src/lib/competitions/service.ts` — direct schema import
- `src/lib/db/settings-migrator.ts` — schema import
- `src/store/bookmarks.ts` — Zustand store, imports `offlineDB`
- `src/hooks/use-vocabulary.ts` — direct access
- `src/hooks/use-lesson-progress.ts` — direct access
- `src/hooks/use-exam-session-persistence.ts` — direct access
- `src/hooks/use-referral.ts` — direct access
- `src/hooks/use-note-storage.ts` — direct access
- `src/hooks/use-quiz-view.ts` — direct access
- `src/components/dashboard/dashboard-client.tsx` — direct access
- `src/components/dashboard/lesson-library-card.tsx` — direct access
- `src/components/teacher/observation-timeline.tsx` — direct access
- `src/components/teacher/assignment-thread.tsx` — direct access
- `src/components/settings/tabs/progress-export.tsx` — direct access
- `src/components/tools/study-sets/study-set-editor.tsx` — direct access
- `src/components/quiz/hooks/quiz-utils.ts` — direct access

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**: All 19 files listed above.

**Out of scope**:

- The `DataAccess` interface itself (no changes)
- `DexieDataAccess` and `InMemoryDataAccess` implementations
- Adding test files

## Git workflow

- Branch: `advisor/P016-dataaccess-bypasses`
- Commit message: `refactor: migrate 19 DataAccess bypass consumers to typed interface`
- Do NOT push or open a PR

## Steps

### Step 1: Categorize the bypasses

Each bypass falls into one of three categories:

1. **Class with DI** — the file is a service class that accepts dependencies (e.g., `share-service.ts`). Add `DataAccess` to its constructor/deps.
2. **Standalone functions** — module-level functions. Either add a `dataAccess` parameter or use the `_deps` pattern with a dynamic import fallback.
3. **React hooks/components** — UI code. Use `dexieDataAccess` (the default instance from `@/lib/db/dexie-data-access`) since React components run only in the browser where Dexie is always available.

### Step 2: Fix class-based services

For `share-service.ts`, `export-service.ts`, `vocabulary/service.ts`, `competitions/service.ts`, `settings-migrator.ts`:

If the class already has a deps constructor:

```typescript
import type { DataAccess } from "@/lib/db";

constructor(private db: DataAccess) { /* existing */ }
```

Then replace all `offlineDB.table("xxx")` with `this.db.xxx` (using the correct sub-interface accessor).

If the class is created with `new Service()` elsewhere, update the call site:

```typescript
const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
const service = new Service(dexieDataAccess);
```

### Step 3: Fix Zustand stores

For `src/store/bookmarks.ts`:

Replace direct `offlineDB` imports with `dexieDataAccess`:

```typescript
import { dexieDataAccess } from "@/lib/db/dexie-data-access";

// Replace:
// const bookmarks = await offlineDB.table("bookmarks").toArray();
// With:
const bookmarks = await dexieDataAccess.bookmarks.toArray();
```

### Step 4: Fix hooks

For `use-vocabulary.ts`, `use-lesson-progress.ts`, `use-exam-session-persistence.ts`, `use-referral.ts`, `use-note-storage.ts`, `use-quiz-view.ts`:

Replace with `dexieDataAccess`:

```typescript
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
```

Some hooks may use compound queries (`where({...})`). These need to be rewritten:

```typescript
// Old:
const items = await offlineDB.table("vocabulary").where({ userId, lessonId }).toArray();

// New:
const items = await dexieDataAccess.vocabulary
  .where("userId")
  .equals(userId)
  .filter((v) => v.lessonId === lessonId)
  .toArray();
```

### Step 5: Fix UI components

For `dashboard-client.tsx`, `lesson-library-card.tsx`, `observation-timeline.tsx`, `assignment-thread.tsx`, `progress-export.tsx`, `study-set-editor.tsx`, `quiz-utils.ts`:

Same pattern as hooks — replace with `dexieDataAccess`.

### Step 6: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

No new tests. This is a mechanical migration — no behavioral change. Run the full test suite to confirm no regressions.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -rn 'from "@/lib/db/schema"' --include="*.ts" --include="*.tsx" src/ | grep -v "__tests__" | grep -v "src/lib/db/"` returns 0 or only non-bypass imports (DataAccess implementations themselves)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any file uses compound `where({field1, field2})` queries that can't be easily replaced with `DataAccess` chained API — stop and report the specific query
- The replacement causes import cycles (e.g., a service importing from `@/lib/db` that `dexie-data-access` also imports from)
- A Zustand store or hook accesses a Dexie table that doesn't have a corresponding `DataAccess` accessor — check `src/lib/db/data-access.ts` for the complete list of accessors; if missing, report and add the accessor first

## Maintenance notes

- After migration, future PRs should enforce: no `from "@/lib/db/schema"` imports outside DataAccess implementations
- The DataAccess sub-interfaces (FlashcardDataAccess, CompetencyDataAccess, etc.) should be used for narrower DI in services
- Compound queries (multi-field where) are intentionally excluded from DataAccess; they require explicit method definitions or filtering in application code
