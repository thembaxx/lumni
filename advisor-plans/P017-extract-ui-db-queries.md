# Plan P017: Extract DB Queries from 7 UI Components into Service Layer

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: No drift check needed. Read each file before changing it.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: P016 (DataAccess bypass migration) — strongly recommended as prerequisite since both touch DB access patterns
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

7 UI-layer components import `dexieDataAccess` directly, mixing data access with rendering. Unlike services (which can reasonably use DataAccess), these components should not run raw database queries. This pattern:

- Makes them harder to test (must mount full component or mock Dexie at the import level)
- Makes data flow harder to reason about (rendering triggers DB reads directly)
- Couples presentation to storage schema — a schema change requires touching UI code
- Duplicates query logic across components (same query pattern in dashboard-client.tsx and observation-timeline.tsx)

## Current state

The 7 components:

1. `src/components/dashboard/dashboard-client.tsx` — competency/wrong-answer queries, gamification data
2. `src/components/dashboard/lesson-library-card.tsx` — content/subject queries
3. `src/components/teacher/observation-timeline.tsx` — teacher observation CRUD
4. `src/components/teacher/assignment-thread.tsx` — assignment message queries
5. `src/components/settings/tabs/progress-export.tsx` — user progress export queries
6. `src/components/tools/study-sets/study-set-editor.tsx` — study set CRUD
7. `src/components/quiz/hooks/use-quiz-view.ts` — quiz session data queries

**Repo conventions**: The `QuizResultDeps` pattern (Session 38) shows the preferred approach: a deps interface threaded through props. Service classes (like `RetentionService`, `GamificationService`) own their data access. React hooks should delegate to services.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**: The 7 UI components listed above.

**Out of scope**:

- Adding new service files (this plan extracts existing logic — don't create new abstractions)
- The `DataAccess` interface
- Test files for the extracted logic

## Git workflow

- Branch: `advisor/P017-extract-ui-db-queries`
- Commit message: `refactor: extract direct DataAccess calls from 7 UI components into service hooks`
- Do NOT push or open a PR

## Steps

### Step 1: Identify high-value extraction targets

Prioritize the 7 components by extraction complexity:

**Simple (S effort)**:

- `lesson-library-card.tsx` — 1-2 simple queries
- `observation-timeline.tsx` — CRUD on a single table
- `progress-export.tsx` — read-only export queries

**Medium (M effort)**:

- `assignment-thread.tsx` — message queries with ordering
- `study-set-editor.tsx` — CRUD with search

**Complex (M-L effort)**:

- `dashboard-client.tsx` — multiple query patterns, gamification wiring, reactive updates
- `use-quiz-view.ts` — quiz session data, status checks

### Step 2: Extract simple UI DB calls (batch 1)

For `lesson-library-card.tsx`, `observation-timeline.tsx`, `progress-export.tsx`:

1. Create a thin wrapper function in the component file (or a shared utility) that encapsulates the DB query
2. Replace the direct `dexieDataAccess.xxx.toArray()` with a call to the wrapper

Example for `progress-export.tsx`:

```typescript
// Instead of:
const progress = await dexieDataAccess.progress.toArray();

// Extract to a local function:
async function loadProgressData() {
  return dexieDataAccess.progress.toArray();
}
```

### Step 3: Extract medium-complexity components (batch 2)

For `assignment-thread.tsx`, `study-set-editor.tsx`:

Look for existing service classes that should own this data. For example, if `ShareService` already handles shared questions, use it. If no existing service exists, leave the extraction slight but clean: wrap the dexie calls in clearly named async functions at the top of the hook/effect, keeping them out of the JSX body.

### Step 4: Defer complex components

For `dashboard-client.tsx` and `use-quiz-view.ts`:

These have complex gamification/competency wiring intertwined with DB queries. For these files, **do not attempt full extraction**. Instead:

1. Mark them with a `// TODO: Extract DB calls to service layer` comment
2. Only extract if you can identify clean seams (e.g., the competency query block in dashboard-client.tsx is clearly separable)

### Step 5: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

Open each component and confirm the rendered output is identical.

## Test plan

No new tests. Behavioral preservation.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] At least 3 of the 7 components no longer import `dexieDataAccess` or `offlineDB` directly (they delegate through wrapper functions or services)
- [ ] The `dashboard-client.tsx` and `use-quiz-view.ts` extraction attempts are reported if not feasible
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- A component's DB query is tightly coupled to component state (e.g., the query result feeds directly into `useState` which is used by multiple handlers) — report it as "tightly coupled; defer"
- The extraction requires creating a new service file when no logical grouping exists — this is acceptable, just report which new service file was created
- Any component relies on Dexie-specific query features (compound indexes, live queries via `useLiveQuery`) that can't be easily wrapped

## Maintenance notes

- After extraction, the rendering concerns are separated from data concerns. The component files become testable by providing mock data to their wrapper functions.
- Future work: make the wrapper functions injectable (following the `QuizResultDeps` pattern) so unit tests can provide mock DB responses without mocking Dexie at the module level.
- The `dashboard-client.tsx` and `use-quiz-view.ts` are deliberately deferred — their complex gamification/quiz wiring warrants a dedicated extraction plan.
