# Plan 021: Live Session Join/Leave/Activity

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: feature
- **Planned at**: commit after `016-stories-content`, 2026-06-21

## Why this matters

The live session system is currently a presence-only indicator. The three core participation functions (`_joinSession`, `_leaveSession`, `_updateActivity`) are private and have no API routes. Users can see that a session exists but cannot join, leave, or indicate what they're studying. This makes the "live" feature effectively view-only.

## Scope

**In scope**:

- `src/lib/study-groups/live-session-service.ts` — export join/leave/updateActivity
- `src/app/api/study-groups/[groupId]/live-session/[sessionId]/route.ts` — add join/leave PATCH endpoints
- `src/hooks/use-live-session.ts` — add useJoinSession, useLeaveSession, useUpdateActivity hooks
- `src/components/study-groups/live-session-bar.tsx` — add Join button + activity selector

**Out of scope**:

- WebSocket/realtime (stays polling)
- Auto-cleanup/heartbeat
- Quiz coordination
- Session history

## Steps

### Step 1: Export participation functions

In `live-session-service.ts`:

- Rename `_joinSession` → `joinSession` (remove underscore, export)
- Rename `_leaveSession` → `leaveSession` (remove underscore, export)
- Rename `_updateActivity` → `updateActivity` (remove underscore, export)

### Step 2: Add join/leave/activity API routes

In `src/app/api/study-groups/[groupId]/live-session/[sessionId]/route.ts`:

Add to existing PATCH handler:

```typescript
// PATCH body: { action: "end" | "join" | "leave" | "activity", activity?: string }
```

- `action: "end"` — existing behavior (end session)
- `action: "join"` — call `joinSession(sessionId, userId, userName)`
- `action: "leave"` — call `leaveSession(sessionId, userId)`
- `action: "activity"` — call `updateActivity(sessionId, userId, body.activity)`

### Step 3: Add client hooks

In `use-live-session.ts`:

```typescript
export function useJoinSession(groupId: string, sessionId: string) {
  return useMutation({
    mutationFn: () =>
      apiFetch(`/api/study-groups/${groupId}/live-session/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "join" }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["live-session", groupId] }),
  });
}
```

Same pattern for `useLeaveSession` and `useUpdateActivity`.

### Step 4: Update LiveSessionBar UI

In `live-session-bar.tsx`:

- Show "Join Session" button for users who are NOT participants
- Show "Leave" button for users who ARE participants (not the starter)
- Show activity selector (dropdown: "Studying", "Reviewing", "Taking Quiz", "Done")
- Update participant detection: check if current userId is in participants list
- Green "Live" indicator stays for active sessions

### Step 5: Update participant count

In `live-session-service.ts` `startLiveSession()`:

- Keep `participantCount: 1` on creation

In `joinSession()`:

- Increment `participantCount` on the session document

In `leaveSession()`:

- Decrement `participantCount` on the session document (min 0)

### Step 6: Verification

```bash
npx tsc --noEmit
npx biome check src/lib/study-groups/ src/app/api/study-groups/ src/hooks/use-live-session.ts src/components/study-groups/
bun run test
```

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0 (no regressions)
- [ ] Non-starters can join a live session via Join button
- [ ] Participants can leave via Leave button
- [ ] Activity status can be updated via dropdown
- [ ] Participant count updates on join/leave
- [ ] `plans/README.md` status row updated

## STOP conditions

- Appwrite document updates don't support increment/decrement
- Join button doesn't appear for non-starters
- Polling doesn't reflect join/leave within 15s
