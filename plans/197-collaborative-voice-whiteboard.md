# Plan 197: Wire collaborative voice + whiteboard

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M (3 sub-items, ~2-3 days)
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Issue**: (none)

## Why this matters

Plan 194 shipped shared quiz sessions (invite button, progress visibility, Ably channels). But the collaborative study vision has two missing halves: (1) voice chat for live discussion while studying, and (2) a shared whiteboard for diagram-based subjects (Maths, Sciences, Geography). The voice service exists but `connect()` and `sendSignal()` are `console.log`. The whiteboard service is fully built (191 lines, Yjs/WebRTC) but never mounted. Neither is usable.

## Current state

- `src/lib/collaborative/voice-service.ts` (264 lines):
  - `connect()` (line 71-75): `console.log("Voice connecting to room:", roomId)` — placeholder
  - `sendSignal()` (line 158-161): `console.log("Sending signal to", targetUserId, signal.type)` — placeholder
  - `createOffer()` returns `{ type: "offer", sdp: "" }` — empty SDP
  - Full SimplePeer types and interfaces defined (correct)
  - ICE server config, mute/deafen, volume controls all defined but never exercised
- `src/lib/collaborative/whiteboard-service.ts` (191 lines):
  - Full Yjs/Y-websocket (or y-webrtc) implementation
  - Supports: shared document, awareness, undo manager, shapes/text sync
  - But zero import consumers — built but unmounted
- `src/app/api/collaborative/sessions/route.ts` line 29: `const userName = "User"; // TODO: get from auth context` — hardcoded

## Scope

**In scope**:

1. `src/lib/collaborative/voice-service.ts` — implement real WebRTC + SimplePeer connect/sendSignal/createOffer
2. `src/app/api/collaborative/sessions/route.ts` — fix hardcoded "User" to real auth
3. `src/components/collaborative/shared-whiteboard.tsx` — new component wrapping `WhiteboardService` for mounting
4. Wire whiteboard into shared quiz session sidebar (`src/components/study-groups/shared-quiz-session.tsx`)
5. Wire voice toggle button into shared quiz session (mute/unmute, "Join Voice" / "Leave Voice")

**Out of scope**:

- Mobile voice (WebRTC works on mobile, but the UI needs to be scroll-compact — defer)
- Recording/transcription of voice sessions
- Persistent whiteboard storage (Yjs ephemeral for now)
- More than 4 peers in voice mesh (SimplePeer mesh degrades beyond 4)

## Steps

### Step 1: Fix sessions route auth context

In `src/app/api/collaborative/sessions/route.ts`:

1. Read `userName` from the authenticated user's profile (use `user.name` or `user.email` from the auth context already available via `createRouteHandler`)
2. Remove the `// TODO: get from auth context` comment

### Step 2: Implement real voice connect/sendSignal

In `src/lib/collaborative/voice-service.ts`:

1. `connect(roomId)`:
   - Request `navigator.mediaDevices.getUserMedia({ audio: true })`
   - Create a `SimplePeer` initiator peer
   - Store peer in peers Map
   - Emit signal data over Ably channel (use existing `useAblyChat` / ChatClient pattern from `live-session-bar.tsx`)
   - Return the local MediaStream
2. `sendSignal(targetUserId, signal)`:
   - Publish signal to Ably channel scoped to the room
   - Target user's `connect()` should subscribe to signals for their userId
3. `createOffer()`:
   - Create a real RTCPeerConnection offer via SimplePeer
   - Return actual SDP
4. Add error handling: failed `getUserMedia` (mic permission denied) should reject gracefully with a typed error, not throw

Use the existing Ably infrastructure from `src/hooks/use-ably-chat.ts` — the ChatClient is already a singleton. Pass it to VoiceService constructor.

### Step 3: Create shared-whiteboard component

Create `src/components/collaborative/shared-whiteboard.tsx`:

```tsx
import { WhiteboardService } from "@/lib/collaborative/whiteboard-service";
import { useEffect, useRef, useState } from "react";

interface SharedWhiteboardProps {
  sessionId: string;
  roomName: string;
  userName: string;
}
```

- Initializes `WhiteboardService` on mount
- Renders a Konva `<Stage>` (follow patterns from `src/components/quiz/diagrams/` — the Konva renderer registry)
- Toolbar: pen, shape (rect/circle/line), text, undo, clear, color picker (3-4 colors)
- Size: responsive, min-h-[300px] on desktop, full-width on mobile
- Uses `useDiagramTheme()` from `src/components/quiz/diagrams/diagram-theme.ts` for dark mode support
- Exports whiteboard state (clear, snapshot) for parent to read

### Step 4: Wire whiteboard into shared quiz session

In `src/components/study-groups/shared-quiz-session.tsx`:

1. Add a tab/section toggle: "Progress" | "Whiteboard" | "Voice"
2. "Whiteboard" tab renders `<SharedWhiteboard>` for the current session
3. "Voice" tab shows a "Join Voice" button that calls `voiceService.connect()` and renders mute/unmute/leave controls
4. Only one tab active at a time (whiteboard and voice are separate affordances)
5. The "Progress" tab remains the default

Wire the `VoiceService` and `WhiteboardService` as singleton instances scoped to the component's lifecycle (created in `useEffect`, destroyed in cleanup).

### Step 5: Verify

```bash
pnpm typecheck
pnpm exec biome check
pnpm test
```

## Test plan

- `src/lib/collaborative/__tests__/voice-service.test.ts`:
  - Mock `navigator.mediaDevices.getUserMedia` to return a fake stream
  - Test connect() returns MediaStream
  - Test sendSignal publishes to correct Ably channel
  - Test failed getUserMedia returns typed error
- `src/components/collaborative/__tests__/shared-whiteboard.test.tsx`:
  - Renders toolbar with pen/shape/text/undo/clear buttons
  - Konva stage mounts without error
- Check `src/app/api/collaborative/sessions/route.test.ts` exists and update it

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] Voice connect() returns real MediaStream (not console.log)
- [ ] Sessions route reads userName from auth, not hardcoded "User"
- [ ] Whiteboard component renders in shared quiz session with working toolbar
- [ ] Voice toggle present in shared quiz session (mute/unmute)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `simple-peer` is not in package.json — check and install if missing
- `y-websocket` or `y-webrtc` provider is not the one used by `whiteboard-service.ts` — read the file's imports and adjust the component to match
- Ably `ChatClient` doesn't expose raw channel publish/subscribe (only room abstraction) — check `src/hooks/use-ably-chat.ts` return type; the voice signaling needs raw channel access, not just room presence

## Maintenance notes

- Voice mesh topology: each peer connects to every other peer. Max 4 participants recommended. Beyond that, switch to SFU (Selective Forwarding Unit) — but that's a separate infrastructure plan.
- Whiteboard data is ephemeral (in-memory Yjs document). Persistent storage would require a Yjs backend sync — defer.
- WebRTC requires HTTPS (or localhost). Voice will not work in dev over HTTP.
