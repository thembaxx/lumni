# Plan 080: Complete sync UX — Settings panel, auto-flush, conflict awareness

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 44169e58..HEAD -- src/lib/sync/ src/hooks/use-sync.ts src/hooks/use-sync-status.ts src/components/navigation/top-nav.tsx src/app/[locale]/settings/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `44169e58`, 2026-07-03

## Why this matters

The cross-device sync infrastructure (`src/lib/sync/` with outbox, push/pull API routes, `useSync` hook) is fully built with 11 passing tests — but it has no meaningful client surface. The `useSync` hook is only used in `top-nav.tsx` (shows `isSyncing` state) and `triggerSync` is never called from any component. Students who switch between phone, tablet, and laptop throughout the day have no way to tell if their data is synced, no way to force a sync, and no indication of pending changes. This is the single biggest "built but invisible" feature in the codebase.

## Current state

- `src/lib/sync/service.ts` — Full `SyncService` with push/pull/status/start/stop. 198 lines, 11 passing tests.
- `src/hooks/use-sync.ts` — React hook wrapping `createSyncService`, exposes `{ status, triggerSync, isSyncing }`.
- `src/hooks/use-sync-status.ts` — Separate hook polling `jobs` table for pending count every 10s. Shows `{ isOnline, pendingCount }`.
- `src/components/navigation/top-nav.tsx:64-65` — Imports both hooks and uses them but only for the `isSyncing` bool + `pendingCount` number. No visual sync indicator.
- `triggerSync()` — Defined in `use-sync.ts` but NEVER called from any component (grep confirms zero callers). The app never proactively pushes its outbox.
- No Settings page section for sync status, no manual "Sync Now" button, no conflict resolution UX.

Relevant conventions:

- Settings pages use `ListSection` and `ListCell` from `@/components/ui/list-cell` — see `src/components/settings/tabs/data-tab.tsx` for the pattern.
- The Settings navigation is in `src/app/[locale]/settings/settings-client.tsx` which renders tabs; adding a sync tab follows the same `case` pattern.
- Error handling follows `logError()` from `@/lib/shared/logger` — never `console.warn`/`console.error`.

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Install   | `pnpm install`          | exit 0              |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test -- <filter>` | all pass            |
| Lint      | `pnpm lint`             | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `src/components/navigation/top-nav.tsx` — add sync status indicator icon with tooltip
- `src/components/settings/tabs/sync-tab.tsx` — new: sync status panel (create)
- `src/app/[locale]/settings/settings-client.tsx` — register the new sync tab
- `src/app/[locale]/settings/sync/page.tsx` — route for the sync page (create)
- `src/app/[locale]/settings/sync/sync-page-client.tsx` — client wrapper (create)
- `src/hooks/use-sync.ts` — minor: expose `pendingCount` from the SyncService status
- `src/lib/sync/types.ts` — minor: ensure `SyncStatus` includes `pendingWrites`
- Any new test file for the SyncTab component

**Out of scope** (do NOT touch):

- `src/lib/sync/service.ts` — no changes to the sync engine itself
- `src/app/api/sync/` — no API changes
- `src/lib/sync/outbox.ts` — no outbox queue changes
- Conflict resolution UI (still `conflicts: 0` always) — deferred

## Git workflow

- Branch: `advisor/080-sync-ux`
- Commits: one per step, conventional message style `feat: add sync status panel to settings`
- Do NOT push or open a PR

## Steps

### Step 1: Create the sync settings page + tab component

Create `src/components/settings/tabs/sync-tab.tsx`:

The component renders inside the Settings tab pattern (see `src/components/settings/tabs/data-tab.tsx` for the pattern). It:

- Uses `useSync(user?.$id)` and `useSyncStatus()` hooks
- Shows a `ListSection` with:
  - **Connection status** row: `isOnline` badge (green "Online" / red "Offline")
  - **Pending writes** row: count of pending outbox entries
  - **Last sync** row: formatted timestamp or "Never"
  - **Sync Now** button: calls `triggerSync()`, shows loading state while `isSyncing`, disabled when `isOnline` is false
- Shows a `ListSection` with sync history info
- Uses `logError` for error handling
- Shows empty state when not authenticated

Pattern for the "Sync Now" button (mirrors existing UX patterns in the codebase):

```tsx
<Button onClick={handleSync} disabled={!isOnline || isSyncing} className="w-full">
  {isSyncing ? "Syncing..." : "Sync Now"}
</Button>
```

Create `src/app/[locale]/settings/sync/sync-page-client.tsx`:

```tsx
"use client";
import { SyncTab } from "@/components/settings/tabs/sync-tab";

export function SyncPageClient() {
  return <SyncTab />;
}
```

Create `src/app/[locale]/settings/sync/page.tsx`:

```tsx
import { SyncPageClient } from "./sync-page-client";

export default function SyncPage() {
  return <SyncPageClient />;
}
```

**Verify**: `pnpm typecheck` exits 0. The new files compile without errors.

### Step 2: Register the sync tab in settings

In `src/app/[locale]/settings/settings-client.tsx`:

1. Add a new tab definition in the tabs array (following the pattern of existing tabs like `"data"`, `"referrals"`):
   - `value: "sync"`, key: `"settings.sync"`, icon: `RefreshIcon` or similar
2. Add `case "sync":` in the tab panel render section (around line 324+), rendering `<SyncTab />` wrapped in a `role="tabpanel"` div following the existing pattern

The tabs array includes a `showOnlyWhen` condition to gate the referral tab behind `isLoggedIn` — the sync tab should always show when `isLoggedIn` is true.

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Add sync status indicator to TopNav

In `src/components/navigation/top-nav.tsx`, the `TopNavStatus` component currently shows level and XP. Add a small sync indicator icon:

- When `isSyncing` is true: show a small animated spinner icon (use a `motion` component with `animate={{ rotate: 360 }}` and `transition={{ repeat: Infinity, duration: 1, ease: "linear" }}`)
- When `pendingCount > 0` and not syncing: show a small cloud-upload icon with the pending count badge
- When `isOnline === false`: show a muted offline icon
- Use the `HugeiconsIcon` component with appropriate icons from the `@hugeicons/core-free-icons` package (check existing imports in the file for pattern — it uses `CloudBlank01Icon`, `WifiOff01Icon`, etc.)
- Keep it visually small (`size-3` or `size-3.5`), add a subtle tooltip on hover showing "Syncing..." / "X pending changes" / "Offline"

**Verify**: `pnpm typecheck` exits 0.

### Step 4: Wire auto-flush on online transitions

In `src/components/navigation/top-nav.tsx` (or in the SyncTab component — best in TopNav since it's always mounted):

When `isOnline` transitions from `false` to `true`, call `triggerSync()` automatically.

Use a `useEffect`:

```tsx
const prevOnline = useRef(isOnline);
useEffect(() => {
  if (isOnline && !prevOnline.current) {
    triggerSync();
  }
  prevOnline.current = isOnline;
}, [isOnline, triggerSync]);
```

This ensures the outbox flushes when connectivity is restored — the most common user scenario for mobile students.

**Verify**: `pnpm typecheck` exits 0. Manual review confirms the effect fires on online→offline→online transitions.

## Test plan

- No new tests required for the auto-flush effect (difficult to test in isolation)
- Verify existing tests still pass: `pnpm test -- src/lib/sync` — all 11+ tests pass
- Verify existing nav tests pass: `pnpm test -- top-nav` — all 40 tests pass

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test -- src/lib/sync` exits 0 (all 11+ tests)
- [ ] `pnpm test -- top-nav` exits 0 (all 40 tests)
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 overall
- [ ] No new files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `useSync()` or `useSyncStatus()` are structured differently than the excerpts above, stop and report — the hook API may have changed.
- If the Settings tab pattern has changed (e.g. migrated away from `case` dispatch), stop and report.
- If a step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If the sync engine gets conflict resolution in the future, the SyncTab should surface conflicts as actionable items.
- If the sync outbox gets a different persistence model, the `pendingCount` source may need updating.
- The auto-flush effect uses a simple `useRef` to track the previous online state — if more complex state is needed later (e.g. debouncing), extract into a custom hook.
