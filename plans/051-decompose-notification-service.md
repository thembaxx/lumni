# Plan 051: Decompose notification-service.ts god module

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/services/notification-service.ts`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (many callers — each extracted function must keep identical API)
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`notification-service.ts` is a 539-line file mixing 7 concerns: notification settings management, push subscription logic, local notification dispatching, study reminders, streak alerts, weekly progress, assignment alerts, exam alerts, and scheduler initialization. It imports from `flashcardEngine` at module-level (line 6) and `dexieDataAccess` directly, creating hard dependencies. Any change to push infrastructure risks breaking unrelated features.

## Current state

File: `src/lib/services/notification-service.ts` (539 lines).

The file contains:

1. Module-level `_deps` pattern (line 9): `let _deps: { db: NotifDb } = DEFAULT_DEPS`
2. `NotificationSettings` interface + defaults (lines 23-40)
3. Settings persistence via localStorage (lines 42-65)
4. Push subscription management (lines 69-139)
5. Local notification dispatch (lines 148-164)
6. `scheduleNextReminder()` + study reminder scheduling (lines 166-282)
7. Streak alert scheduling (lines 307-328)
8. Weekly progress scheduling (lines 330-378)
9. Assignment alert scheduling (lines 380-430)
10. Daily digest scheduling (lines 432-464)
11. Exam alert scheduling (lines 481-530)
12. `initializeNotificationSchedulers()` + scheduler init (lines 466-479)

All callers: `dashboard-client.tsx`, `onboarding-wizard.tsx`, `settings-client.tsx`, `exam-dates/service.ts`, `digest-service.ts`, `submission-service.ts`.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope** (create these new files):

- `src/lib/notifications/settings.ts`
- `src/lib/notifications/push-subscription.ts`
- `src/lib/notifications/scheduler.ts`
- `src/lib/notifications/digest.ts`
- `src/lib/notifications/exam-alerts.ts`

**Modified**:

- `src/lib/services/notification-service.ts` — thin re-export barrel

**Out of scope**:

- Changes to the public API of `notification-service.ts` — all existing exports must still work
- Any UI component or hook file
- Adding new notification features

## Steps

### Step 1: Create settings.ts

Extract `NotificationSettings` interface, `DEFAULT_SETTINGS`, `loadSettings()`, `saveSettings()`, and the `NOTIF_SETTINGS_KEY` constant:

```typescript
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

const NOTIF_SETTINGS_KEY = "lumni_notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  studyReminders: boolean;
  streakAlerts: boolean;
  quizReminders: boolean;
  achievementNotifications: boolean;
  weeklyProgress: boolean;
  reminderHour: number;
  examAlerts: boolean;
  assignmentDue: boolean;
  marketing: boolean;
  dailyDigest: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = { ... };

export function loadSettings(): NotificationSettings { ... }
export function saveSettings(s: NotificationSettings): void { ... }
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create push-subscription.ts

Extract push subscription management (subscribe, unsubscribe, getSubscription, `NOTIF_KEY` constant):

```typescript
const NOTIF_KEY = "lumni_notification_subscription";

export async function subscribeToPush(): Promise<boolean> { ... }
export async function unsubscribeFromPush(): Promise<void> { ... }
export function getPushSubscription(): PushSubscription | null { ... }
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Create scheduler.ts

Extract the scheduling infrastructure (`scheduleNotification`, `cancelNotification`, `scheduleNextReminder`, the study reminder logic):

```typescript
export function scheduleNotification(id: string, ...) { ... }
export function cancelNotification(id: string): void { ... }
export function scheduleNextReminder(settings: NotificationSettings, ...): void { ... }
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Create digest.ts + exam-alerts.ts

Extract the weekly progress, daily digest, and exam alert scheduling functions. Each of these is a self-contained module.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Rewrite notification-service.ts as barrel

Replace the full file with re-exports:

```typescript
export {
  type NotificationSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "@/lib/notifications/settings";
export {
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from "@/lib/notifications/push-subscription";
export {
  scheduleNotification,
  cancelNotification,
  scheduleNextReminder,
} from "@/lib/notifications/scheduler";
export { scheduleWeeklyProgress, scheduleDailyDigest } from "@/lib/notifications/digest";
export { scheduleExamAlerts } from "@/lib/notifications/exam-alerts";
export { initializeNotificationSchedulers } from "@/lib/notifications/scheduler";
```

Make sure `initializeNotificationSchedulers()` (the entry point) is exported from the barrel and lives in `scheduler.ts`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 6: Verify all callers still work

```bash
pnpm exec grep -rn "from.*notification-service" src/ --include="*.ts" --include="*.tsx"
```

Each caller should still find the named exports from the barrel.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] 5 new files created under `src/lib/notifications/`
- [ ] `notification-service.ts` is a thin barrel (<20 lines)
- [ ] All existing named exports from `notification-service.ts` still work
- [ ] The module-level `flashcardEngine` import is only in the file that needs it (not the barrel)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A consumer imports from `@/lib/services/notification-service` but expects a default export (there isn't one)
- The decomposition reveals cross-concern coupling (e.g., scheduler called from within settings loading) — keep the coupling in the barrel, move the independent code
- `initializeNotificationSchedulers()` references internal state from multiple extracted modules — keep it in `scheduler.ts` and import the other module's functions
