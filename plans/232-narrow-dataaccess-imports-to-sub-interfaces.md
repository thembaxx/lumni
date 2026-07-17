# Plan 232: Narrow DataAccess imports to sub-interfaces where full interface not needed

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / dependency-graph
- **Generated at**: 2026-07-17

## Why this matters

Several consumers import the full `DataAccess` interface (34 tables) when they only need a specific sub-interface with 1-2 tables. This over-declares the dependency contract, makes the dependency graph wider than necessary, and obscures what the consumer actually needs. Switching to sub-interfaces makes the coupling explicit and reduces recompilation surface.

## Current state

`src/lib/exam-paper-ingestion/curriculum-topics.ts`:

```ts
import type { DataAccess } from "@/lib/db/data-access";
```

Uses only `db.subjects` and `db.pastPaperQuestions` → should use `LegacyDataAccess`.

Other consumers with similar over-import patterns exist in API routes, hooks, and services.

## Target state

Every consumer that imports `DataAccess` or `typeof dexieDataAccess` but only uses a subset of tables switches to the appropriate sub-interface (`LegacyDataAccess`, `StudyDataAccess`, `QuizDataAccess`, `CompetencyDataAccess`, `FlashcardDataAccess`, etc.).

## Scope

- `src/lib/exam-paper-ingestion/curriculum-topics.ts` — switch from `DataAccess` to `LegacyDataAccess`
- Grep for `import.*DataAccess` across `src/` — find all over-import consumers
- Switch each to the narrowest sub-interface
- Do NOT change consumer behavior or add new tables to sub-interfaces

## Steps

### 1. Fix `curriculum-topics.ts`

- Change import: `import type { LegacyDataAccess } from "@/lib/db"` (not `DataAccess`)
- Update the variable/parameter type annotation
- Verify it still compiles (uses only `subjects` and `pastPaperQuestions`)

### 2. Audit other over-import consumers

Grep for `import.*\{.*DataAccess.*\} from.*@/lib/db` and `typeof dexieDataAccess` in non-db files. For each, check which tables are actually referenced and switch to the narrowest sub-interface:

| Consumer                                | Tables used                  | Sub-interface      |
| --------------------------------------- | ---------------------------- | ------------------ |
| `curriculum-topics.ts`                  | subjects, pastPaperQuestions | `LegacyDataAccess` |
| `api/exam-papers/[id]/extract/route.ts` | pastPaperQuestions           | `LegacyDataAccess` |
| (others to be discovered)               | —                            | —                  |

### 3. Verify

- `pnpm run typecheck` — 0 errors

Verification: `pnpm run typecheck ; pnpm exec oxlint`

## Stop conditions

- A consumer uses tables from 3+ sub-interfaces — keep it on the full `DataAccess` to avoid interface explosion
- Changing to a sub-interface breaks a mock in tests — update the mock to implement the narrower interface

## Estimated time

30 minutes
