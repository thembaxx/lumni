# Plan 182: Wire Live Study Sessions to Gamification and Leaderboard

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/components/study-groups/live-session-bar.tsx src/hooks/use-live-session.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Live study sessions manage Ably presence (join/leave/activity) but produce zero side effects into gamification, leaderboard, or wrong-answer journal. Activity labels ("Studying", "Taking Quiz", "Reviewing") are purely cosmetic. Students studying together get no XP, no achievement progress, and no leaderboard points for collaborative sessions. The gamification infrastructure (`GamificationService`, `leaderboardService`) is ready — just not wired.

## Current state

In `src/components/study-groups/live-session-bar.tsx`, presence events (enter/leave/update) only manage the Ably room state and display. No calls to:

- `gamificationService.addXp()` or `deps.checkAndUnlockAchievements()`
- `leaderboardService.recordActivity()`
- Wrong-answer journal

The pattern to follow: `src/lib/services/quiz-result-processor/bolt.ts` fires gamification events on quiz completion.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/components/study-groups/live-session-bar.tsx` — add gamification hooks

## Steps

### Step 1: Add gamification on session join

When a user joins a live session (enters presence), add a small XP award proportional to session duration or simply a participation award:

```typescript
// On presence enter
deps.checkAndUnlockAchievements?.();
```

### Step 2: Add gamification on session end

When a user leaves a live session or the session ends, calculate session duration and award XP:

```typescript
// On presence leave / session end
if (durationMinutes > 10) {
  deps.addXp?.(Math.floor(durationMinutes / 10) * 5); // 5 XP per 10 minutes
}
```

### Step 3: Add leaderboard recording

When a user completes a study activity ("Taking Quiz" status), record on the leaderboard:

```typescript
leaderboardService
  .recordActivity({
    userId,
    activityType: "live-session",
    points: 10,
  })
  .catch(() => {});
```

**Verify**: `rg "addXp\|checkAndUnlockAchievements\|recordActivity" src/components/study-groups/live-session-bar.tsx` → 2+ matches

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests should pass. Add a test that verifies gamification events fire on presence enter/leave. Use the `useLiveSession` hook's mocks following the pattern in `src/components/study-groups/__tests__/`.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Joining a live session awards XP or triggers achievement check
- [ ] Leaving after 10+ minutes awards session-duration XP
- [ ] "Taking Quiz" activity records to leaderboard
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live session bar component doesn't have access to the gamification hook or services
- The presence callback signatures differ from expected
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

XP values (5 XP per 10 minutes) are initial estimates — tune based on user behavior. The live session should also eventually feed into the wrong-answer journal if quiz questions were attempted during the session.
