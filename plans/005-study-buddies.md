# Plan 005: Study buddies frontend

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c91fa0d4..HEAD -- src/app/api/study-buddies/ src/app/[locale]/study-buddies/ src/components/study-buddies/ src/lib/sync/ src/hooks/use-study-buddies.ts src/lib/services/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c91fa0d4`, 2026-07-10
- **Issue**: (none)

## Why this matters

The study buddies backend is complete: `StudyBuddyService` at `src/lib/services/study-buddy-service.ts` handles commitment creation, listing, and lifecycle. Three API routes exist at `src/app/api/study-buddies/` (commit, list commitments, manage commitment by ID). But there is zero frontend — no dashboard card, no page, no way for users to find study buddies or manage commitments. Social accountability is one of the highest-leverage features for student retention, and the data model is already paid for.

## Current state

- `src/app/api/study-buddies/commit/route.ts` — POST endpoint, accepts `{ buddyUserId, subject, targetDailyMinutes }`, calls `StudyBuddyService.createCommitment()`
- `src/app/api/study-buddies/commitments/route.ts` — GET endpoint, returns list of commitments for the current user
- `src/app/api/study-buddies/commitments/[id]/route.ts` — (empty, 0 bytes — does not exist yet effectively, plan 001 will delete it)
- `src/lib/services/study-buddy-service.ts` — `createCommitment()`, `getCommitments()`, `acceptCommitment()`, `declineCommitment()`, `completeCommitment()` methods. Constructor takes `{ db: DataAccess }`.
- `StudyBuddyService` is barrelled from `@/lib/services` (Session 8 barrel unification)
- Social leaderboard exists at `src/components/social/leaderboard-card.tsx` — shows rankings, could be adjacent
- No hooks exist for study buddies — components will use direct `fetch()` calls or create a simple hook

The repo conventions: components in `src/components/`, hooks in `src/hooks/`, pages in `src/app/[locale]/`, API routes in `src/app/api/`. Use `"use client"` for interactive components, `useTranslations()` from `next-intl`, framer-motion for animations, Tailwind CSS tokens.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm run typecheck`      | exit 0              |
| Tests     | `pnpm run test -- --run`  | all pass            |
| Lint      | `pnpm exec oxlint --fix`  | exit 0              |
| Format    | `pnpm exec oxfmt --check` | clean               |

## Scope

**In scope**:

- `src/hooks/use-study-buddies.ts` — new hook wrapping the 3 API routes
- `src/components/study-buddies/commitment-card.tsx` — shows single commitment with accept/decline/complete actions
- `src/components/study-buddies/commitment-list.tsx` — lists all commitments with status badges
- `src/components/study-buddies/create-commitment.tsx` — form for creating a new commitment (find buddy by username, select subject, set daily minutes)
- `src/components/study-buddies/buddy-finder.tsx` — search/select a study buddy by username or subject
- `src/app/[locale]/study-buddies/` — new page route
- `src/components/dashboard/study-buddy-card.tsx` — dashboard widget showing active commitment summary

**Out of scope**:

- Do NOT touch the API routes or StudyBuddyService — they already work
- Do NOT build real-time chat or live co-study sessions — that's a future concern
- Do NOT add push notifications for commitment reminders (that could be a follow-up)
- Do NOT add a social graph or friend-request system — simple buddy lookup by username is sufficient

## Git workflow

- Branch: `advisor/005-study-buddies`
- Commit per component
- Message style: conventional commits — `feat(study-buddies): add commitment card component`

## Steps

### Step 1: Create the use-study-buddies hook

Create `src/hooks/use-study-buddies.ts`:

```typescript
"use client";

import { useCallback, useState } from "react";

interface Commitment {
  id: string;
  buddyUserId: string;
  buddyName: string;
  subject: string;
  status: "pending" | "active" | "completed" | "declined";
  targetDailyMinutes?: number;
  createdAt: string;
}

export function useStudyBuddies() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCommitments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-buddies/commitments");
      if (res.ok) {
        const data = await res.json();
        setCommitments(data.commitments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createCommitment = useCallback(
    async (buddyUserId: string, subject: string, targetDailyMinutes?: number) => {
      const res = await fetch("/api/study-buddies/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buddyUserId, subject, targetDailyMinutes }),
      });
      if (res.ok) {
        await fetchCommitments();
      }
      return res.ok;
    },
    [fetchCommitments],
  );

  return { commitments, loading, fetchCommitments, createCommitment };
}
```

Export types and functions from the hook file. Follow the pattern in `src/hooks/use-sync-status.ts` for the hook structure.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create the commitment card component

Create `src/components/study-buddies/commitment-card.tsx`:

- Shows buddy name, subject, status badge, daily minutes
- Status badges: pending (yellow), active (green), completed (gray), declined (red)
- Action buttons for pending commitments: "Accept" / "Decline"
- Action button for active commitments: "Mark complete"
- Uses `role="listitem"`, `aria-label` for accessibility
- Follows the card pattern from `src/components/social/leaderboard-card.tsx`

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Create the buddy finder component

Create `src/components/study-buddies/buddy-finder.tsx`:

- Search input for finding users by username or email
- Debounced search (300ms) — calls `GET /api/users/search?q={query}` if such endpoint exists; otherwise use a simple "enter Appwrite user ID" field (pragmatic MVP)
- Shows search results with "Add as buddy" button
- Follows the search pattern from `src/components/shared/search-widget.tsx`

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Create the commitment list component

Create `src/components/study-buddies/commitment-list.tsx`:

- Groups commitments by status (pending, active, completed)
- Renders each with `CommitmentCard`
- Shows empty state when no commitments
- Follows the list pattern from `src/components/flashcard/swipeable-card-deck.tsx` (loading, empty, error states)

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Create the page route

Create `src/app/[locale]/study-buddies/page.tsx`:

```tsx
import { StudyBuddiesPage } from "@/components/study-buddies/study-buddies-page";

export default function Page() {
  return <StudyBuddiesPage />;
}
```

Create `src/components/study-buddies/study-buddies-page.tsx` as the client component that composes all the sub-components and manages state.

**Verify**: Navigate to `/study-buddies` — page renders with commitments list and create form.

### Step 6: Create the dashboard widget

Create `src/components/dashboard/study-buddy-card.tsx`:

- Shows count of active commitments
- Shows next commitment (closest subject)
- "View all" link to `/study-buddies`
- If no active commitments, shows "Find a study buddy" CTA
- Follows the pattern from `src/components/dashboard/today-focus-card.tsx`

**Verify**: `pnpm run typecheck` → exit 0.

## Test plan

- Create `src/hooks/__tests__/use-study-buddies.test.tsx` — test hook state transitions. Follow patterns from `src/hooks/__tests__/`.
- Create `src/components/study-buddies/__tests__/commitment-card.test.tsx` — render test with mock commitment data. Follow patterns from `src/components/quiz/__tests__/quiz-result.test.tsx` (use `container.textContent` for assertions to avoid happy-dom querySelector bug).
- Create `src/components/study-buddies/__tests__/commitment-list.test.tsx` — renders with commitments and empty state.

**Verify**: `pnpm run test -- --run` → all tests pass, including new ones.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run` exits 0; new tests exist
- [ ] `/study-buddies` page renders with commitment list and create form
- [ ] Users can create a commitment (find buddy → select subject → submit)
- [ ] Users can accept/decline pending commitments
- [ ] Users can mark active commitments as complete
- [ ] Dashboard widget shows active commitment summary
- [ ] Translations exist in `messages/en.json` under `"studyBuddies"` key
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `GET /api/study-buddies/commitments` returns a different shape than `{ commitments: [...] }` (read it)
- The `StudyBuddyService.createCommitment()` expects fields not included in the hook (read its constructor signature)
- No user search endpoint exists (if none, use a simple user ID input for MVP)

## Maintenance notes

- If a user search endpoint is added later (`GET /api/users/search`), update `buddy-finder.tsx` to use it.
- Commitment reminders (push notifications) are a natural follow-up — wire via `PushDeliveryService`.
- The design doesn't include study session tracking within a commitment — that would be a future enhancement.
- Add the `/study-buddies` route to the sidebar navigation config at `src/lib/navigation/config.ts` under the "Social" category.
