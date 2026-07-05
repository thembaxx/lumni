# Plan 102: Design spike — retention ecosystem v2

> **Executor instructions**: This is a design spike, not a full build. Investigate the existing gamification, notification, and streak infrastructure, then design and prototype three retention improvements. Produce working prototypes for at least one of the three, and document the remaining two.
>
> Run every verification command. If anything in "STOP conditions" occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat a8d53ec7..HEAD -- src/lib/gamification-engine/ src/lib/services/push-delivery.ts src/hooks/use-gamification.ts src/components/dashboard/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (design spike: 1-2 weeks)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a8d53ec7`, 2026-07-05

## Why this matters

Gamification is comprehensive: XP, levels, streaks, 50+ achievements, daily challenges, next-best-action card, wrong-answer re-encounter loop (per AGENTS.md Sessions 25, 32, 40). But the retention ecosystem beyond gamification has three gaps:

1. **Streak recovery was removed with premium** (Session 36) and never replaced. If a student misses one day, their streak resets to zero — causing abandonment after a single missed day.
2. **No social accountability** — study groups exist (Ably live sessions, leaderboard, challenges) but there are no group streaks, no study-buddy commitments, no shared goals. Solo gamification has a known decay curve.
3. **No personalized re-engagement** — push notifications are generic (daily digest, exam alerts). There's no "you haven't studied Physical Sciences in 3 days" nudges, no time-of-day optimization, no content-based reminders.

WhatsApp at 95% SA penetration is the clear next channel, but WhatsApp Business API integration (noted as "externally blocked" in TODO.md) is XL effort and has an external dependency. This spike focuses on what can be done with existing infra.

## Current state

**Streak mechanics** (`src/lib/gamification-engine/gamification-engine.ts`):

- Streaks tracked in `StoredGamification` as `currentStreak: number` and `longestStreak: number`
- Streak freeze was a premium feature — removed in Session 36
- `processQuizResult()` in `quiz-result-processor.ts` calls `gamification.checkAndUnlockAchievements()` which updates streaks
- No "grace period" or "streak recovery" concept exists

**Push notifications** (`src/lib/services/push-delivery.ts:1-127`):

- `sendToUser(userId, payload)` — sends web push to all user subscriptions
- `sendToAll(payload)` — broadcasts to all subscribers
- `scheduleDailyDigest()` exists in `notification-service.ts` — sends local notification with quiz count and avg score
- No personalization (no content-aware subject targeting)
- No time-of-day optimization
- No behavior-triggered notifications ("you haven't studied in 3 days")

**Study groups** (`src/lib/study-groups/`):

- Ably real-time presence, group challenges, leaderboard, messaging
- No group streaks, no study-buddy system, no shared learning goals
- Group formation is manual (no peer matching algorithm)

**Existing patterns to follow**:

- Gamification engine uses `Effect` for async composition in some paths — see `src/lib/gamification-engine/gamification-engine.ts`
- Notifications use the `PushDeliveryService` from `@/lib/services/push-delivery`
- The engine exposes `checkAndUnlockAchievements` with optional `extra` param pattern (Session 40)

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope** (produce designs and prototype for):

- **Streak recovery system**: A "streak shield" that protects 1 streak-break per week. Implementation options: (a) auto-shield on Sunday, (b) earn shield via daily challenge, (c) shield as achievement reward. Prototype option (a).
- **Personalized re-engagement notifications**: Time-of-day-aware, subject-targeted push notifications triggered by inactivity gaps. Prototype the trigger engine.
- **Social accountability (lightweight)**: Study-buddy commitments — student pairs set a shared study goal and get a notification when their buddy completes a session. Prototype the commitment API.

**Out of scope** (do NOT build in this spike):

- WhatsApp/SMS/email integration (XL effort, external dependency)
- Full peer-matching algorithm
- Group streaks for study groups (requires study groups architecture changes)
- Commitment deposit / study bets (monetization-dependent)
- In-app "nudge" messaging system (chat-based re-engagement)

## Steps

### Step 1: Design and prototype streak recovery

Design the streak shield:

1. **Data model**: Add `streakShields: number` to `StoredGamification` (already persisted per user via `gamification` Dexie table).
2. **Mechanic**: The player earns 1 streak shield per week (resets Monday 00:00). When they miss a day, the shield absorbs the break — streak continues, shield decrements. A second consecutive miss without shield resets streak.
3. **UI**: Show shield count on the streak card (`src/components/dashboard/streak-card.tsx`). Use ShieldIcon or a badge variant.
4. **Implementation**: In `gamification-engine.ts`, modify the streak-check logic to consume a shield before resetting. The existing `processDailyStreak()` function (or equivalent) should be the modification point — search for `currentStreak` in the engine.

**Prototype** (`src/lib/gamification-engine/gamification-engine.ts`):

```typescript
// In the streak-check logic — after detecting a missed day:
if (currentData.streakShields > 0) {
  currentData.streakShields--;
  // Do NOT reset currentStreak
} else {
  currentData.currentStreak = 0;
}
```

Add weekly shield grant in the daily cron/checkin logic.

**Verify**: Write a unit test in `src/lib/gamification-engine/__tests__/` — confirm a missed day with shield available does not reset streak, a second consecutive missed day does.

### Step 2: Design personalized re-engagement notifications

Design the trigger engine:

1. **Trigger conditions**: Monitor inactivity gaps per subject. If a user has studied subject X in the last 7 days but not in the last 3, send a nudge.
2. **Time-of-day optimization**: Determine user's most active hour from `analyticsEvents`. Send nudge 1 hour before their typical study time.
3. **Content-aware message**: Include the last topic studied and a suggestion: "You were doing great on Organic Chemistry — pick up where you left off?"
4. **Implementation**: A background job (existing job queue in `src/lib/orchestrator/`) that runs daily, queries Dexie for stale subjects per user, enqueues push notifications.

**Create prototype**: `src/lib/services/re-engagement-service.ts`:

- `checkInactiveSubjects(userId)` — returns subjects not studied in 3+ days
- `scheduleReEngagement(userId)` — computes optimal send time, schedules a local notification
- Wire into the existing daily digest scheduler in `notification-service.ts`

**Create**: `POST /api/engine/re-engagement` — admin-triggered or cron-triggered endpoint that runs the re-engagement check for all active users. Rate-limit to 1/day.

**Verify**: `pnpm run typecheck` exits 0. Run a dry-run version that logs intended notifications without sending.

### Step 3: Design lightweight social accountability

Design the study-buddy commitment system:

1. **Data model**: Dexie table `studyBuddyCommitments`: `id, userId, buddyUserId, subject, goal (dailyQuizCount), startDate, streak`.
2. **Flow**: User A invites User B (by username or share link). On accept, both set a shared goal (e.g., "complete 3 quizzes each this week"). Progress is tracked per-user, shown in a small card on the dashboard.
3. **Notifications**: When User A completes a session, User B gets a push: "Your study buddy [name] just finished a Physics quiz! Time to catch up."
4. **Implementation**: Lightweight — no real-time component needed. Dexie-backed, push-notification-driven. No Ably required.

**Create prototype**:

- `src/lib/services/study-buddy-service.ts` — `inviteBuddy()`, `acceptInvite()`, `trackProgress()`, `sendBuddyNotification()`
- `POST /api/study-buddy/invite` — send invite
- `POST /api/study-buddy/accept` — accept invite
- Dashboard card component (sketch/wireframe — full implementation deferred)

**Verify**: `pnpm run typecheck` exits 0. `pnpm run test` — at minimum, write unit tests for the buddy service commitment tracking logic.

## Deliverables

- [ ] Streak shield prototype (modified `gamification-engine.ts` + test)
- [ ] `docs/superpowers/2026-07-05-streak-recovery.md` — streak shield design doc
- [ ] `src/lib/services/re-engagement-service.ts` — re-engagement trigger engine
- [ ] `docs/superpowers/2026-07-05-re-engagement-notifications.md` — notification personalization design
- [ ] `src/lib/services/study-buddy-service.ts` — study buddy API
- [ ] `docs/superpowers/2026-07-05-study-buddy-commitments.md` — social accountability design

## Done criteria

ALL must hold:

- [ ] Streak shield prototype compiles, test confirms shield absorbs one missed day
- [ ] Re-engagement service compiles and dry-run logs correctly
- [ ] Study buddy service defines and exports all planned functions
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` passes, including new tests for streak shield
- [ ] `pnpm exec oxlint` exits 0

## STOP conditions

Stop and report back if:

- The streak shield modifies gamification achievement logic that has achievement-dependent tests (check `test("streak"` in `src/lib/gamification-engine/` first)
- The re-engagement service requires adding new Dexie indexes (permissions concern — stop and report the proposed schema)
- Study buddy commitments need real-time presence (they shouldn't — design is push-notification driven)
- The project already has a streak recovery mechanic that was missed in recon (check `src/lib/gamification-engine/` for `streakShield`, `freeze`, or `grace`)

## Maintenance notes

- Streak shield should feel earned, not automatic. The weekly refresh gives a reason to return each Monday.
- Re-engagement notifications must respect existing opt-in consent flows. Check `src/lib/consent/` for notification consent — don't send re-engagement pushes to users who opted out.
- Study buddy system should integrate with the existing study groups architecture when plan 038 (community features) is eventually executed.
- All three features should be instrumented with the `analyticsEvents` table so their impact can be measured (connects to plan 100's business metrics dashboard).
