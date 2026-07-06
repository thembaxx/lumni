# Plan 106: Seal offlineDB seam bypasses in offline-client.tsx

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7bb0d688..HEAD -- src/app/offline/offline-client.tsx`
> If this file changed since this plan was written, re-read the live file
> and adjust steps accordingly before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: architecture / maintainability
- **Planned at**: commit `7bb0d688`, 2026-07-06
- **Issue**: (omit unless published via `--issues`)

## Why this matters

The `offline-client.tsx` page component imports `offlineDB` directly from
`@/lib/db/schema` in 3 places, bypassing the `DataAccess` abstraction layer
that was introduced in Session 23-24. The DataAccess interface already
defines all the table accessors this component needs (`storyProgress`,
`quizPacks`, `storyCache` — in `StoryDataAccess` and `QuizDataAccess`).
Direct `offlineDB` imports defeat the purpose of the seam: they make the
component impossible to unit-test without a live Dexie instance, hard to
switch storage backends, and create a pattern that encourages future
bypasses.

The fix is straightforward: import `dexieDataAccess` from the barrel and
rewrite the 3 query expressions to use it. No behaviour change, no schema
modification.

## Current state

**`src/app/offline/offline-client.tsx`** has 3 direct `offlineDB` references:

1. **Line 20**: `import { offlineDB } from "@/lib/db/schema";`
2. **~Line 24**: `useLiveQuery(() => offlineDB.storyProgress...)` — reads last-read stories
3. **~Line 30**: `useLiveQuery(() => offlineDB.quizPacks...)` — reads ready quiz packs
4. **~Line 30-ish**: `useLiveQuery(() => offlineDB.storyCache...)` — reads cached stories by keys

The existing DataAccess interface at `src/lib/db/data-access.ts` has:

- `StoryDataAccess.storyProgress: DataAccessTable<StoryProgressRecord, number>` (line 157 of data-access.ts)
- `StoryDataAccess.storyCache: DataAccessTable<CachedStory, string>` (line 155)
- `QuizDataAccess.quizPacks: DataAccessTable<QuizPack, string>` (line 125)

The concrete instance `dexieDataAccess` is exported from `@/lib/db`
(barrel re-export).

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`      | exit 0, no errors   |
| Tests     | `pnpm run test`           | all pass            |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope**:

- `src/app/offline/offline-client.tsx` — replace `offlineDB` imports with `dexieDataAccess` and rewrite 3 query expressions

**Out of scope**:

- Any other file with `offlineDB` imports (other bypasses are tracked separately)
- Changing the Dexie schema or DataAccess interface
- Adding or removing any tests
- Changing component behaviour or rendering

## Git workflow

- Branch: `advisor/106-seal-offlinedb-bypass`
- Commit: `feat: seal offlineDB seam bypasses in offline-client.tsx`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Replace import

In `src/app/offline/offline-client.tsx`:

1. Remove the line `import { offlineDB } from "@/lib/db/schema";` (or wherever the direct import is).
2. At the top of the file, add `import { dexieDataAccess } from "@/lib/db";`

**Verify**:

```bash
pnpm run typecheck
# If errors, note which identifiers are now unresolvable.
# Expected: around 2-3 errors from `offlineDB.isOpen`, `offlineDB.storyProgress`, etc.
```

### Step 2: Rewrite each query expression

For each `offlineDB.tableName.xxx(...)` call, replace with
`dexieDataAccess.tableName.xxx(...)`. The DataAccess interface supports
`orderBy()`, `reverse()`, `limit()`, `where()`, `anyOf()`, `toArray()`,
and `sortBy()` — all the methods used in the current queries.

Concretely, replace:

```ts
// Before (representative — match the actual calls in the file)
useLiveQuery(() => offlineDB.storyProgress.orderBy("lastReadAt").reverse().limit(5).toArray());
useLiveQuery(() =>
  offlineDB.quizPacks.where("status").equals("ready").reverse().sortBy("createdAt"),
);
useLiveQuery(() => offlineDB.storyCache.where("key").anyOf(keys).toArray());

// After
useLiveQuery(() =>
  dexieDataAccess.storyProgress.orderBy("lastReadAt").reverse().limit(5).toArray(),
);
useLiveQuery(() =>
  dexieDataAccess.quizPacks.where("status").equals("ready").reverse().sortBy("createdAt"),
);
useLiveQuery(() => dexieDataAccess.storyCache.where("key").anyOf(keys).toArray());
```

**Note**: The DataAccess `Collection<T>` interface already has `reverse()`
(line 68 of data-access.ts), so `reverse()` works on the result of
`orderBy()`. Similarly `sortBy()` is on `Collection<T>` (line 73). No type
workarounds needed.

**Verify**:

```bash
pnpm run typecheck
# → exit 0, no errors
```

### Step 3: Remove dead `offlineDB` usages

Check if `offlineDB` is still used elsewhere in the file (e.g.
`offlineDB.isOpen()` or similar). If there's an `offlineDB.isOpen()` call,
replace with a simple fallback — the offline page doesn't need to check
Dexie availability at this level. If any `offlineDB` reference remains that
doesn't have a direct DataAccess equivalent, stop and report.

**Verify**:

```bash
rg "offlineDB" src/app/offline/offline-client.tsx
# → should return no results
```

### Step 4: Run full verification

**Verify**:

```bash
pnpm run typecheck
# → exit 0
pnpm run test
# → all pass
pnpm exec oxfmt --check
# → exit 0
pnpm exec oxlint
# → exit 0
```

## Test plan

No test changes needed. The query rewriting preserves the same logic.

## Done criteria

ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm exec oxfmt --check` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `rg "offlineDB" src/app/offline/offline-client.tsx` returns nothing
- [ ] `rg "from.*offlineDB" src/app/offline/offline-client.tsx` returns nothing
- [ ] Only `src/app/offline/offline-client.tsx` is modified
- [ ] Component renders the same data (story progress, quiz packs, story cache)

## STOP conditions

Stop and report back (do not improvise) if:

- Any DataAccess accessor is missing (e.g. `storyProgress` not on `StoryDataAccess` yet — unlikely, verified above)
- A query method used in the live code is missing from the DataAccess interface (e.g. `reverse()` chained after `where()` — this is supported via `Collection<T>.reverse()` on line 68)
- The `useLiveQuery` import pattern conflicts with DataAccess (DataAccess returns plain promises; `useLiveQuery` accepts promise-returning functions — this is compatible)
- After replacement, the component uses any `offlineDB` method that has no DataAccess equivalent

## Maintenance notes

- The DataAccess barrel at `@/lib/db` exports the concrete `DexieDataAccess`
  instance as `dexieDataAccess`. Use this same pattern for all new components
  that need Dexie access.
- If future offline page changes need Dexie table access, add the accessor
  to the appropriate sub-interface in `data-access.ts` first — never import
  `offlineDB` directly.
