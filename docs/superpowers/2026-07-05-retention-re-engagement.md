# Personalized Re-engagement — Design

## Problem

All dormant users get the same generic push ("Come back and study!"). No personalization based on last-active subject, weakest topic, or time of day.

## Approach

Score dormant users on a re-engagement score, then select content based on user state + time of day.

## Trigger Conditions

A user is "dormant" if no quiz session in 3 days. Checked once daily via the notification scheduler.

## Re-engagement Score

```
score = daysSinceLastActive * 0.5 + previousStreakLength * 0.3 + subjectDiversity * 0.2
```

Higher score = more urgently needs re-engagement.

## Content Selection

Based on user's last-active subject, weakest topic, and time of day:

| Time              | Condition                  | Template                                                | Deep Link                         |
| ----------------- | -------------------------- | ------------------------------------------------------- | --------------------------------- |
| Morning (6-12)    | streak > 3                 | "Your [subject] streak is waiting!"                     | `/dashboard?subject=X`            |
| Afternoon (12-17) | competency < 60%           | "Quick quiz: [weakest topic] needs practice"            | `/quiz?subject=X&topic=Y&count=5` |
| Evening (17-22)   | daily challenge incomplete | "Today's challenge is ready"                            | `/dashboard`                      |
| Any               | dormant > 7 days           | "[Subject] misses you! Try a 5-question warmup"         | `/quiz?subject=X&count=5`         |
| Any               | dormant > 14 days          | "It's been a while! Here's your personalized refresher" | `/quiz?count=3`                   |

## Delivery

Via existing `sendLocalNotification()` in `src/lib/services/notification-service/push.ts`.

Notifications include deep links so tapping opens the correct screen.

## Suppression Rules

Users can dismiss a notification with "Don't show this again" which adds a rule to `suppressedRuleIds: string[]` in notification settings (stored in localStorage). Rule IDs match the template key (e.g. `"morning-streak"`, `"afternoon-weakest"`).

## Files

- `src/lib/retention/re-engagement.ts` — scoring + content selection logic
- Wired into notification scheduler via `initializeNotificationSchedulers()` (future)
