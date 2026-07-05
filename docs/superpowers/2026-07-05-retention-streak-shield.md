# Streak Shield — Design

## Problem

A single missed day resets a 30-day streak. Users report this as demotivating — they lose months of progress because of one busy day.

## Data Model

Already in `StoredGamification` (`src/lib/gamification-engine/types.ts`):

```ts
streakFreezes: number;          // available freeze shields
```

Existing default: 3 freezes. Milestone streaks (3, 7, 14, 30, 60, 100) each grant +1 freeze when unlocked (`streak-utils.ts:34`).

### Proposed additions

```ts
streakFreezeUsedToday: boolean; // true when a freeze was consumed today
freezeEvents: FreezeEvent[];    // log of freeze usage
```

## Earning Freezes

| Source | Count | When |
|---|---|---|
| Initial grant | 3 | First gamification load |
| Streak milestones | 1 each | Unlocking 3/7/14/30/60/100 day milestones (already implemented) |
| Weekly auto-grant | 1 | Every Monday (new — `addWeeklyFreeze()` in gamification engine) |
| Achievements | Various | Future achievement definitions |
| In-app purchase | Via store | Future — `POST /api/retention/streak-freeze/purchase` stub |

## Auto-Application

Already implemented in `streak-utils.ts:updateStreak()`:

```
If lastPracticeDate !== yesterday && lastPracticeDate !== today:
  If currentStreak > 1 && streakFreezes > 0:
    streakFreezes -= 1
    freezeConsumed = true
  Else:
    currentStreak = 1
```

When a freeze is consumed, the user sees a toast: "Your streak was saved by a freeze! ❄️"

## Weekly Auto-Grant

Add `addWeeklyFreeze()` to the gamification engine. Called on first practice of the week (Monday detection). Uses localStorage key `lumni_last_freeze_grant_week` to avoid duplicate grants.

## API

```
POST /api/retention/streak-freeze/purchase   { count: number } → stub (returns 501)
```

## UI Notes

- Streak card on dashboard shows shield icon + remaining freeze count
- When freeze is consumed, toast notification `"Your streak was saved by a freeze!"`
- Streak card tooltip explains how freezes work
- Settings page shows freeze inventory and how to earn more
