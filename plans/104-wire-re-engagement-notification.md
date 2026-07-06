# Plan 104: Wire re-engagement engine into notification schedulers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7bb0d688..HEAD -- src/lib/services/notification-service/alert-schedulers.ts src/lib/retention/re-engagement.ts src/lib/services/re-engagement-service.ts`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `7bb0d688`, 2026-07-06
- **Issue**: (omit unless published via `--issues`)

## Why this matters

The platform has a complete re-engagement notification engine (`re-engagement.ts` with 8 time-of-day-aware templates, suppression rules, weakest-topic deep links, and a tested service layer) that is built but never called. `initializeNotificationSchedulers()` triggers 6 notification types (study reminders, streak alerts, weekly progress, daily digest, assignment reminders, exam alerts) but re-engagement is absent. Every dormant user (3+ days inactive) gets generic notifications instead of personalized deep-links to their weakest topic. This is S effort and the highest-leverage retention fix in the codebase.

## Current state

1. **`src/lib/services/notification-service/alert-schedulers.ts:218-231`** — `initializeNotificationSchedulers()` calls 6 schedulers:

```ts
export function initializeNotificationSchedulers(): void {
  const settings = getSettings();
  if (!settings.enabled) return;

  scheduleStudyReminder(settings);
  scheduleStreakAlert(settings);

  if (typeof window !== "undefined" && "indexedDB" in window) {
    scheduleWeeklyProgress(settings);
    scheduleDailyDigest(settings);
    scheduleAssignmentReminders(settings);
    scheduleExamAlertsFromSession(settings);
  }
}
```

2. **`src/lib/retention/re-engagement.ts:1-107`** — Pure functions: `calculateReEngagementScore()`, `getTimeOfDay()`, `selectReEngagementContent()` with 6 template rules (`morning-streak`, `afternoon-weakest`, `evening-challenge`, `long-dormant-7`, `long-dormant-14`, `long-dormant-30`). No side effects.

3. **`src/lib/services/re-engagement-service.ts:1-179`** — `ReEngagementService` class with `checkAndNotify(userId)`, `getInactiveSubjects()`, `generateMessage()`, `getOptimalSendTime()`. Constructor takes `{ db: ObservabilityDataAccess }`. The `checkAndNotify` method reads from `analyticsEvents`, calls `generateMessage()`, but does NOT send a notification — it only returns `{ notified, message, deepLink }`.

4. **`src/lib/services/notification-service/push.ts`** — Exports `sendLocalNotification(title, body, deepLink?)`.

5. **Repo conventions**: All schedulers in `alert-schedulers.ts` follow the same pattern: early-return guard, read settings, call `sendLocalNotification()`, persist suppression with `saveToStorage()`. Error handling uses `logError()` and never throws. Import paths use `@/lib/` aliases.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`      | exit 0, no errors   |
| Tests     | `pnpm run test`           | all pass (1843+)    |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `src/lib/services/notification-service/alert-schedulers.ts` — add `scheduleReEngagement()` function and call it from `initializeNotificationSchedulers()`
- `src/lib/retention/re-engagement.ts` — no changes (read-only, import from it)

**Out of scope** (do NOT touch):

- `src/lib/services/re-engagement-service.ts` — the service class exists but this plan uses the pure functions in `re-engagement.ts` directly, consistent with the existing scheduler pattern that doesn't use service classes
- `src/lib/services/notification-service/settings.ts` — no new user-facing toggle needed; re-engagement fires whenever notifications are enabled
- Any UI component, settings page, or user-facing toggle

## Git workflow

- Branch: `advisor/104-wire-re-engagement`
- Commits: one commit per step, conventional commit style (`feat: ...`, `test: ...`)
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Import and add `scheduleReEngagement()` in `alert-schedulers.ts`

Add an import for `selectReEngagementContent` and `type ReEngagementContext` from `@/lib/retention/re-engagement`. Then add a new `scheduleReEngagement` function before `initializeNotificationSchedulers`.

The function should:

1. Check `settings.enabled` and return early if false (consistent with other schedulers)
2. Read `ReEngagementContext` from Dexie competency and gamification data
3. Call `selectReEngagementContent(ctx)` — which returns `ReEngagementContent | null`
4. If non-null, call `sendLocalNotification(rule.title, rule.body, rule.deepLink)`
5. Wrap in try/catch with `logError("ScheduleReEngagement", err)`

The context-building logic should query:

- `getDeps().db.quizAttempts` to find `daysSinceLastActive` (latest `completedAt`), `lastActiveSubject`, `weakestTopic` (lowest score), and `subjectDiversity` (unique subjects count)
- `getGamificationData()` for `streak`
- `loadFromStorage<string[]>('lumni_reengagement_suppressed', [])` for `suppressedRuleIds`

Key detail: keep `scheduleReEngagement` as a standalone async function inside `alert-schedulers.ts` (do NOT create a new file), matching the pattern of the 6 existing schedulers. Import `selectReEngagementContent` and `ReEngagementContext` from the existing retention module.

**Verify**:

```bash
pnpm exec oxlint
# → exit 0
pnpm run typecheck
# → exit 0
```

### Step 2: Wire into `initializeNotificationSchedulers()`

Add `scheduleReEngagement(settings)` call inside the `initializeNotificationSchedulers()` function, placed after `scheduleStreakAlert(settings)` and before the `indexedDB` block. Re-engagement should fire even when IndexedDB is unavailable (it uses only already-loaded data).

```ts
export function initializeNotificationSchedulers(): void {
  const settings = getSettings();
  if (!settings.enabled) return;

  scheduleStudyReminder(settings);
  scheduleStreakAlert(settings);
  scheduleReEngagement(settings); // ← add this line

  if (typeof window !== "undefined" && "indexedDB" in window) {
    scheduleWeeklyProgress(settings);
    scheduleDailyDigest(settings);
    scheduleAssignmentReminders(settings);
    scheduleExamAlertsFromSession(settings);
  }
}
```

**Verify**:

```bash
pnpm run typecheck
# → exit 0, no errors
```

### Step 3: Run full test suite and lint

**Verify**:

```bash
pnpm run test
# → 1843+ pass, 0 failures
pnpm exec oxfmt --check
# → exit 0
```

## Test plan

No new test file needed. The existing notification-service tests exercise `initializeNotificationSchedulers()` — confirm they still pass. The `selectReEngagementContent` function in `re-engagement.ts` already has unit tests (verify with `pnpm run test -- --grep "re-engagement"` or similar grep).

If you find that `selectReEngagementContent` has no test coverage, add one test file:

- `src/lib/retention/__tests__/re-engagement.test.ts` — model after `src/lib/competency-engine/__tests__/track-result.test.ts` (simple vitest tests, pure function, no mocks)

Test cases for `selectReEngagementContent` (if adding new tests):

1. Returns `long-dormant-14` when `daysSinceLastActive > 14`
2. Returns `long-dormant-7` when `daysSinceLastActive > 7` and <= 14
3. Returns `null` when `daysSinceLastActive <= 3`
4. Returns `morning-streak` in morning with streak > 3
5. Returns `afternoon-weakest` in afternoon with a topic scoring < 60
6. Respects `suppressedRuleIds` (returns `null` when the matching rule is suppressed)

## Done criteria

ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm exec oxfmt --check` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `alert-schedulers.ts` has a new `scheduleReEngagement()` function that builds `ReEngagementContext` from Dexie and calls `selectReEngagementContent()`
- [ ] `initializeNotificationSchedulers()` calls `scheduleReEngagement(settings)`
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `alert-schedulers.ts:218-231` doesn't match the excerpt above (the function signature or call sites changed)
- `re-engagement.ts` doesn't export `selectReEngagementContent` or `ReEngagementContext`
- `getGamificationData` is not exported from `./reminder-builder` (confirm it exists before starting)
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

- The `scheduleReEngagement` function does NOT add a new user-facing toggle — it fires whenever notifications are enabled. If the product team wants a dedicated toggle later, it would go in `NotificationSettings` and this function would check `settings.reEngagement`.
- If the `retention/re-engagement.ts` module is refactored, the `selectReEngagementContent` function signature must stay compatible with this caller.
- Suppression rules are stored in localStorage as `'lumni_reengagement_suppressed'` — if the notification system migrates to Dexie, this key must be migrated.
