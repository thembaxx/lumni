## Description

Real-time collaborative study sessions with shared whiteboard (Konva + Yjs), voice chat (WebRTC mesh), presence (Ably), and session recording. Entry points from flashcard deck, quiz results, and study groups.

## Acceptance Criteria

- [ ] `POST /api/study-groups/[groupId]/live-session` -- create session (host), returns Ably token + Yjs doc ID
- [ ] `<LiveSessionBar>` (S45) enhanced: join/leave, participant avatars, voice toggle, whiteboard toggle, record button
- [ ] Shared whiteboard: `<CollaborativeCanvas>` -- Konva Stage + Yjs awareness (cursors, selections), tools: pen, shapes, text, image upload, diagram templates (physics/chemistry/math from VisualEngine)
- [ ] Voice chat: WebRTC mesh (max 4), opus codec, echo cancellation, push-to-talk + voice activity detection
- [ ] Presence: Ably `presence.get()` + `presence.subscribe()` -- online/active/idle/away, current tool, viewport
- [ ] Session recording: MediaRecorder (canvas + audio) → blob → `POST /api/live-sessions/[id]/recording` → Dexie + Appwrite Storage
- [ ] Replay: `<SessionReplay>` -- timeline scrubber, participant toggle, export MP4
- [ ] "Study Together" entry points:
  - Flashcard deck: "Invite to session" (shares current card as whiteboard background)
  - Quiz results: "Review together" (loads wrong answers as whiteboard items)
  - Study group: "Start session" (blank canvas)

## Technical Details

- Ably: `ChatClient` (S45) + `RealtimeChannel` for whiteboard (Yjs WebRTC provider or Ably PubSub)
- Yjs: `y-websocket` or `y-webrtc` for document sync; `y-protocols/awareness` for cursors
- WebRTC: `simple-peer` or raw `RTCPeerConnection` mesh; STUN/TURN via `twilio` or `cloudflare`
- Konva: existing `diagram-theme.ts` palette, export `Konva.Stage.toBlob()`
- Dexie v41: `liveSessions`, `sessionRecordings`, `whiteboardSnapshots` tables
- Queue: `live-session-recording` job for post-processing (transcode, thumbnail)

## Dependencies

- Ably real-time presence (S45) -- `src/hooks/use-ably-chat.ts`, `ably-provider.tsx`
- VisualEngine diagram templates (S44) -- 8 Konva renderers reusable as whiteboard stamps
- VoiceEngine TTS/STT (S50) -- optional live captioning
- StudyPlannerService -- session scheduling integration

## Effort

4-5 sprints (2-3 engineers)

## Risks

- WebRTC mesh doesn't scale beyond 4-6 -- need SFU (mediasoup) for larger groups
- Mobile Safari WebRTC limitations -- test iOS 15+ thoroughly
- Yjs + Konva integration complexity -- prototype first
- Battery drain on mobile -- voice activity detection + canvas pause on background
