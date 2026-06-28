# Plan 059: Live Leaderboard via Appwrite Realtime

> **Executor instructions**: Design/spike plan. Investigate the current
> leaderboard infrastructure, prototype an Appwrite Realtime sync layer,
> and verify with integration tests. Do not build a full production
> leaderboard — define the data flow, wire one direction (local→remote),
> and validate with a working prototype.
>
> **Drift check (run first)**: `git diff --stat 169d3704..HEAD -- src/lib/services/leaderboard-service.ts src/app/[locale]/leaderboard/ src/lib/gamification-engine/`
> If any in-scope file changed, compare excerpts before proceeding.

## Status

- **Priority**: P2
- **Effort**: M (3 days)
- **Risk**: LOW — additive, no refactoring of existing leaderboard
- **Depends on**: 058 (cross-device sync) for gamification data reaching Appwrite
- **Category**: direction
- **Planned at**: commit `169d3704`, 2026-06-28

## Why this matters

The leaderboard at `/leaderboard` shows the current user at rank #1 with 10 local-only entries — it's a single-player scoreboard in a multiplayer app. Students in study groups want to see how their XP and streaks compare to peers. The gamification engine already tracks XP, streaks, and achievements; the data model just needs a shared sync path and a Realtime subscription to update rankings live.

## Current state

- `src/lib/services/leaderboard-service.ts` — `getLocalLeaderboard()` reads `lumni_total_xp` and `lumni_streak` from localStorage, returns top 10. `fetchLeaderboardFromServer()` calls `GET /api/leaderboard` which doesn't exist in the 44 route groups (it's a dead endpoint — returns empty `[]` on error).
- `src/app/[locale]/leaderboard/` — route exists with leaderboard page and client component.
- Gamification state is in Dexie (`gamification` table) + Zustand store — XP, streaks, achievements are tracked per-device.
- Appwrite Realtime subscriptions are proven in this codebase: Ably migration replaced 15s polling with real-time presence. Appwrite's own Realtime SDK (`client.subscribe()`) is also available via `appwrite` dependency.
- The sync handler pattern (Plan 058) will push gamification data to Appwrite. This plan builds the read/subscribe path.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `pnpm install`                   | exit 0              |
| Typecheck | `pnpm run typecheck`             | exit 0, no errors   |
| Tests     | `pnpm run test -- leaderboard`   | all pass            |
| Lint      | `pnpm exec oxlint`               | exit 0              |
| Build     | `pnpm run build`                 | exit 0              |

## Scope

**In scope**:
- `src/app/api/leaderboard/route.ts` — create real API endpoint that queries Appwrite for all users' gamification data
- `src/lib/services/leaderboard-service.ts` — refactor: replace localStorage with Appwrite-backed reads, wire Realtime subscription
- `src/hooks/use-leaderboard.ts` (create or update) — hook that subscribes to Appwrite Realtime channel `databases.{db}.collections.{gamification}.documents`
- `src/app/[locale]/leaderboard/leaderboard-client.tsx` — update to use new Realtime-powered hook
- `src/lib/gamification-engine/` — add a `syncToLeaderboard()` method that pushes XP snapshot to Appwrite (or rely on Plan 058's general sync)

**Out of scope**:
- Study-group-scoped leaderboards (only global for Phase 1)
- Historical leaderboard (weekly/monthly archives)
- Leaderboard rewards or achievement unlocks based on rank
- UI redesign of the leaderboard page

## Steps

### Step 1: Create the leaderboard API endpoint

Create `src/app/api/leaderboard/route.ts` using the `createRouteHandler` factory pattern (see `src/lib/api/create-route-handler.ts`):

```typescript
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/constants";
import { Query } from "appwrite";

export const GET = createRouteHandler({
  auth: "optional", // anonymous users can see leaderboard
  handler: async () => {
    const docs = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.GAMIFICATION,
      [Query.orderDesc("xp"), Query.limit(50)],
    );
    const entries = docs.documents.map((doc, i) => ({
      rank: i + 1,
      userId: doc.userId,
      label: doc.displayName ?? "Anonymous",
      xp: doc.xp ?? 0,
      streak: doc.currentStreak ?? 0,
      isCurrentUser: false, // set by client
    }));
    return { entries };
  },
});
```

This endpoint is P2 — it doesn't exist yet (`GET /api/leaderboard` returns nothing).

**Verify**: `curl http://localhost:3000/api/leaderboard` → `{ entries: [...] }`

### Step 2: Wire gamification data to Appwrite

In `src/lib/gamification-engine/service.ts`, after any mutation that changes XP or streak, sync to Appwrite:

```typescript
async syncToLeaderboard(userId: string): Promise<void> {
  const state = await this.getState(userId); // reads from Dexie
  const { xp, currentStreak, displayName } = state;
  try {
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.GAMIFICATION,
      userId, // use userId as doc ID for upsert
      { xp, currentStreak, displayName, updatedAt: new Date().toISOString() },
    );
  } catch {
    // Fail open
  }
}
```

Alternatively, if Plan 058's general sync path covers the `gamification` table, this step is just verifying the sync fires correctly.

**Verify**: Gamification mutation → Appwrite `gamification` collection has updated document

### Step 3: Create Realtime subscription hook

Create `src/hooks/use-leaderboard.ts`:

```typescript
import { useEffect, useState } from "react";
import { client } from "@/lib/appwrite";
import type { LeaderboardEntry } from "@/lib/services/leaderboard-service";

export function useLeaderboard(userId?: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial data from API
    fetch("/api/leaderboard")
      .then(r => r.json())
      .then(data => {
        const marked = data.entries.map((e: LeaderboardEntry) => ({
          ...e,
          isCurrentUser: e.userId === userId,
        }));
        setEntries(marked);
        setIsLoading(false);
      });

    // 2. Subscribe to Appwrite Realtime for live updates
    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTIONS.GAMIFICATION}.documents`;
    const unsubscribe = client.subscribe(channel, (response) => {
      // On any gamification document change, refresh the leaderboard
      fetch("/api/leaderboard")
        .then(r => r.json())
        .then(data => {
          const marked = data.entries.map((e: LeaderboardEntry) => ({
            ...e,
            isCurrentUser: e.userId === userId,
          }));
          setEntries(marked);
        });
    });

    return () => { unsubscribe?.(); };
  }, [userId]);

  return { entries, isLoading };
}
```

**Verify**: `pnpm run typecheck` → exit 0

### Step 4: Wire the hook into the leaderboard page

Update `src/app/[locale]/leaderboard/leaderboard-client.tsx` to use `useLeaderboard()` instead of the current `getLocalLeaderboard()` call. The component already renders a ranked list — only the data source changes.

**Verify**: Leaderboard page shows entries from Appwrite instead of localStorage

### Step 5: Write tests

Create `src/lib/services/__tests__/leaderboard-service.test.ts`:

- API endpoint returns ranked entries from Appwrite
- Realtime subscription refreshes entries on document change (mock `client.subscribe`)
- Sync sends gamification data to Appwrite
- Fail-open on Appwrite error — local data unaffected

**Verify**: `pnpm run test -- leaderboard` → all pass

### Step 6: Privacy check

Add a privacy gating step: only sync gamification data to the leaderboard if the user has consented to `dataSharing` (checked via `getDataSharingConsent()` from `src/lib/consent/ai-gate.ts`). This matches the existing consent-gating pattern used by TinyFish RAG.

In `syncToLeaderboard()`:
```typescript
const consent = await getDataSharingConsent();
if (!consent) return; // silently skip
```

**Verify**: Consent refused → `gamification` collection is not written for that user

## Test plan

- `src/lib/services/__tests__/leaderboard-service.test.ts` — 4-6 tests:
  - API returns ranked entries from mock Appwrite
  - Realtime subscription triggers re-fetch on document change
  - `syncToLeaderboard()` writes to Appwrite
  - Consent-gated: with consent=false, no Appwrite write
  - Fail-open on Appwrite network error

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test -- leaderboard` passes all new tests
- [ ] `GET /api/leaderboard` returns ranked entries from Appwrite
- [ ] `useLeaderboard()` hook fetches initial data and subscribes to Realtime
- [ ] Leaderboard page shows server-side entries with live updates
- [ ] Privacy gate prevents non-consenting users from appearing
- [ ] No out-of-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `client.subscribe()` is not available from the Appwrite SDK version used (check `package.json` `"appwrite"` version) — document and stop
- If `COLLECTIONS.GAMIFICATION` does not exist in Appwrite schema — stop and report
- If `GET /api/leaderboard` already exists and returns real data — the scope is smaller; report and adapt

## Maintenance notes

- This plan creates a naive "re-fetch on any change" pattern. For high-traffic scenarios, debounce the re-fetch (500ms) to avoid thundering herd on the leaderboard endpoint.
- The leaderboard currently shows 50 entries. Add pagination if study groups grow beyond that.
- Consider caching the leaderboard response with a short TTL (5s) to reduce Appwrite read load.
- Study-group-scoped leaderboards are the natural next step — filter by `groupId` on the gamification document.
