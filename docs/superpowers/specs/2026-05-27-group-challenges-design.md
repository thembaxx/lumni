# Group Challenges & Competitions

**Date:** 2026-05-27
**Status:** Approved

## Overview

Add weekly auto-generated challenges to study groups with intra-group member leaderboards and inter-group competition. Members earn a combined score (XP, questions answered, accuracy) through normal study activity. Top performers each week earn XP bonuses and exclusive badges.

## Data Model

### New Appwrite Collections

#### `group_challenges`

| Field       | Type                      | Description             |
| ----------- | ------------------------- | ----------------------- |
| `$id`       | string                    | Auto-generated          |
| `groupId`   | string                    | FK to `study_groups`    |
| `weekStart` | string                    | ISO date (Monday 00:00) |
| `weekEnd`   | string                    | ISO date (Sunday 23:59) |
| `status`    | `"active" \| "completed"` | Challenge life cycle    |
| `createdAt` | string                    | ISO timestamp           |

#### `group_challenge_entries`

| Field               | Type   | Description               |
| ------------------- | ------ | ------------------------- |
| `$id`               | string | Auto-generated            |
| `challengeId`       | string | FK to `group_challenges`  |
| `groupId`           | string | Denormalized for queries  |
| `userId`            | string | Appwrite user ID          |
| `xpEarned`          | number | Total XP earned this week |
| `questionsAnswered` | number | Questions completed       |
| `accuracy`          | number | Rolling accuracy 0–100    |
| `combinedScore`     | number | 0–100 weighted score      |
| `updatedAt`         | string | ISO timestamp             |

#### `group_badges`

| Field         | Type                             | Description          |
| ------------- | -------------------------------- | -------------------- |
| `$id`         | string                           | Auto-generated       |
| `groupId`     | string                           | FK to `study_groups` |
| `userId`      | string                           | Badge recipient      |
| `name`        | string                           | Badge name           |
| `description` | string                           | Badge description    |
| `icon`        | string                           | Emoji or icon name   |
| `tier`        | `"bronze" \| "silver" \| "gold"` | Badge tier           |
| `earnedAt`    | string                           | ISO timestamp        |

### New Dexie Tables (v23)

- `groupChallenges: "&id, groupId, weekStart, status"`
- `groupChallengeEntries: "&id, challengeId, groupId, userId"`
- `groupBadges: "&id, groupId, userId, tier"`

## Score Calculation

Combined score per member (computed on update):

```
xpScore = (memberXp / max(1, groupTotalXp)) * 50
questionScore = (memberQuestions / max(1, groupTotalQuestions)) * 30
accuracyScore = (memberAccuracy / 100) * 20
combinedScore = xpScore + questionScore + accuracyScore
```

Group total score = sum of all member combined scores.

## Flows

### Challenge Generation

1. User navigates to `/study-groups/[groupId]`
2. Service checks for active challenge: `status=active AND weekStart <= now <= weekEnd`
3. If none exists, create one spanning the current ISO week (Mon–Sun)

### Score Tracking

1. Extended in `trackQuestionResult()` — after gamification XP update, call `updateChallengeEntries(userId, xpGained, questionsCount, accuracy)`
2. This upserts the user's entry in all active challenges across all their groups
3. Combined score is recomputed on each update

### Weekly Close

1. On first visit after week ends, the completed challenge is closed (`status=completed`)
2. Top 3 members get badges (bronze/silver/gold)
3. Top 3 groups get group-level badges
4. XP bonus awarded proportional to rank (100/75/50 XP)
5. A new challenge is created for the current week

## UI Components

### Group Detail Page Additions

- **ChallengeBanner** — shows week label, progress bar, days remaining at top of page
- **ChallengeLeaderboard** — tab panel showing member rankings with scores
- **BadgeDisplay** — earned badges shown on member list items

### New Page

- **`/study-groups/leaderboard`** — inter-group rankings with all groups sorted by combined score, weekly period indicator, group badges

### Group Card Updates

- Each card on `/study-groups` shows compact weekly rank and progress indicator

## Backend: New API Routes

| Method | Route                                   | Purpose                        |
| ------ | --------------------------------------- | ------------------------------ |
| GET    | `/api/study-groups/[groupId]/challenge` | Get active challenge + entries |
| GET    | `/api/study-groups/[groupId]/badges`    | List group badges              |
| GET    | `/api/study-groups/leaderboard`         | Inter-group leaderboard        |

## Dependencies

- Existing `trackQuestionResult()` in orchestrator
- Existing gamification XP tracking
- Existing study groups service

## Out of Scope (v1)

- Manual challenge creation by admins
- Custom challenge goals/targets
- Push notifications for challenge events
- Challenge history archive beyond current + last week
