# Plan P003: Fix `localStorage` Usage in Server-Side Sync Route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/app/api/sync/route.ts`
> If the file changed, compare the "Current state" excerpts against the live code.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: P001 (establishes pattern for async init — not a hard dep, just architectural awareness)
- **Category**: bug
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

`GET /api/sync` uses `localStorage.getItem()` inside a server-side route handler. `localStorage` does not exist in Node.js or Edge runtime. The sync timestamp is never persisted across server deployments — every deployment resets the "last sync" to null. The `typeof localStorage !== "undefined"` guard means it silently returns `null` instead of crashing, but this means the feature is completely broken on the server.

## Current state

**`src/app/api/sync/route.ts:37-52`**:

```typescript
const syncGetHandler = createRouteHandler({
  auth: "required",
  execute: async ({ userId }) => {
    const lastSync =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(`lumni_last_sync_${userId}`)
        : null;

    return {
      status: "ok",
      lastSync: lastSync ? Number(lastSync) : null,
      pendingChanges: 0,
    };
  },
  errorLabel: "Sync",
});
```

`localStorage` is a browser API — it doesn't exist in Node.js. The `typeof localStorage !== "undefined"` guard always returns false server-side, so `lastSync` is always `null` and the response always shows "never synced". The `GET` handler returns `pendingChanges: 0` (hard-coded) and `lastSync: null` on every server-rendered call.

**Repo conventions**: This codebase uses Dexie IndexedDB for offline storage and the `DataAccess` seam for all database access. Server-side persistence should use Appwrite or the Dexie-aware `DataAccess` interface. The `createRouteHandler` factory is used consistently.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/app/api/sync/route.ts` — the GET handler

**Out of scope**:

- The POST handler (doesn't use localStorage)
- The sync service implementation (`src/lib/sync/service.ts`, `outbox.ts`)
- Adding a Dexie table or Appwrite collection for sync checkpoints (they already exist: `syncCheckpoints` Dexie table is used in `src/lib/sync/service.ts:85`)

## Git workflow

- Branch: `advisor/P003-sync-localstorage`
- Commit message: `fix: replace localStorage with in-memory fallback in sync GET route`
- Do NOT push or open a PR

## Steps

### Step 1: Replace localStorage with in-memory Map + Dexie read

The GET handler currently tries to use `localStorage`. Replace it with an in-memory cache that falls back to reading the Dexie `syncCheckpoints` table (via `DataAccess`):

```typescript
const lastSyncCache = new Map<string, number>();

const syncGetHandler = createRouteHandler({
  auth: "required",
  execute: async ({ userId }) => {
    let lastSync = lastSyncCache.get(userId) ?? null;

    if (lastSync === null) {
      try {
        const { default: db } = await import("@/lib/db/data-access");
        const checkpoints = await db.syncCheckpoints
          .where("table")
          .anyOf(["flashcards", "notes", "competencies", "gamification"])
          .toArray();
        if (checkpoints.length > 0) {
          lastSync = Math.max(...checkpoints.map((c) => c.lastPulledAt));
          lastSyncCache.set(userId, lastSync);
        }
      } catch {
        // Dexie unavailable in this environment
      }
    }

    const { getPendingCount } = await import("@/lib/sync/outbox");
    let pendingChanges = 0;
    try {
      pendingChanges = await getPendingCount();
    } catch {
      // outbox unavailable
    }

    return { status: "ok", lastSync, pendingChanges };
  },
  errorLabel: "Sync",
});
```

Note: Check if `getPendingCount()` exists in `outbox.ts`. If not, you may need to read `syncOutbox.table("syncOutbox").count()` directly or skip the `pendingChanges` computation and keep it as `0`.

### Step 2: Remove the localStorage guard/fallback

If after step 1 there's no remaining code referencing `localStorage`, ensure no dead imports remain.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

## Test plan

No new tests. The change is small and the GET handler is a thin information endpoint.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -n "localStorage" src/app/api/sync/route.ts` returns no matches
- [ ] No files outside `src/app/api/sync/route.ts` are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `DataAccess` doesn't have a `syncCheckpoints` accessor with the expected type
- The dynamic `import("@/lib/db/data-access")` causes a bundler issue
- The `getPendingCount` doesn't exist in `src/lib/sync/outbox.ts`

## Maintenance notes

- The in-memory `lastSyncCache` Map is per-server-instance — on multi-instance deployments, cached timestamps may briefly differ, but this is acceptable for a non-critical "last sync" informational endpoint
- If future needs require persistent last-sync tracking across deployments, add an Appwrite document or use the existing `syncCheckpoints` Dexie table
