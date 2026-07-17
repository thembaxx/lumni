# Plan 229: Migrate 22 hooks/components from direct dexieDataAccess to service wrappers

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / data-access-seam
- **Generated at**: 2026-07-17

## Why this matters

22 hooks and components import `dexieDataAccess` directly for CRUD operations, bypassing the domain services that exist for those tables. This couples UI code to the storage implementation, creates test difficulty (you need a mock Dexie to test a component), and duplicates query logic across consumers. The `DataAccess` interface exists precisely to avoid this — the migration is overdue.

## Current state

Direct `dexieDataAccess` imports found in hooks and components including:

- `use-gamification.ts` — calls `dexieDataAccess.gamification` directly
- `use-flashcard-session.ts` — calls `dexieDataAccess.flashcards` directly
- `use-note-storage.ts` — calls `dexieDataAccess.notes` directly
- `study-set-editor.tsx` — calls `dexieDataAccess.vocabularyList` directly
- `assignment-thread.tsx` — calls `dexieDataAccess.assignmentMessages` directly
- `observation-timeline.tsx` — calls `dexieDataAccess.teacherObservations` directly
- `gamification-wiring.ts` — calls `dexieDataAccess.retentionRecurrence` directly
- `reading-progress.ts` — calls `dexieDataAccess.storyProgress` directly
- Plus ~14 more across API routes, repositories, and components

## Target state

- Thin service wrappers exist for every Dexie table that doesn't have one
- All hooks and components import from service modules instead of `dexieDataAccess`
- Service wrappers use `DataAccess` interface, not `dexieDataAccess` directly
- Domain services become the single chokepoint for storage access

## Scope

- Audit all 22+ direct `dexieDataAccess` consumer sites
- Create missing service wrappers (e.g., `GamificationRepository`, `NoteService`, `StoryProgressService`)
- Migrate consumers to use services
- Do NOT refactor services that already exist — only create thin CRUD wrappers where missing

## Steps

### 1. Audit all direct consumers

Grep for `import.*dexieDataAccess` across `src/` excluding test files and db internals. Categorize by table:

| Table                 | Direct consumers                 | Existing service              |
| --------------------- | -------------------------------- | ----------------------------- |
| `gamification`        | use-gamification.ts              | GamificationService (partial) |
| `flashcards`          | use-flashcard-session.ts         | FlashcardEngine               |
| `notes`               | use-note-storage.ts              | None                          |
| `vocabularyList`      | study-set-editor.tsx             | None                          |
| `assignmentMessages`  | assignment-thread.tsx            | None                          |
| `teacherObservations` | observation-timeline.tsx         | None                          |
| `retentionRecurrence` | gamification-wiring.ts           | RetentionService              |
| `storyProgress`       | reading-progress.ts              | None                          |
| `examDates`           | scrape/route.ts, ingest/route.ts | ExamDatesService              |
| `examSessions`        | repositories/exam-session.ts     | None                          |
| `cachedPdfs`          | repositories/pdf-cache.ts        | None                          |
| `progress`            | repositories/progress.ts         | None                          |
| `quizSessions`        | repositories/quiz-session.ts     | None                          |

### 2. Create missing service wrappers

For each missing service (1 file per service, in `src/lib/services/` or co-located with the domain):

- `GamificationRepository` — thin wrapper around `gamification` table CRUD, used by GamificationService
- `NoteService` — CRUD for `notes` table
- `VocabularyRepository` — CRUD for `vocabularyList` table
- `AssignmentMessageRepository` — CRUD for `assignmentMessages` table
- `TeacherObservationRepository` — CRUD for `teacherObservations` table
- `StoryProgressService` — CRUD for `storyProgress` table

### 3. Migrate consumers

For each consumer, replace:

```ts
import { dexieDataAccess } from "@/lib/db";
await dexieDataAccess.notes.add(note);
```

with:

```ts
import { noteService } from "@/lib/services";
await noteService.add(note);
```

### 4. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm run test` — no regressions
- `pnpm exec oxlint` — 0 warnings

Verification: `pnpm run typecheck ; pnpm run test`

## Stop conditions

- A consumer needs transactional access across 2+ tables that services don't expose — stop and extend the service API rather than falling back to direct dexieDataAccess
- Test infrastructure relies on `dexieDataAccess` mock from a shared setup — update tests before proceeding

## Estimated time

4-5 hours
