# Plan 187: Consolidate Bookmark Dual State Management

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/store/bookmarks.ts src/hooks/ src/lib/bookmark-service/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Bookmarks use both a Zustand store (`src/store/bookmarks.ts`, 133L) AND a DataAccess-backed service (`src/lib/bookmark-service/`). The store maintains an in-memory copy with optimistic updates and manual rollback on service failure. This dual state means two sources of truth, and new consumers must import from both the store AND the service. The store duplicates `toggleBookmark`, `addBookmark`, `removeBookmark`, `updateNote`, and `isBookmarked` — all of which the service already provides.

## Current state

`src/store/bookmarks.ts`:

```typescript
// Optimistic update + manual rollback
set({ bookmarks: [entry, ...prev] });
bookmarkService.add({...}).catch(() => {
  set({ bookmarks: prev }); // rollback
});
```

The store's only value over the service is client-side reactivity. This can be replaced with a TanStack Query hook or `useSyncExternalStore`.

## Steps

### Step 1: Create `useBookmarks()` hook

Create `src/hooks/use-bookmarks.ts` that wraps `DexieBookmarkService` with TanStack Query's `useQuery`/`useMutation`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useBookmarks() {
  const queryClient = useQueryClient();
  const queryKey = ["bookmarks"];

  const { data: bookmarks = [] } = useQuery({
    queryKey,
    queryFn: () => bookmarkService.getAll(),
  });

  const addBookmark = useMutation({
    mutationFn: (params) => bookmarkService.add(params),
    onMutate: async (params) => {
      // optimistic update via query cache
    },
    onError: (_, __, context) => {
      // rollback via query cache
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { bookmarks, addBookmark, removeBookmark, toggleBookmark, isBookmarked };
}
```

### Step 2: Update consumers to use the hook

Replace all `useBookmarksStore()` imports with `useBookmarks()` from the new hook. The API surface should be the same (same return field names).

### Step 3: Delete `src/store/bookmarks.ts`

After confirming zero consumers remain, delete the Zustand store file.

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0
