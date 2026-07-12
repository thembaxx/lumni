# Plan 002: Cross-device sync — wire Phase B

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c91fa0d4..HEAD -- src/lib/sync/ src/app/api/sync/ src/hooks/ src/lib/db/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c91fa0d4`, 2026-07-10
- **Issue**: (none)

## Why this matters

Phase A (Session 50) shipped `src/lib/sync/` with outbox Dexie tables, push/pull API stubs, and a `SyncService` that calls them on a 5-minute interval. But nothing writes to the outbox — there are no Dexie write hooks. Users who switch devices today lose all progress made on the first device. This plan wires the actual enqueue path, adds online/offline auto-replay, and builds a conflict-resolution UI so users can resolve sync conflicts.

## Current state

- `src/lib/sync/types.ts` — defines `SyncOutboxEntry` (table, recordId, operation, data, retries), `SyncCheckpoint`, `SyncStatus`, `SyncService` interface
- `src/lib/sync/service.ts` — `createSyncService()` has `pushOutbox()` (reads from Dexie `syncOutbox` table, POSTs to `/api/sync/push`, removes successful entries) and `pullRemote()` (iterates 12 hardcoded tables, GETs `/api/sync/pull?table=X&since=Y`, writes to Dexie). Called on a 5-min interval. No write hooks — outbox is always empty.
- `src/app/api/sync/push/route.ts` — upserts into `COLLECTIONS.SYNC_ENTRIES` in Appwrite. Works.
- `src/app/api/sync/pull/route.ts` — exists but hardcoded. No consumer writes to the outbox, so push is never called.
- `src/lib/sync/outbox.ts` — provides `getPendingOutboxEntries()`, `incrementRetry()`, `removeOutboxEntries()`. Interfaces are ready.
- `src/lib/db/schema.ts` — Dexie v41 includes `syncOutbox` and `syncCheckpoints` tables.
- `useSync` hook exists at `src/hooks/use-sync-status.ts` — reads SyncStatus, no write hook integration.

The design doc at `docs/decisions/2026-06-29-cross-device-sync-design.md` specifies CRDT/LWW conflict resolution. For Phase B, use LWW (last-writer-wins) since the existing code already uses timestamps.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm run typecheck`      | exit 0              |
| Tests     | `pnpm run test -- --run`  | all pass            |
| Lint      | `pnpm exec oxlint --fix`  | exit 0              |
| Format    | `pnpm exec oxfmt --check` | clean               |

## Scope

**In scope**:

- `src/lib/sync/outbox.ts` — add `enqueue(table, recordId, operation, data)` function
- `src/lib/sync/sync-writer.ts` — new file: Dexie write hook wrapper that auto-enqueues on every `put`/`add`/`delete`
- `src/lib/sync/index.ts` — barrel export the new function
- `src/hooks/use-sync.ts` — new hook (or extend `use-sync-status.ts`) with write hook wiring, online/offline listener, auto-replay
- `src/lib/sync/service.ts` — add conflict detection + LWW resolution in `pullRemote()`
- `src/components/sync/sync-status-indicator.tsx` — new component: shows pending writes, last sync time, conflict count
- `src/components/sync/conflict-resolver.tsx` — new component: shows sync conflicts, lets user pick local/remote

**Out of scope**:

- Do NOT change the Appwrite sync push/pull routes — they already work
- Do NOT implement CRDT — LWW is sufficient for Phase B
- Do NOT add conflict detection to existing Dexie write paths outside the sync module
- Do NOT add sync to all 38 tables — the 12 in `pullRemote()` are sufficient for Phase B

## Git workflow

- Branch: `advisor/002-sync-phase-b`
- Commit per step
- Message style: conventional commits — `feat(sync): add Dexie write hook for outbox enqueue`

## Steps

### Step 1: Add `enqueue()` to outbox module

In `src/lib/sync/outbox.ts`, add:

```typescript
import { dexieDataAccess } from "@/lib/db";

export async function enqueue(
  table: string,
  recordId: string,
  operation: "create" | "update" | "delete",
  data: unknown,
): Promise<void> {
  await dexieDataAccess.syncOutbox.add({
    table,
    recordId,
    operation,
    data: JSON.stringify(data),
    createdAt: Date.now(),
    retries: 0,
  });
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create the sync write hook

Create `src/lib/sync/sync-writer.ts`:

```typescript
import { dexieDataAccess } from "@/lib/db";
import { enqueue } from "./outbox";

type SyncableTable =
  | "flashcards"
  | "notes"
  | "competencies"
  | "gamification"
  | "retentionRecurrence"
  | "wrongAnswers"
  | "chatMessages"
  | "questionRatings"
  | "bookmarks"
  | "examSessions"
  | "quizAttempts"
  | "studyPlans";

const SYNCABLE_TABLES: ReadonlySet<string> = new Set([
  "flashcards",
  "notes",
  "competencies",
  "gamification",
  "retentionRecurrence",
  "wrongAnswers",
  "chatMessages",
  "questionRatings",
  "bookmarks",
  "examSessions",
  "quizAttempts",
  "studyPlans",
]);

export function isSyncableTable(tableName: string): boolean {
  return SYNCABLE_TABLES.has(tableName);
}

// Wrap a Dexie table's put/add to also enqueue a sync outbox entry.
// Call this during app initialization.
export function wrapTableForSync(
  tableName: SyncableTable,
  table: {
    put(item: unknown): Promise<unknown>;
    add(item: unknown): Promise<unknown>;
    delete(id: string | number): Promise<void>;
  },
): void {
  const originalPut = table.put.bind(table);
  const originalAdd = table.add.bind(table);
  const originalDelete = table.delete.bind(table);

  (table as unknown as Record<string, unknown>).put = async (item: Record<string, unknown>) => {
    const result = await originalPut(item);
    const recordId = String(item.id ?? result);
    await enqueue(tableName, recordId, item.id ? "update" : "create", item).catch(() => {});
    return result;
  };

  (table as unknown as Record<string, unknown>).add = async (item: Record<string, unknown>) => {
    const result = await originalAdd(item);
    const recordId = String(result);
    await enqueue(tableName, recordId, "create", item).catch(() => {});
    return result;
  };

  (table as unknown as Record<string, unknown>).delete = async (id: string | number) => {
    await originalDelete(id);
    await enqueue(tableName, String(id), "delete", null).catch(() => {});
    return undefined as unknown as void;
  };
}
```

Follow the repo's DI pattern: the function should accept the table as a parameter so it's testable. The repo convention is to use constructor/param injection, not direct imports — see `src/lib/sync/service.ts:85` which uses dynamic `import("@/lib/db/dexie-data-access")` for testability.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Wire write hooks during app init

Find where the app initialises the sync service. Likely candidates: look for `createSyncService()` call sites. Wrap the 12 syncable tables with `wrapTableForSync()` immediately after Dexie is available.

The wrapping call should look like:

```typescript
import { dexieDataAccess } from "@/lib/db";
import { wrapTableForSync } from "@/lib/sync/sync-writer";

const SYNC_TABLES: Array<{ name: SyncableTable; table: typeof dexieDataAccess.flashcards }> = [
  { name: "flashcards", table: dexieDataAccess.flashcards },
  // ... all 12 tables
];

for (const { name, table } of SYNC_TABLES) {
  wrapTableForSync(name, table);
}
```

**Verify**: Write a quick test that writes to any syncable table and confirms the outbox has an entry.

### Step 4: Add online/offline listener with auto-replay

In `src/lib/sync/service.ts`, add an online event listener in the `start()` method:

```typescript
function start() {
  // ... existing code ...

  window.addEventListener("online", () => {
    trigger().catch(() => {});
  });
}
```

And a stop:

```typescript
function stop() {
  // ... existing code ...
  window.removeEventListener("online", () => {});
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Add LWW conflict resolution to pull

In `src/lib/sync/service.ts:pullRemote()`, after fetching remote records and before writing to Dexie, compare timestamps:

```typescript
for (const record of data.records as Array<{ id: string; updatedAt?: string }>) {
  const local = await accessor.get(record.id);
  if (local && local.updatedAt && record.updatedAt) {
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(record.updatedAt).getTime();
    if (localTime >= remoteTime) {
      // Local is newer or equal — skip the remote write
      continue;
    }
  }
  await accessor.put(record);
}
```

This assumes records have an `updatedAt` field. If any of the 12 syncable tables don't have one, use `Date.now()` as fallback.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 6: Create sync status indicator component

Create `src/components/sync/sync-status-indicator.tsx` — following the component patterns in `src/components/` (use `"use client"`, React hooks, Tailwind classes):

- Shows a small pill with sync state (idle/syncing/error/offline)
- Shows pending write count
- Shows last sync time
- Clicking triggers manual sync

Use `useSyncStatus()` or the existing `use-sync-status.ts` hook.

**Verify**: The component renders without crashing. `pnpm run typecheck` → exit 0.

### Step 7: Create conflict resolver UI

Create `src/components/sync/conflict-resolver.tsx`:

- Shows a list of sync conflicts (local vs remote)
- For each, lets the user pick: "Keep local" / "Keep remote" / "Review both"
- After resolution, writes the chosen version to Dexie and clears the conflict

Use the `SyncConflict` type from `src/lib/sync/types.ts`.

**Verify**: `pnpm run typecheck` → exit 0.

## Test plan

- Create `src/lib/sync/__tests__/sync-writer.test.ts` — test that `enqueue()` writes to Dexie `syncOutbox` table. Follow the test patterns from `src/lib/sync/__tests__/`.
- Create `src/lib/sync/__tests__/sync-service.test.ts` — test that online listener triggers sync. Use fake timers.
- Update the existing test if one exists at `src/lib/sync/__tests__/`.

**Verify**: `pnpm run test -- --run` → all tests pass, including new ones.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run` exits 0; new tests for sync-writer and service exist
- [ ] `enqueue()` is called whenever a syncable Dexie table is written to (put/add/delete)
- [ ] Online event triggers auto-sync
- [ ] LWW conflict resolution in pull handles `updatedAt` comparison
- [ ] `SyncStatusIndicator` renders in settings or nav bar
- [ ] `ConflictResolver` component exists (even if conflicts are rare)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The Dexie write hook wrapper breaks existing table operations (test by writing to each table)
- No single init point exists for writing all 12 hooks (you may need to find/create one)
- `updatedAt` field is missing from multiple syncable tables requiring schema migrations

## Maintenance notes

- When new syncable tables are added in the future, they must be added to the `SYNC_TABLES` array and `SYNCABLE_TABLES` set.
- The LWW resolution assumes clock skew is small — acceptable for consumer app, revisit for enterprise.
- The design doc at `docs/decisions/2026-06-29-cross-device-sync-design.md` has the full CRDT roadmap for Phase C if needed.
