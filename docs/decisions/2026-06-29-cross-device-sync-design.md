# Cross-Device Sync — Design Spike

**Date:** 2026-06-29
**Status:** Design exploration (not implemented)
**Depends on:** Plan 062 (CI must work to validate sync builds)
**Reference:** Plan 058 (sync implementation plan, TODO)

## 1. Recommended approach

**Background sync via IndexedDB→Appwrite replication, conflict-free replicated data types (CRDT) for mergeable data, last-write-wins (LWW) for scalar data.**

The app already has:

- Dexie IndexedDB as local store (DataAccess seam per ADR-0011)
- Appwrite for auth + some server-side data
- A `sync` table (Dexie v31) for checkpoints
- `sync-handlers.ts` and `sync-service.ts` — prior art from Session 24

The approach: extend `DataAccess` write methods to enqueue change records into a local `outbox` Dexie table. A background `SyncService` worker (in a web worker or on idle callback) replays the outbox to Appwrite and pulls remote changes since last checkpoint.

## 2. Conflict resolution matrix

| Data type                | Strategy                              | Rationale                                 |
| ------------------------ | ------------------------------------- | ----------------------------------------- |
| Flashcards (SM-2)        | LWW per-field (due > ease > interval) | SM-2 params converge with repeated review |
| Competency scores        | Max wins                              | Higher score represents more learning     |
| Notes                    | LWW whole document                    | User edits one note at a time             |
| Quiz history             | Append-only (no conflict)             | Historical events, not mutable            |
| Settings                 | LWW scalar                            | Single user, single truth                 |
| Gamification (XP/streak) | Additive merge                        | XP earned on different devices should sum |
| Achievements             | Max wins                              | Unlocked is unlocked                      |
| Wrong answers            | Append-only                           | Historical record                         |
| Study plans              | LWW whole plan                        | Generated plan, replaced on regenerate    |

## 3. Schema design

### Dexie additions

```typescript
// Outbox table — queued writes pending sync
syncOutbox: {
  key: ++id,
  id: string,
  table: string,         // e.g. "flashcards", "notes"
  recordId: string,      // primary key of changed record
  operation: "create" | "update" | "delete",
  data: any,             // serialised record
  createdAt: number,     // timestamp
  retries: number,
}

// Sync checkpoint — last successful pull per table
syncCheckpoints: {
  key: table,
  table: string,
  lastPulledAt: number,
  lastPulledVersion: string,  // server-side version token
}
```

### Appwrite collections

- One collection per syncable Dexie table: `sync_flashcards`, `sync_notes`, `sync_competencies`, etc.
- Each document has a `userId`, `recordId` (local Dexie primary key), `data` (JSON blob), `version` (monotonic version counter), `updatedAt`.

## 4. API surface

```typescript
interface SyncService {
  // Start background sync loop
  start(): void;
  // Stop background sync loop
  stop(): void;
  // Get current sync status
  status(): SyncStatus;
  // Manually trigger a full sync
  trigger(): Promise<SyncResult>;
  // Register callback for status changes
  onStatusChange(cb: (status: SyncStatus) => void): void;
}

interface SyncStatus {
  state: "idle" | "syncing" | "error" | "offline";
  pendingWrites: number;
  lastSyncAt: number | null;
  lastError: string | null;
}

interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
}
```

## 5. Backfill strategy

Phased approach for first-time sync:

1. **Phase A (day 1)**: Sync flashcards + settings + notes only. These are the most cross-device-relevant.
2. **Phase B (day 7)**: Add quiz history + competency scores.
3. **Phase C (day 30)**: Add gamification + wrong answers + remaining tables.

Backfill UI: a single "Sync now" button in Settings with progress indicator. No blocking spinner.

## 6. Sync button UX

- **Location**: Settings > Data tab > "Cross-device sync" section
- **Status indicator**: Icon in the nav bar (synced / syncing / disconnected)
- **Trigger**: Automatic on app foreground + periodic (every 5 min), manual button
- **Conflicts**: Show conflict count badge on the sync icon; tap to resolve (accept local / accept remote / merge)

## 7. Open questions

1. **Offline queue overflow**: What happens when outbox exceeds 1000 pending records? Auto-flush oldest unconfirmed?
2. **Server-side storage costs**: Appwrite charges per document. 1000 flashcards per user × 1000 users = 1M documents. Budget impact?
3. **Encryption at rest**: Should user data in Appwrite be encrypted client-side before upload? Adds complexity but protects data.
4. **Same user, multiple auth methods**: User logs in with Google on device A and email on device B — same Appwrite account? Merge safe?
5. **Delete propagation**: When user deletes a flashcard offline, and the sync outbox entry reaches the server before the delete is pulled — how to resolve?
6. **Rate limits**: Appwrite has per-IP/per-project rate limits. Sync could trigger them.
7. **Plan 058 relationship**: This spike is exploration; Plan 058 (the implementation plan) should be updated with these findings before building.

## 8. Pagination model

- **Push**: Send up to 50 outbox entries per batch. Server responds with `{ accepted: string[], conflicts: string[] }`.
- **Pull**: `GET /api/sync/{table}?since={timestamp}` returns records updated after `timestamp`. Server paginates at 100 records per page. Client follows `nextPage` cursor.
- **Incremental**: Only pull tables that have `lastPulledAt` < server's `latestUpdatedAt`.

## 9. Encryption model

- **At rest in Appwrite**: Server-side encryption at rest (Appwrite default).
- **In transit**: HTTPS.
- **Client-side encryption**: Not planned for MVP. User data (flashcards, notes) is not highly sensitive. If required later, encrypt the `data` JSON blob with a key derived from the user's password (PBKDF2).

## 10. Estimated effort

| Phase | Scope                                             | Effort        | Risk |
| ----- | ------------------------------------------------- | ------------- | ---- |
| A     | Outbox table + push to Appwrite + pull flashcards | L (2-3 weeks) | MED  |
| B     | Pull remaining tables + conflict resolution UI    | M (1-2 weeks) | MED  |
| C     | Background worker + encryption + polish           | M (1-2 weeks) | LOW  |

**Total**: ~4-7 weeks for a single developer unfamiliar with the codebase.
