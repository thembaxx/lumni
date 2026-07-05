# Study Buddy Commitments — Design

## Problem

No way to commit to a study buddy or share goals. Learning is solitary — no social accountability mechanism.

## Data Model

Dexie table `studyCommitments` (v33):

```ts
interface StudyCommitment {
  id: string; // nanoid
  userId: string; // creator / user A
  buddyUserId: string; // invited user / user B
  subject: string; // shared study subject
  targetDailyMinutes: number; // e.g. 30
  startDate: string; // ISO date
  endDate: string | null; // ISO date (null = ongoing)
  status: "pending" | "active" | "declined" | "ended";
  sharedStreak: number; // consecutive days both completed
  lastSharedDate: string | null; // last date both practised
  createdAt: string; // ISO
}
```

## Flow

1. **Invite**: User A calls `POST /api/study-buddies/commit` with `{ buddyUserId, subject, targetDailyMinutes }` → creates commitment with `status: "pending"`
2. **Accept/Decline**: User B receives notification (push or in-app). Calls `PATCH /api/study-buddies/commitments/[id]` with `{ action: "accept" | "decline" }`
3. **Daily check**: Each day, both users must complete their target minutes on the shared subject. If both do, `sharedStreak` increments. If one misses, streak resets to 0 for both.
4. **End**: Either user calls `DELETE /api/study-buddies/commitments/[id]`

## Shared Streak Logic

Checked once daily. For each active commitment:

```
If both users had a practice session yesterday on the shared subject
  with >= targetDailyMinutes:
    sharedStreak += 1
Else if one user missed:
    sharedStreak = 0
```

## API Routes

| Method | Path                                  | Purpose                 |
| ------ | ------------------------------------- | ----------------------- |
| POST   | `/api/study-buddies/commit`           | Create a commitment     |
| GET    | `/api/study-buddies/commitments`      | List user's commitments |
| DELETE | `/api/study-buddies/commitments/[id]` | End a commitment        |

## UI Notes

- Commitment card on dashboard shows both user avatars, shared streak, daily progress bars
- When streak reaches milestones (3, 7, 14, 30), both users get achievement credit
- Invitation shows in notifications with Accept / Decline buttons

## Out of Scope (v2)

- Real-time presence / chat within commitment
- Leaderboard for buddy pairs
- Multiple buddies per commitment (group commitments)
