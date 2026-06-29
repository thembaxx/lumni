# Plan 072: Design spike — cross-device sync layer

> **Executor instructions**: This is a **design spike** — you are exploring, documenting, and prototyping. Do not implement a production sync layer. The output is a design doc, not code.

## Status

- **Priority**: P2 (Direction)
- **Effort**: L
- **Risk**: LOW
- **Depends on**: 062 (CI — sync work needs CI to validate builds)
- **Category**: direction / architecture
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

The app stores data locally in Dexie IndexedDB but has no cross-device sync. A student's flashcards, quiz history, competency scores, and notes are locked to their device. Appwrite is used for auth and some server-side data (exam dates, user profiles) but not for user-generated content. Plan 058 (existing, TODO) already scoped a full sync implementation — this spike explores the design decisions that Plan 058 deferred.

## Design questions to answer

1. **Conflict resolution strategy**: Last-write-wins? CRDT? Per-field merge? Which data types need which strategy?
2. **Sync granularity**: Per-table sync? Per-record? Per-user-per-record? What's the sync unit?
3. **Frequency model**: Push on write? Poll on timer? Background sync service worker?
4. **Offline queue**: How are writes queued while offline? How does retry work?
5. **Server-side storage model**: Appwrite collections? One collection per Dexie table? Encrypted blobs?
6. **Auth binding**: How is sync scoped to a user? Can the same user sync across anonymous and authenticated sessions?
7. **Backfill strategy**: For existing users with 100s of flashcards, how does first sync work without a loading spinner that lasts minutes?

## Existing context

- Plan 058 (implementation plan, status TODO) — scopes the full sync implementation. Read it first.
- ADR-0011 (DataAccess seam) — the DataAccess interface already exists and is designed to support swapping storage backends. This is the foundation for a sync layer.
- Appwrite is already wired for auth and some server data — Realtime SDK could be used for push sync.
- Dexie already has a `sync` table for checkpoints (added Session 24).
- The codebase has a `sync-handlers.ts` and `sync-service.ts` — read those to understand prior art.

## Constraints

- Must work offline-first: writes go to local Dexie immediately, sync in background.
- Must work on slow and unreliable mobile connections (South African context).
- Must handle up to 1000 records per user per table without sync taking >10 seconds on a 3G connection.
- Must not expose unencrypted user data in Appwrite.
- Must allow the user to see sync status (synced/pending/error per record).

## What to produce

Create `docs/decisions/2026-06-29-cross-device-sync-design.md` (or update an existing one) containing:

1. **Recommended approach** — with tradeoffs explained
2. **Conflict resolution matrix** — per data type (flashcards, competency, notes, quiz history, settings)
3. **Schema design** — Dexie sync tables + Appwrite collection structure
4. **API surface** — SyncService interface (methods, events, error types)
5. **Backfill strategy** — phased approach for first-time sync
6. **Sync button UX** — where in the UI the user triggers/reviews sync
7. **Open questions** — things the spike didn't resolve
8. **Pagination model** — incremental sync vs full dump
9. **Encryption model** — what's encrypted at rest in Appwrite, what's not
10. **Estimated effort** — small/medium/large per phase, with risk assessment

## Research steps

### Step 1: Read existing sync infrastructure

Read:

- `docs/adr/0011-data-access-seam.md` — DataAccess interface
- `src/lib/sync/` — sync-handlers, sync-service
- `src/lib/db/` — schema.ts (Dexie tables, especially `sync` table if it exists)
- `plans/058-cross-device-sync.md` — existing implementation plan
- `src/app/wire-push/` — push notification code that may overlap

### Step 2: Research options

For each design question above, research 2-3 approaches and document tradeoffs.

### Step 3: Prototype the sync interface

Create a minimal `SyncService` interface (in TypeScript, but not wired into the app — just a design artifact):

```typescript
interface SyncService {
  status(): SyncStatus;
  push(table: string, records: SyncableRecord[]): Promise<SyncResult>;
  pull(table: string, since: number): Promise<SyncResult>;
  resolveConflicts(local: SyncableRecord, remote: SyncableRecord): SyncableRecord;
  onStatusChange(cb: (status: SyncStatus) => void): void;
}
```

### Step 4: Write the design doc

Write `docs/decisions/2026-06-29-cross-device-sync-design.md` following the outline above.

### Step 5: Update Plan 058

If the spike changes the recommended approach, update `plans/058-cross-device-sync.md` with a note referencing this spike.

## Done criteria

- [ ] Design doc at `docs/decisions/2026-06-29-cross-device-sync-design.md` exists and covers all 10 areas
- [ ] Plan 058 is updated with a reference to this spike (if approach changed)
- [ ] All tradeoffs are documented — no single "right answer" presented
- [ ] No production code was modified

## STOP conditions

- If the existing sync infrastructure is more complete than described — the spike may need less work. Read first.
- If Plan 058 already answers all 10 design questions — summarize Plan 058 and stop; no new design doc needed.
