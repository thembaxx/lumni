# Plan 076: Live Competitive Leaderboard (Individual + Per-Subject)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 53532ff1..HEAD -- src/lib/competitions/ src/components/dashboard/competition-card.tsx src/types/gamification.ts src/lib/gamification-engine/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Category**: direction
- **Depends on**: none
- **Planned at**: commit `53532ff1`, 2026-07-02

## Why this matters

The competition system stores weekly XP in local-only Dexie, ranks by reading ALL entries into memory and sorting — no cross-device sync, no per-subject rankings, no friend comparisons. The dashboard's `CompetitionCard` shows only top 3 from local data. The 28 achievements have zero competitive entries. Cross-device sync was shipped in Session 50. This plan builds an Appwrite-backed live leaderboard with per-subject rankings and competitive achievements — a major engagement driver for competitive Matric students.

## Current state

- `src/lib/competitions/service.ts:46-70` — `getLeaderboard()` reads ALL entries from `competitionScores` Dexie table into memory via `.toArray()` and sorts in JS. No Appwrite persistence.
- `src/lib/competitions/service.ts:18-44` — `recordXp()` writes to local Dexie only.
- `src/components/dashboard/competition-card.tsx:22-26` — `useQuery` fetches from local-only `getLeaderboard`, `refetchInterval: 60000`.
- `src/types/gamification.ts:73-371` — 28 achievements across 5 categories: streak, accuracy, volume, subject, special. Zero competitive entries.
- `src/lib/gamification-engine/gamification-engine.ts` — `checkAndUnlockAchievements()` accepts optional `extra` param, reads tracking fields from `StoredGamification.data`.
- `src/lib/sync/` — cross-device sync infrastructure exists (Session 50).

**Repo conventions to follow**:
- API routes use `createRouteHandler()` factory from `@/lib/api/create-route-handler.ts` — see existing routes for pattern
- Error handling uses `logError()` from `@/lib/shared/logger`
- Achievements follow the existing shape in `src/types/gamification.ts` with `id, name, description, icon, xpReward, rarity, category, requirement`
- Gamification engine checks go in `checkAndUnlockAchievements()` following the pattern of existing achievement checks

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|--------------------------------|---------------------|
| Typecheck | `pnpm run typecheck`           | exit 0              |
| Tests     | `pnpm run test`                | exit 0              |
| Lint      | `pnpm exec oxlint --fix`       | exit 0              |

## Scope

**In scope**:
- `src/lib/competitions/service.ts` — add `recordXpPerSubject()`, `getLeaderboardBySubject()`, add sync-to-Appwrite
- `src/app/api/leaderboard/route.ts` — new: `GET` returns ranked entries, `POST` syncs local XP
- `src/components/dashboard/competition-card.tsx` — fetch from API, add subject filter tabs
- `src/types/gamification.ts` — add 2-3 competitive achievements
- `src/lib/gamification-engine/gamification-engine.ts` — wire achievement checks
- `src/lib/gamification-engine/service.ts` — forward extra params for competitive achievements

**Out of scope**:
- Real-time push via Appwrite Realtime (deferred to a follow-up)
- Friend comparison / social features (deferred)
- WhatsApp leaderboard sharing
- Changes to `src/lib/study-groups/` or group-level leaderboard

## Steps

### Step 1: Add per-subject XP tracking

Extend `src/lib/competitions/service.ts`:

1. Add `recordXpPerSubject(userId: string, subjectId: string, xp: number): Promise<void>` — stores XP keyed by `userId + subjectId` in the existing `competitionScores` table or a new `subjectScores` table. Use the same week-range logic as `recordXp()`.
2. Add `getLeaderboardBySubject(subjectId: string): Promise<{ userId, xpEarned, rank }[]>` — filters local entries by subject.
3. Add `syncScoresToAppwrite(userId: string): Promise<void>` — pushes current-week scores to Appwrite `leaderboard` collection. Use `node-appwrite` `database.createDocument()` for upsert. Fail silently on error.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create leaderboard API route

Create `src/app/api/leaderboard/route.ts`:

- `GET /api/leaderboard?subject=mathematics&limit=50&offset=0` — returns `{ entries: { userId, xpEarned, rank }[], total: number }`. Reads from Appwrite-backed data. If Appwrite fails, falls back to local Dexie.
- `POST /api/leaderboard/sync` — body: `{ userId }`. Calls `syncScoresToAppwrite()`. Returns `{ ok: true }`.

Use `createRouteHandler()` factory from `@/lib/api/create-route-handler.ts` with `AuthMode.Optional`. Model after an existing route like `src/app/api/exam-dates/route.ts`.

**Verify**: `pnpm run typecheck` → exit 0. Route responds to `GET` and `POST`.

### Step 3: Refactor CompetitionCard

Update `src/components/dashboard/competition-card.tsx`:

1. Change `queryFn` from `getLeaderboard` (local Dexie) to fetch from `/api/leaderboard`. Keep `refetchInterval: 60000`.
2. Add subject filter tabs row: "All", "Mathematics", "Physical Sciences", "Life Sciences", "Accounting", "Geography" — clicking a tab refetches with `?subject=X`.
3. Show top 10 instead of top 3 in a scrollable list. Keep medal icons for 1st-3rd. Show rank number for 4th-10th.
4. Highlight the current user's row with an accent background.
5. Keep the time-remaining display. Move rank card link to a "View Full Leaderboard" button that navigates to `/leaderboard` (create a placeholder route if one doesn't exist — just redirect to `/study-groups`).

**Verify**: `pnpm run typecheck` → exit 0. Card shows live data with subject filter.

### Step 4: Add competitive achievements

Add to `src/types/gamification.ts` inside the `ACHIEVEMENTS` array:

```ts
{
  id: "leaderboard_top_50",
  name: "Rising Competitor",
  description: "Reach the top 50 on the weekly leaderboard",
  icon: "📊",
  earnedAt: null,
  xpReward: 100,
  rarity: "rare",
  category: "special",
  requirement: 50,
},
{
  id: "leaderboard_top_10",
  name: "Elite Performer",
  description: "Reach the top 10 on the weekly leaderboard",
  icon: "🏅",
  earnedAt: null,
  xpReward: 300,
  rarity: "epic",
  category: "special",
  requirement: 10,
},
{
  id: "leaderboard_subject_top_10",
  name: "Subject Champion",
  description: "Reach the top 10 in any subject leaderboard",
  icon: "🎯",
  earnedAt: null,
  xpReward: 200,
  rarity: "rare",
  category: "special",
  requirement: 10,
},
```

### Step 5: Wire achievement checks

In `src/lib/gamification-engine/gamification-engine.ts`, within `checkAndUnlockAchievements`:
- After existing checks, if `extra` contains `leaderboardRank`, check all three leaderboard achievements:
  - `leaderboard_top_50`: `extra.leaderboardRank <= 50`
  - `leaderboard_top_10`: `extra.leaderboardRank <= 10`
- If `extra` contains `subjectLeaderboardRank` (per-subject), check `leaderboard_subject_top_10`.

In `src/lib/gamification-engine/service.ts`, forward the new extra fields from call sites.

In `src/components/dashboard/competition-card.tsx`, after fetching the leaderboard, call `gamification.checkAndUnlockAchievements({ extra: { leaderboardRank: myRank, subjectLeaderboardRank: mySubjectRank } })` inside a `useEffect`.

**Verify**: `pnpm run typecheck` → exit 0. Achievements unlock when rank thresholds are met.

## Test plan

- Update `src/lib/competitions/__tests__/service.test.ts` — add tests for `recordXpPerSubject()`, `getLeaderboardBySubject()`, `syncScoresToAppwrite()` (mock Appwrite).
- `vitest run src/lib/competitions/` → all pass.

## Done criteria

- [ ] `GET /api/leaderboard` returns ranked entries from Appwrite with subject filter
- [ ] `CompetitionCard` shows top 10 with subject tabs and live data
- [ ] 3 new competitive achievements exist in `src/types/gamification.ts`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The Appwrite `leaderboard` collection doesn't exist in the schema or `ensure-schema.ts` (stop and add it before proceeding).
- The `competitionScores` Dexie table doesn't have a `subjectId` field (stop and evaluate schema migration vs. separate table).
- The achievement checking pattern in `gamification-engine.ts` has changed significantly from what's described.

## Maintenance notes

- Subject tabs in `CompetitionCard` should derive from the user's enrolled subjects (from `useAuth` or onboarding subjects), not be hardcoded.
- Weekly reset: the `getWeekRange()` function already resets Monday. When week rolls over, old scores remain in Appwrite for history but new week starts fresh.
- A future enhancement could add real-time leaderboard updates via Appwrite Realtime.
