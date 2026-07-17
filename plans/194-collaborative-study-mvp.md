# Plan 194: Add collaborative study MVP — shared quiz sessions + Study Together entry points

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 690ee57f..HEAD -- src/app/[locale]/quiz/ src/app/[locale]/flashcards/ src/hooks/use-live-session.ts src/components/study-groups/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `690ee57f`, 2026-07-17
- **Issue**: (none)

## Why this matters

Ably real-time presence is fully shipped. Study buddies (commitments, API, components) are built. Live session bars exist on study group pages. But there is no way to start a _shared study activity_ from within the core learning loop (quiz, flashcards). The "Study Together" vision requires: (1) an invite/join button on quiz results and flashcard decks, (2) a shared quiz experience where two+ users see each other's progress, (3) optionally, voice chat. This plan delivers the entry points and shared quiz MVP — voice and whiteboard are deferred.

## Current state

- `src/hooks/use-ably-chat.ts` — `useAblyChat()` returns singleton `ChatClient`, tied to `user.$id` + `authReady`. Used by `ChatRoomProvider` in `LiveSessionBar`.
- `src/hooks/use-live-session.ts` — `useLiveSession(groupId)` — query for session + mutation to start. `startSession(subject?)` creates a live session on the API.
- `src/components/study-groups/live-session-bar.tsx` — 338 lines, real-time presence via `usePresence` + `usePresenceListener`. Shows participant avatars, activity selector. Used on study group pages.
- Study groups hub (`src/components/study-groups/groups-hub.tsx`) — tabbed UI with My Groups / Discover / Admin tabs.
- Study buddies commitments: `POST /api/study-buddies/commit`, `commitment-card.tsx`, `study-buddies-page.tsx`.
- `src/components/quiz/hooks/use-quiz-view.ts` — quiz view state machine (used by quiz page). Has `quizSession` state with `sessionId`.
- `src/components/quiz/quiz-view.tsx` — quiz rendering component. Handles question display, answer submission, results.

**Missing:**

- No "Study Together" button on quiz results page or flashcard deck
- No shared quiz session state (users take the same quiz simultaneously)
- No way to invite a study buddy into an active session from the quiz
- No voice chat component

Repo conventions: Components use `@/components/ui/*` shadcn-style primitives. Pages use `PageContainer`. API routes use `createRouteHandler`. Hooks use TanStack Query via `createApiQuery` factory. Zustand stores for client state (quiz, exam).

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test`             | all pass            |
| Lint      | `pnpm exec biome check` | exit 0              |

## Scope

**In scope**:

- `src/components/quiz/quiz-results.tsx` — add "Study Together" button (or adjacent card)
- `src/components/flashcard/flashcards-client-index.tsx` — add "Study Together" button on session end
- `src/components/study-groups/shared-quiz-session.tsx` — new component: shared quiz experience
- `src/hooks/use-shared-quiz.ts` — new hook: manages shared quiz state via Ably channel
- `src/app/api/study-groups/[groupId]/shared-quiz/route.ts` — new API: create/join shared quiz
- `src/components/study-groups/invite-button.tsx` — new component: reusable invite-to-session button

**Out of scope**:

- Voice chat (WebRTC mesh) — deferred
- Shared whiteboard (Konva + CRDT) — deferred, major effort
- Study groups admin API changes (already complete)
- Study buddies changes (already complete)

## Git workflow

- Branch: `advisor/194-collaborative-study-mvp`
- Commit style: conventional commits
- Do NOT push or open PR unless instructed

## Steps

### Step 1: Create the shared quiz hook

Create `src/hooks/use-shared-quiz.ts`:

A hook that manages a shared quiz session over an Ably channel:

1. Takes a `sessionId` (the quiz session ID) and `channelName` (the Ably channel for this shared session)
2. Uses `useAblyChat()` to get the ChatClient
3. Creates/joins an Ably channel for the shared quiz
4. Publishes events: `user-joined`, `answer-submitted` (questionId, selectedOption, userId), `quiz-completed` (userId, score)
5. Subscribes to events from other participants
6. Returns `{ participants, answers, progress }` where:
   - `participants`: array of `{ userId, userName, score }`
   - `answers`: map of userId → answer per question
   - `progress`: map of userId → number answered

Follow the Ably patterns from `src/components/study-groups/live-session-bar.tsx` (presence + channel subscription).

This hook does NOT replace the existing quiz state — it augments it. The local quiz state (current question, timer, etc.) stays in the local Zustand store. The shared state is only for presence and progress visibility.

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Create the shared quiz API route

Create `src/app/api/study-groups/[groupId]/shared-quiz/route.ts`:

```ts
import { createRouteHandler } from "@/lib/api/create-route-handler";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SharedQuiz",
  parseBody: async (req) => {
    const { quizSessionId, subject, topic } = await req.json();
    return { quizSessionId, subject, topic };
  },
  execute: async ({ body, userId, params }) => {
    // 1. Verify the user is a member of this study group
    // 2. Create a shared quiz record with an invite code
    // 3. Return { channelName, inviteCode }
  },
});

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "SharedQuizGet",
  execute: async ({ req, userId, params }) => {
    // Return active shared quizzes for this group
    // User can join any active quiz
  },
});
```

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Create the invite button component

Create `src/components/study-groups/invite-button.tsx`:

A small pill/button that:

1. Shows user's study buddies as a dropdown
2. "Invite to study together" sends a notification to the buddy
3. The buddy receives a push notification with a deep link to the shared quiz

Props: `{ quizSessionId: string, subject: string, topic?: string }`.

Use existing UI patterns from `src/components/ui/button` and `src/components/ui/dropdown-menu`. Follow the design language of the existing study groups components.

**Verify**: `pnpm typecheck` exits 0.

### Step 4: Add "Study Together" button to quiz results

In `src/components/quiz/quiz-results.tsx`:

Add a button or card next to the existing "Practice More" / "Review" actions:

- "Study Together" — opens a dialog showing study group members / study buddies
- User selects who to invite (or "Create session for group")
- Calls the shared quiz API to create a session
- Shows the invite code they can share

The quiz results component already has access to `subject` and optionally `topic` — use these to pre-populate the shared quiz context.

Check `src/components/quiz/quiz-view.tsx` to see how `QuizResults` is rendered and what props it receives.

**Verify**: `pnpm typecheck` exits 0.

### Step 5: Add "Study Together" to flashcard session end

In `src/app/[locale]/flashcards/flashcards-client/index.tsx`:

After a flashcard session completes, or in the session summary, add a "Study Together" button. The button should:

1. Show available study buddies
2. Create a shared study session for the same subject
3. Navigate to the group's live session

**Verify**: `pnpm typecheck` exits 0.

### Step 6: Create the shared quiz session component

Create `src/components/study-groups/shared-quiz-session.tsx`:

A component that renders alongside (or inside) the regular quiz view, showing:

1. Participant list with progress bars (how many questions each user has answered)
2. Real-time score updates as users answer
3. A "You're ahead/behind" indicator vs. the group average

Use the `useSharedQuiz` hook from Step 1. The component should be positioned as a sidebar on desktop and a collapsible bottom sheet on mobile.

This should be opt-in — users start a "solo" quiz by default. The "Study Together" button graduates the quiz to shared mode.

**Verify**: `pnpm typecheck` exits 0.

### Step 7: Run full verification

```bash
pnpm typecheck && pnpm exec biome check && pnpm test
```

All should pass.

## Test plan

- New tests:
  - `src/hooks/__tests__/use-shared-quiz.test.ts` — mock Ably channel, test event publish/subscribe, test progress calculation
  - `src/components/study-groups/__tests__/invite-button.test.tsx` — renders, shows dropdown
  - `src/components/study-groups/__tests__/shared-quiz-session.test.tsx` — renders participant list, shows progress
- Follow patterns in `src/hooks/__tests__/use-live-session.test.tsx` and `src/components/study-groups/__tests__/live-session-bar.test.tsx`

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 (including new tests)
- [ ] "Study Together" button appears on quiz results page when user has study buddies or group memberships
- [ ] Creating a shared quiz session returns a channel name and invite code
- [ ] Shared quiz component shows participant progress in real-time
- [ ] Only files in scope are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The quiz results component doesn't receive `subject` prop — check its props interface at the top of `src/components/quiz/quiz-results.tsx` and report
- The flashcard client doesn't have a clear "session end" hook point — check the component tree
- Ably channel subscription requires a specific provider wrapper not available outside `LiveSessionBar` — the `ChatRoomProvider` from `@ably/chat/react` may need to wrap the shared quiz components
- If `useAblyChat()` returns null (user not authenticated), the "Study Together" button should be hidden gracefully

## Maintenance notes

- Voice chat (WebRTC mesh, max 4 participants) is the natural next step after shared quizzes. It uses the same Ably presence for signaling.
- Shared whiteboard (Konva + CRDT) is a separate, larger effort. Requires Yjs or Automerge for collaborative drawing state.
- The "Study Together" button should be A/B tested once the feature flag system is ready (Plan 189-adjacent work).
- Consider adding a "spectator mode" for teachers to observe shared quiz sessions (future teacher tool).
