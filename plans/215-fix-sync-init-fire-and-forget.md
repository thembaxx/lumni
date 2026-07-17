# Plan 215: Fix sync init fire-and-forget — wire error reporting and retry

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug

## Why this matters

The sync provider is the backbone of cross-device data persistence. Three critical calls — `initSyncWriters()`, `service.trigger()`, and the manual `triggerSync()` — use `.catch(() => {})`, swallowing every failure. When sync initialization fails (e.g. Appwrite is unreachable, IndexedDB is locked, or the service worker isn't registered), the user sees no indication. Pending writes accumulate silently in the outbox, never synced. The provider's `SyncStatus.lastError` field is never populated, so consumer components (like the sync status indicator) always show "All good." Plan 209 handles the logging fix; this plan goes further by adding retry logic and wiring errors into the sync status.

## Current state

`src/components/providers/sync-provider.tsx:39-77`:

```tsx
useEffect(() => {
  if (initializedRef.current || typeof window === "undefined") return;
  initializedRef.current = true;
  initSyncWriters().catch(() => {}); // line 42 — fire-and-forget, no retry
}, []);

useEffect(() => {
  if (!userId) return;
  const service = createSyncService(() => userId);
  serviceRef.current = service;
  const unsub = service.onStatusChange(setStatus);
  service.start();

  const onOnline = () => {
    service.trigger().catch(() => {}); // line 55 — fire-and-forget
  };
  window.addEventListener("online", onOnline);
  // ...
}, [userId]);

const triggerSync = useCallback(() => {
  serviceRef.current?.trigger().catch(() => {}); // line 77 — fire-and-forget
}, []);
```

The `initSyncWriters()` call (line 42) writes to Dexie tables and initializes writer queues. If it fails, no writers are registered and no subsequent `trigger()` call can push data to Appwrite.

## Target state

All 3 calls use `logError("context", err)`. `initSyncWriters()` gets retry logic (3 attempts, exponential backoff: 1s, 2s, 4s). Failures surface in `SyncStatus.lastError` via `setStatus()`.

```tsx
useEffect(() => {
  if (initializedRef.current || typeof window === "undefined") return;
  initializedRef.current = true;
  (async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await initSyncWriters();
        break;
      } catch (err) {
        logError(`SyncInitWriters (attempt ${attempt}/3)`, err);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        } else {
          setStatus((prev) => ({ ...prev, state: "error", lastError: "Sync init failed" }));
        }
      }
    }
  })();
}, []);
```

`service.trigger()` (line 55) gets `logError` + status update:

```tsx
const onOnline = () => {
  service.trigger().catch((err: unknown) => {
    logError("SyncTriggerOnline", err);
    setStatus((prev) => ({ ...prev, lastError: "Online sync failed" }));
  });
};
```

`triggerSync` (line 77) gets `logError` + status update:

```tsx
const triggerSync = useCallback(() => {
  serviceRef.current?.trigger().catch((err: unknown) => {
    logError("SyncTriggerManual", err);
    setStatus((prev) => ({ ...prev, lastError: "Manual sync failed" }));
  });
}, []);
```

## Scope

- `src/components/providers/sync-provider.tsx` only
- May need to import `logError` from `@/lib/shared/logger` (add import)
- No other files
- No changes to the `SyncService` class itself — only the error handling at the provider boundary

## Steps

### 1. Add `logError` import

File: `src/components/providers/sync-provider.tsx`

Add `import { logError } from "@/lib/shared/logger"` to the existing imports.

### 2. Add retry loop to `initSyncWriters` (line 42)

Replace the single fire-and-forget call with the retry pattern shown in Target state. Keep the `initializedRef` guard. Use an IIFE inside the `useEffect` to support `async/await`:

```tsx
useEffect(() => {
  if (initializedRef.current || typeof window === "undefined") return;
  initializedRef.current = true;
  (async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await initSyncWriters();
        return;
      } catch (err) {
        logError(`SyncInitWriters (attempt ${attempt}/3)`, err);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, [1000, 2000, 4000][attempt - 1]));
        } else {
          setStatus((prev) => ({ ...prev, state: "error", lastError: "Sync init failed" }));
        }
      }
    }
  })();
}, []);
```

### 3. Add error handling to online trigger (line 55)

Replace:

```tsx
service.trigger().catch(() => {});
```

With:

```tsx
service.trigger().catch((err: unknown) => {
  logError("SyncTriggerOnline", err);
  setStatus((prev) => ({ ...prev, lastError: "Online sync failed" }));
});
```

### 4. Add error handling to manual trigger (line 77)

Replace:

```tsx
serviceRef.current?.trigger().catch(() => {});
```

With:

```tsx
serviceRef.current?.trigger().catch((err: unknown) => {
  logError("SyncTriggerManual", err);
  setStatus((prev) => ({ ...prev, lastError: "Manual sync failed" }));
});
```

### 5. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

### 6. Manual smoke test (optional but recommended)

In a dev environment:

1. Open browser DevTools → Application → IndexedDB → delete the `lumni` database
2. Reload the app while authenticated
3. Verify no uncaught promise rejection in the console
4. Open the sync status indicator (wherever `useSyncContext()` is consumed) — should show syncing state, not error

## Stop conditions

- Any file outside `src/components/providers/sync-provider.tsx` is modified — stop and revert
- `pnpm run typecheck` fails
- More than 2 tests regress
- The retry loop causes a visible delay on page load that blocks rendering (the loop is in `useEffect` which runs after paint, so this shouldn't happen)

## Estimated time

1-2 hours
