# Plan 088: Wire essayDrafts Dexie table for cross-session essay persistence

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/hooks/use-essay-coaching.ts src/lib/db/schema.ts src/lib/db/data-access.ts src/lib/db/dexie-data-access.ts src/lib/db/in-memory-data-access.ts`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

The essay coaching hook (`useEssayCoaching`) manages essay drafts, revision history, and grader feedback — but it stores everything in local React state (`useState`). Page refresh loses all draft progress. The Dexie schema already includes `essayDrafts` (v43, `EssayDraftRecord` type), and the DataAccess interface + both adapters (Dexie, InMemory) have full accessors. But zero code writes to or reads from `essayDrafts` — confirmed by grep. This is a dead schema that must be maintained through every schema migration for zero user value.

Wiring it takes ~30 lines of changes and immediately turns essay coaching from a demo-oriented feature into one students can actually use across sessions.

## Current state

- `src/lib/db/schema.ts:333-343` — `EssayDraftRecord` type and v43 table definition:
  ```ts
  essayDrafts: "++id, questionId, userId, createdAt, updatedAt";
  ```
- `src/lib/db/data-access.ts` — `ContentDataAccess.essayDrafts: DataAccessTable<EssayDraftRecord, number>`
- `src/lib/db/dexie-data-access.ts` and `src/lib/db/in-memory-data-access.ts` — both implement the accessor
- `src/hooks/use-essay-coaching.ts` — full coaching hook using local `useState` for `{ drafts, currentDraft, revisionHistory, ... }`
- grep for `essayDrafts\.(add|put|bulkAdd|get|toArray|count|delete)` — zero matches

## STOP conditions

- The `EssayDraftRecord` type has changed incompatibly since v43 (read the current schema)
- `useEssayCoaching` is used in a context where async Dexie reads would cause a flash of empty state (it's behind a button click — acceptable)

## Commands you will need

| Purpose   | Command                           | Expected on success |
| --------- | --------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`              | exit 0, no errors   |
| Tests     | `pnpm run test -- essay-coaching` | all pass (create)   |
| Lint      | `pnpm exec biome check --write`   | exit 0              |

## Scope

**In scope**:

- `src/hooks/use-essay-coaching.ts` — add Dexie persistence layer:
  - Load drafts from `essayDrafts` on init (useEffect with async query)
  - Persist draft creation/update to `essayDrafts.put()`
  - Persist draft deletion to `essayDrafts.delete()`
  - Keep existing React state as a fast local cache (read from Dexie on mount, write to Dexie on mutation)
- Any test file for the updated hook

**Out of scope**:

- Conflict resolution (last-write-wins is fine for draft content)
- Offline queue for essay drafts
- Auto-save (debounced save is fine — exactly what `useEffect` + `setTimeout` provides)

## Steps

### Step 1: Read useEssayCoaching hook

Read `src/hooks/use-essay-coaching.ts` fully. Identify:

- State shape: `drafts`, `currentDraft`, `revisionHistory`, `feedback`
- Mutation functions: `createDraft`, `updateDraft`, `deleteDraft`, `submitForFeedback`
- Initialization: how drafts are loaded (currently empty array default)

### Step 2: Add Dexie load on init

Add a `useEffect` on mount that queries `essayDrafts.toArray()` and sets the `drafts` state:

```ts
import { dexieDataAccess } from "@/lib/db/dexie-data-access";

useEffect(() => {
  dexieDataAccess.essayDrafts
    .toArray()
    .then((loaded) => {
      setDrafts(loaded);
    })
    .catch(logError);
}, []);
```

### Step 3: Add Dexie save on draft mutations

In `createDraft`: after setting state, call `essayDrafts.add(newDraft)`.

In `updateDraft`: after setting state, call `essayDrafts.put(updatedDraft)`.

In `deleteDraft`: after setting state, call `essayDrafts.delete(draftId)`.

Keep all `.catch(logError)` — Dexie write failures should never block the UI.

### Step 4: Wire revision history

If `revisionHistory` is tracked per draft, persist it as part of the `EssayDraftRecord` object (it already has `revisions?: EssayRevision[]` in the type). The same `put()` call saves revisions.

### Step 5: Run typecheck + tests

Run `pnpm run typecheck` — 0 errors. Run `pnpm run test` — all pass. If no test file exists for the hook, add basic tests (create draft → verify it's in Dexie, reload → verify it loads).

## Verification

1. Open essay coaching, write a draft — page refresh — draft persists
2. Edit draft — refresh — edits persist
3. Delete draft — refresh — draft is gone
4. Two drafts created in separate sessions both appear in the draft list
