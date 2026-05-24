# Spaced Repetition v2 — Cloud Sync

## Goal

Add two-way cloud sync between local Dexie storage and Appwrite for flashcards and review history. Every review/mutation pushes to Appwrite automatically, and a pull on page mount merges remote changes using last-write-wins.

## Scope

- Push: every card create, update, delete, and review enqueues a sync job
- Pull: on flashcards page mount, fetch all remote changes since last sync and merge
- Conflict resolution: last-write-wins per card (field-level overwrite by `updatedAt` timestamp)
- Data: sync both `FlashcardSM2` cards and `FlashcardReview` history

## Data Model

### `updatedAt` field (new on `FlashcardSM2`)

```typescript
export interface FlashcardSM2 {
  // ...existing fields...
  createdAt: number;
  updatedAt: number;  // NEW — set to Date.now() on every write
  lastReview: number | null;
  // ...existing fields...
}
```

### Appwrite collections

| Collection | Documents | Key |
|---|---|---|
| `flashcards` | `FlashcardSM2` | `$id = card.id` |
| `flashcard_reviews` | `FlashcardReview` | `$id = hash(cardId + reviewedAt)` |

The review `$id` is `${cardId}_${reviewedAt}` — a simple string key that ensures idempotency: pushing the same review twice overwrites the same doc rather than creating duplicates.

## Architecture

### Push path (existing job — `appwriteFlashcardSync`)

Every mutation method in `FlashcardEngine`:
1. Sets `card.updatedAt = Date.now()`
2. Writes to local Dexie (fast, synchronous)
3. Calls `enqueue("appwrite-flashcard-sync", { cardId: card.id })` (fire-and-forget)
4. On delete: enqueues an "appwrite-flashcard-delete" marker

The existing `appwriteFlashcardSync` handler already pushes a single card to Appwrite's `flashcards` collection. Extend it to also push the card's review history entries to `flashcard_reviews`.

### Pull path (new job — `appwriteFlashcardPull`)

Triggered when `flashcards-client.tsx` mounts:

1. Read `localStorage` key `lumni_flashcard_sync_timestamp` for `lastSyncTimestamp`
2. Call Appwrite `listDocuments("flashcards")` with query `updatedAt > lastSyncTimestamp` (or no filter if first sync)
3. For each remote card:
   - **No local card** → `offlineDB.flashcards.add(remoteCard)`
   - **Remote `updatedAt` > local `updatedAt`** → `offlineDB.flashcards.put(remoteCard)`
   - **Remote `updatedAt` <= local `updatedAt`** → skip
4. Same flow for `flashcard_reviews`: fetch reviews newer than `lastSyncTimestamp`, merge by `$id`
5. Store `Date.now()` as new `lastSyncTimestamp`

### Conflict resolution

**Last-write-wins** per card (whole-card overwrite). Whichever `updatedAt` is newer supplies all fields. The older card is replaced entirely — no field-level merge.

### Sync safety

- No circular push: pull runs before any user interaction on page mount. Cards pulled from remote won't have a local `updatedAt` bump, so they won't re-push.
- Offline resilience: if push fails, the job retries (maxRetries=3). The card remains correct in local Dexie regardless.
- First-time setup: no `lastSyncTimestamp` → pull everything. Populates an empty Dexie from the cloud.

## File Changes

### New

- `src/lib/orchestrator/types.ts` — add `"appwrite-flashcard-pull"` to `JobType`, define `FlashcardPullPayload`
- `src/lib/orchestrator/handlers/sync-handlers.ts` — add `appwriteFlashcardPull` handler

### Modified

| File | Change |
|---|---|
| `src/lib/flashcard-engine/types.ts` | Add `updatedAt: number` to `FlashcardSM2` |
| `src/lib/flashcard-engine/engine.ts` | Set `updatedAt` on all mutations, enqueue sync job, also push reviews from `saveReview()` |
| `src/lib/db/schema.ts` | Version 15 — add `updatedAt` index to `flashcards` table |
| `src/lib/orchestrator/handlers/sync-handlers.ts` | Extend `appwriteFlashcardSync` to also push reviews |
| `src/lib/orchestrator/job-queue.ts` | Register `appwrite-flashcard-pull` job type (priority 60, maxRetries 3) |
| `src/app/flashcards/flashcards-client.tsx` | Enqueue `appwrite-flashcard-pull` on mount |
| `src/lib/orchestrator/handlers/domain.ts` | Already enqueues `appwriteFlashcardSync` — add `updatedAt` to the card before enqueue |

## Edge Cases

- **No network on push**: job retries up to 3 times with backoff; card data is safe in local Dexie
- **No network on pull**: silently skip; lastSyncTimestamp not updated, will retry on next mount
- **Appwrite unauthenticated**: pull returns empty; existing local data unaffected
- **First sync on new device**: pulls all cards + reviews into fresh Dexie
- **Delete sync**: local delete enqueues `appwriteFlashcardDelete` job that hard-deletes from Appwrite. Pull will not re-create it (it's gone from remote). Race: if device A creates a card offline then device B deletes it before A syncs, A's push will create it on Appwrite. On next pull, B would see a card it thought was deleted. This is acceptable — last-write-wins applies, and B can re-delete.
- **Large review history**: paginate with Appwrite's `limit()` + `offset()` to avoid timeouts

## Out of Scope

- Conflict resolution UI (merge picker, diff viewer) — last-write-wins is invisible to the user
- Push on app foreground / periodic background sync — only on mutation and page mount
- Sync status indicator in UI — sync is silent; failures logged to console only
- Anki/CSV import — already exists via browse page, unchanged
