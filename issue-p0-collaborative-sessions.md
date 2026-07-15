## Description
Real-time collaborative study sessions with shared whiteboard (Konva + Yjs/Automerge) and voice chat (WebRTC mesh, max 4). Entry points: "Study Together" button on flashcard deck, quiz results, dashboard.

## Acceptance Criteria
- [ ] Ably room presence (reuse S45 `usePresence` + `usePresenceListener`) -- join/leave/activity sync < 100ms
- [ ] Shared whiteboard: `Y.Doc` + `y-konva` binding on Konva Stage; real-time strokes, shapes, text, images
- [ ] Voice chat: WebRTC mesh (simple-peer or peerjs), opus codec, push-to-talk + voice activity detection toggle
- [ ] Session lifecycle: host creates -> invite link (7-day expiry) -> participants join -> host ends -> auto-end on last leave
- [ ] Moderation: host can mute/remove; reporting via `POST /api/sessions/{id}/report`
- [ ] Recording: host can start/stop -> WebM chunks -> upload to Appwrite Storage -> playback URL in session history
- [ ] Mobile: bottom-sheet whiteboard, floating mic button, adaptive bitrate (simulcast)
- [ ] Analytics: `session.joined`, `whiteboard.stroke`, `voice.toggled`, `session.ended` events to AnalyticsEngine

## Technical Details
- New: `src/lib/study-groups/collaborative/` -- `CollaborativeSessionService`, `WhiteboardEngine` (Yjs), `VoiceEngine` (WebRTC)
- Ably: `chat-sessions:{groupId}` namespace, presence = {userId, name, avatar, role, micEnabled, cursor}
- WebRTC signaling via Ably messages (offer/answer/ice-candidate) -- no separate signaling server
- Yjs persistence: Dexie `yjsUpdates` table (CRDT merge on sync)
- `createRouteHandler` for: `POST /api/study-groups/{id}/sessions`, `GET /api/study-groups/{id}/sessions/{sessionId}`, `PATCH /api/study-groups/{id}/sessions/{sessionId}`

## Dependencies
- Ably real-time presence (S45) -- DONE
- Konva renderers (S44) -- DONE
- VoiceEngine (S50) -- DONE (TTS/STT, need WebRTC transport)
- GamificationEngine (S40) -- XP rewards for session participation

## Effort
3-4 sprints (2 engineers: 1 realtime/CRDT, 1 WebRTC/audio)