# Plan 090: Question share management surface — list + revoke

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/app/api/q/ src/components/share/ src/lib/share/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

Users can share questions via `POST /api/q/share` — this creates a share record linked to their question. But there's no way to see what they've shared or revoke old shares. Shares persist indefinitely with no user visibility. For a study app where questions may contain personal notes or attempt data, the inability to manage shares is a privacy gap. It also creates a UX asymmetry: every other data type (notes, flashcards, bookmarks) has a list-and-delete management surface.

## Current state

- `src/app/api/q/share/route.ts` — `POST` handler only. Accepts `{ questionId }`, creates share record in the `sharedQuestions` DataAccess table.
- No `GET` handler for listing shares by user.
- No `DELETE` handler for revoking a share.
- `src/lib/share/` — share-related utilities exist (check the barrel)
- `sharedQuestions` DataAccess table exists with accessor in both adapters
- The public share page at `/q/[id]` renders shared questions correctly (proven by `GET /api/q/share/[id]` or equivalent)

## STOP conditions

- The `sharedQuestions` DataAccess accessor uses a different ID scheme than what the share route returns (verify types)
- The share route uses a server-side only store (Appwrite) — in that case these endpoints must also use Appwrite

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test -- share`        | all pass            |
| Lint      | `pnpm exec biome check --write` | exit 0              |

## Scope

**In scope**:

- `src/app/api/q/share/route.ts` — add `GET` handler (list shares for current user) + `DELETE` handler (revoke a share by id)
- `src/components/share/share-manager.tsx` — new: UI component showing shared questions list with "Revoke" button per item (or add to an existing share page)
- Wire the management UI somewhere appropriate (Settings → Data tab, or a new "Shared Questions" section)

**Out of scope**:

- Batch revoke (select-all + delete)
- Share expiry (auto-expire after N days)
- Analytics (view count per share)

## Steps

### Step 1: Read the existing share infrastructure

Read `src/app/api/q/share/route.ts` to understand the POST handler pattern, auth, and data shape. Read `src/lib/db/data-access.ts` for the `sharedQuestions` accessor type. Determine whether shares are stored in Dexie, Appwrite, or both.

### Step 2: Add GET /api/q/share handler

If the POST handler uses `sharedQuestions` DataAccess, add a GET handler:

```ts
// In the same file or a separate GET route
export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "ShareList",
  execute: async ({ context }) => {
    const { userId } = context;
    const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
    const shares = await dexieDataAccess.sharedQuestions.where("userId").equals(userId).toArray();
    return { shares };
  },
});
```

This works if the share store is local Dexie. If it's Appwrite, query the Appwrite collection instead.

### Step 3: Add DELETE /api/q/share handler

```ts
export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "ShareDelete",
  execute: async ({ body }) => {
    const { shareId } = body as { shareId: string };
    if (!shareId) throw new HttpError(400, "shareId required");
    const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
    const share = await dexieDataAccess.sharedQuestions.get(parseInt(shareId, 10));
    if (!share) throw new HttpError(404, "Share not found");
    // Optional: verify ownership
    await dexieDataAccess.sharedQuestions.delete(parseInt(shareId, 10));
    return { ok: true };
  },
});
```

### Step 4: Build the management UI

Create `src/components/share/share-manager.tsx` — a component that:

1. Fetches `GET /api/q/share` on mount
2. Renders a list of shared questions (show question preview + share date)
3. Each item has a "Revoke" button that calls `DELETE /api/q/share`
4. Shows empty state: "No shared questions"
5. Shows count: "You have shared {N} question(s)"

Wire this into `Settings → Data tab` (the existing data management section) or into a new section under the quiz/learning settings.

### Step 5: Run typecheck + tests

Run `pnpm run typecheck` — 0 errors. Run `pnpm run test -- share` — all pass. Run `pnpm exec biome check --write` — 0 errors on changed files.

## Verification

1. Share a question via POST → GET `/api/q/share` returns it in the list
2. Revoke a share via DELETE → GET returns empty
3. Revoking a non-existent share returns 404
4. Unauthenticated requests to GET or DELETE return 401
