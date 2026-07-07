# Plan 124: Add compound index to vocabulary service for single-record lookups

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/vocabulary/ src/lib/db/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

Every vocabulary operation (save, remove, check, list) loads the user's entire vocabulary list via `.toArray()` then runs `.find()` or `.filter()` in JS. A user with 200 entries triggers a full-table read plus 200 comparisons for what is semantically a key lookup.

## Current state

`src/lib/vocabulary/service.ts:25-26`:

```ts
const all = await _deps.db.vocabularyList.where("userId").equals(userId).toArray();
const existing = all.find((e) => e.word === word.toLowerCase());
```

Same pattern at lines 62, 76, 91. The Dexie schema is at `src/lib/db/schema.ts`.

## Commands you will need

| Purpose   | Command                       | Expected on success |
| --------- | ----------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`          | exit 0, no errors   |
| Tests     | `pnpm run test -- vocabulary` | all pass            |

## Steps

### Step 1: Add compound index to Dexie schema

In `src/lib/db/schema.ts`, find the `vocabularyList` table definition and add a compound index `[userId+word]`. This requires a Dexie version bump.

Check the current Dexie version and add a new migration that adds the compound index to `vocabularyList`.

**Verify**: `pnpm run typecheck` → exit 0

### Step 2: Update vocabulary service queries

Replace `.where("userId").equals(userId).toArray()` + `.find()` with `.where("[userId+word]").equals([userId, word]).first()` where looking up a single word.

For `getSavedWords` (returns all), keep the `.where("userId").equals(userId).toArray()` since it needs the full list.

For `removeWord` and `isWordSaved`, use the compound index.

**Verify**: `pnpm exec oxlint src/lib/vocabulary/service.ts` → 0 errors

### Step 3: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] Compound index `[userId+word]` added to vocabularyList table
- [ ] Single-record lookups use compound index instead of `.toArray()` + `.find()`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The Dexie version bump conflicts with an in-flight migration
- The compound index changes the table structure in a way that breaks existing data
