# Plan 191: Complete offline experience — sync status indicator, storage quota, offline page polish

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 690ee57f..HEAD -- src/components/layout/ src/components/offline/ src/app/[locale]/offline/ src/lib/sync/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `690ee57f`, 2026-07-17
- **Issue**: (none)

## Why this matters

The sync infrastructure (outbox queue, push/pull endpoints, service) is fully built and functional. But there is no user-facing indication of sync state — students don't know if their data is saved, pending, or failed. For a platform targeting 60% intermittent-connectivity users, this is critical: the UI must communicate reliability. Additionally, offline quiz packs lack storage quota visibility (a user might download packs until the browser quota fills, then silently break). The `/offline` page is basic and doesn't explain what works offline or show installed packs.

## Current state

- `src/lib/sync/types.ts` — `SyncStatus` interface with `state: "idle" | "syncing" | "error" | "offline"`, `pendingWrites`, `lastSyncAt`, `lastError`
- `src/lib/sync/service.ts` — `createSyncService()` returns `SyncService` with `status()` that returns `SyncStatus`, `trigger()`, `onStatusChange()`. The service tracks state and listeners.
- `src/components/offline/offline-pack-manager.tsx` — manages downloaded quiz packs. No storage quota display.
- `src/app/[locale]/offline/page.tsx` — basic offline page. Likely minimal content.
- `src/components/layout/top-nav.tsx` — TopNav component. No sync status indicator currently.
- `src/components/layout/bottom-nav.tsx` — BottomNav component. No sync status indicator.

The sync service is already instantiated somewhere in the app (check `src/lib/sync/index.ts` or the `SyncProvider` context). The service emits status changes via `onStatusChange()` callbacks, but no UI subscribes to them.

Repo conventions: Status indicators follow a pill/badge pattern (`src/components/ui/badge`). The TopNav uses "use client" and renders on every page. Free icons use `@hugeicons/core-free-icons`.

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test`             | all pass            |
| Lint      | `pnpm exec biome check` | exit 0              |

## Scope

**In scope**:

- `src/components/layout/sync-status-pill.tsx` — new component
- `src/components/layout/top-nav.tsx` — add sync pill (or integrate into existing layout)
- `src/components/offline/offline-pack-manager.tsx` — add storage quota bar
- `src/app/[locale]/offline/page.tsx` — enhance with explanation sections and pack list
- `src/lib/sync/service.ts` — minor: ensure `pendingWrites` count is tracked (currently hardcoded to 0 in `getStatus()`)

**Out of scope**:

- Sync Phase B improvements (push/pull routes are functional — no changes needed)
- Conflict resolution UI (deferred — vector clocks + three-way merge)
- Service worker precache for quiz packs (deferred — requires SW update flow)
- Making the sync pill interactive (tap to show details — future enhancement)

## Git workflow

- Branch: `advisor/191-offline-experience-completion`
- Commit style: conventional commits
- Do NOT push or open PR unless instructed

## Steps

### Step 1: Create the sync status pill component

Create `src/components/layout/sync-status-pill.tsx`:

A small pill/badge that subscribes to the sync service's status and renders:

- Green dot + "Synced" when `state === "idle"` and `lastSyncAt` is recent (< 5min ago)
- Yellow dot + "Syncing..." when `state === "syncing"` or `pendingWrites > 0`
- Red dot + "Error" when `state === "error"` with a hover tooltip showing `lastError`
- Gray dot + "Offline" when `state === "offline"`

Use the existing `SyncService` from `@/lib/sync`. Get the instance by importing from the barrel at `@/lib/sync` or from wherever it's created. Check if there's a React context for sync; if not, create a simple `useSyncStatus()` hook that wraps the service's `onStatusChange()`.

The component should be small (24px height, text-xs, no padding when showing just the indicator dot). Use `useEffect` to subscribe/unsubscribe from `onStatusChange()`.

```tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/sync/types";
// Import the sync service instance — adjust path to match actual export

const DOT_CLASSES: Record<string, string> = {
  idle: "bg-success", // green
  syncing: "bg-warning", // yellow
  error: "bg-destructive", // red
  offline: "bg-muted-foreground/40", // gray
};

export function SyncStatusPill() {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    // Subscribe to sync service status changes
    // const unsub = syncService.onStatusChange(setStatus);
    // return unsub;
  }, []);

  if (!status) return null;

  const dotClass = DOT_CLASSES[status.state] ?? "bg-muted-foreground/40";

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5">
      <span className={cn("size-2 rounded-full", dotClass)} />
      <span className="text-xs text-muted-foreground">
        {status.state === "idle" && (status.lastSyncAt ? "Synced" : "")}
        {status.state === "syncing" && "Syncing..."}
        {status.state === "error" && "Error"}
        {status.state === "offline" && "Offline"}
      </span>
    </div>
  );
}
```

The actual wiring depends on how the sync service is instantiated. Check `src/lib/sync/index.ts` or search for `createSyncService(` in the codebase to find the singleton. If it's not exposed as a singleton, create a lightweight `useSyncStatus` hook that calls the existing `getPendingOutboxEntries()` and `fetch("/api/sync/status")` on an interval.

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Wire sync pill into TopNav

In `src/components/layout/top-nav.tsx`, add `<SyncStatusPill />` in the right side of the nav bar, before any user avatar or settings button.

The TopNav is a client component (uses `"use client"`). Import and render the pill:

```tsx
import { SyncStatusPill } from "./sync-status-pill";

// Inside the nav content, in the right-aligned section:
<div className="flex items-center gap-2">
  <SyncStatusPill />
  {/* existing buttons */}
</div>;
```

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Add storage quota to Offline Pack Manager

In `src/components/offline/offline-pack-manager.tsx`, add a storage quota bar below the pack list:

1. Use the `navigator.storage.estimate()` API to get `{ quota, usage }`
2. Calculate usage percentage
3. Render a progress bar with the percentage label
4. Show "X MB used of Y MB" text
5. Handle the case where the API is unavailable (graceful degrade — show nothing)
6. Warn when usage exceeds 80% (yellow) or 95% (red) with a message

Pattern: Use `useEffect` to call the API once on mount. Use the existing `<Progress>` component from `@/components/ui/progress` if it exists (check with `glob src/components/ui/progress.tsx`).

```tsx
// Inside the component or a sub-component:
const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

useEffect(() => {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    navigator.storage.estimate().then((e) => {
      if (e.usage != null && e.quota != null) {
        setStorage({ usage: e.usage, quota: e.quota });
      }
    });
  }
}, []);
```

**Verify**: `pnpm typecheck` exits 0.

### Step 4: Enhance the offline page

Improve `src/app/[locale]/offline/page.tsx` (or its client component):

1. Show "You're offline" heading with an offline icon
2. Explain what features are available offline:
   - Downloaded quiz packs
   - Flashcards (cached data)
   - Past study results
   - Downloaded stories
3. Show a list of installed quiz packs (if any) with "Start studying" buttons
4. Show last sync time
5. Add a "Try reconnecting" button that checks connectivity and refreshes

This should match the design language of the app — use the existing card/badge/button components.

**Verify**: `pnpm typecheck` exits 0.

### Step 5: Fix pendingWrites tracking in sync service

In `src/lib/sync/service.ts`, the `getStatus()` function currently returns `pendingWrites: 0` (hardcoded at line 29). Update it to query the actual count from `getPendingOutboxEntries()`:

```ts
async function getPendingCount(): Promise<number> {
  const entries = await getPendingOutboxEntries(999);
  return entries.length;
}
```

Then in `getStatus()`, make `pendingWrites` computed asynchronously, or store it in a volatile counter that's updated whenever the outbox changes. The simplest approach: increment/decrement a counter in the `pushOutbox` and `enqueueOutbox` code paths.

For a minimal fix, add a `pendingWrites` counter that's incremented when an entry is enqueued and decremented when processed:

```ts
let pendingWritesCount = 0;

// In enqueue path: pendingWritesCount++
// After successful push: pendingWritesCount -= entriesProcessed
// In getStatus(): pendingWrites: pendingWritesCount
```

**Verify**: `pnpm typecheck` exits 0.

### Step 6: Run full verification

```bash
pnpm typecheck && pnpm exec biome check && pnpm test
```

All should pass.

## Test plan

- New tests:
  - `src/components/layout/__tests__/sync-status-pill.test.tsx` — renders based on status state, shows correct dot color + label for each state
  - `src/components/offline/__tests__/offline-pack-manager.test.tsx` — storage quota bar renders when `navigator.storage` is available
  - `src/app/[locale]/offline/__tests__/offline-page.test.tsx` — renders heading and offline feature list
- Follow patterns in `src/components/layout/__tests__/` or adjacent test files

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 (including new tests)
- [ ] Sync status pill renders in TopNav and shows correct state
- [ ] Offline Pack Manager shows storage quota bar with MB used / total
- [ ] Offline page shows feature list, installed packs, and last sync time
- [ ] `pendingWrites` is no longer hardcoded to 0 in sync service
- [ ] Only files in scope are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The sync service is not accessible as a singleton or from a React context — check `src/lib/sync/index.ts` and `src/components/sync/` for provider components
- `navigator.storage.estimate()` is behind a permissions gate on some browsers (it's generally available without permission but may throw in some contexts)
- The TopNav component is server-rendered and can't import a `"use client"` component directly (it likely has `"use client"` already if it includes interactive elements)
- The offline page route is handled by middleware/redirect and doesn't render the expected component

## Maintenance notes

- The sync status pill is intentionally minimal. A tap-to-expand details panel (showing pending entries, last error, retry button) is a natural follow-up.
- Storage quota is read-only in this plan. A "Clear cache" button (that deletes downloaded packs and old Dexie data) would be useful next.
- If IndexedDB grows large (38+ tables), consider a Dexie storage monitoring utility that alerts before quota exhaustion.
- The navigator.storage.estimate() API returns the entire origin quota, not just Lumni's data. If the user has other apps using the same origin, the bar may show misleading usage.
