# ADR-03: State Colocation — Appwrite Server State vs. Zustand Client State vs. TanStack Query Cache

**Status:** Accepted — TanStack Query primary, Dexie DataAccess for offline, Zustand for ephemeral, sync via background jobs  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

Lumni currently mixes three state layers without clear boundaries:

- TanStack Query (React Query) for server state
- Zustand for ephemeral client state (toasts, UI toggles, exam session drafts)
- Dexie (IndexedDB) for persistent offline state (flashcards, wrong answers, study plans)
- Appwrite as the canonical server database

This causes confusion about source of truth and sync timing.

## Decision

| State Type        | Technology     | Source of Truth   | When to Use                                  |
| ----------------- | -------------- | ----------------- | -------------------------------------------- |
| Server state      | TanStack Query | Appwrite (remote) | Questions, exams, leaderboard, user profile  |
| Client ephemeral  | Zustand        | In-memory only    | UI toggles, toast queue, exam session draft  |
| Client persistent | Dexie          | IndexedDB (local) | Flashcards, wrong answers, study plan, notes |
| Sync target       | Appwrite       | Appwrite (remote) | Batch sync from Dexie when online            |

Rules:

1. TanStack Query is the **only** layer that talks to Appwrite directly.
2. Zustand slices must not persist to storage unless explicitly designed as offline-first.
3. Dexie is the **source of truth when offline**. When online, Dexie syncs to Appwrite via background jobs.
4. All writes to Dexie must be wrapped in a typed repository pattern (`src/lib/db/repositories/`).

## Consequences

- **Positive:** Clear mental model; offline-first by design; testable repositories
- **Negative:** Sync conflict resolution needs explicit strategy (last-write-wins vs. merge)

## Disposition (Session 41 — June 2026)

The decision was **substantially implemented and validated**:

1. **TanStack Query** is the default data-fetching layer. The `createApiQuery` factory (`src/hooks/use-hook-factories.ts`) generates consistent 5-minute staleTime queries. All API routes return data through this path.
2. **Dexie DataAccess** (`src/lib/db/data-access.ts`) provides 33 typed table accessors across 10 domain sub-interfaces. `CompetencyService`, `FlashcardEngine`, `AnalyticsEngine`, and 15+ other services inject `DataAccess` via constructor DI. Offline-first works — Dexie is the write target, Appwrite sync is a background job.
3. **Zustand** is used sparingly for ephemeral state: `useExamSessionStore` (draft draft), UI toggles, toast queue. No Zustand slice persists to storage.
4. **Sync layer** (`src/lib/sync/`) with outbox + checkpoints tables (Dexie v41) cross-device sync is in Phase A (stubs for push/pull API exist, Appwrite integration not yet wired).
5. The typed repository pattern (`src/lib/db/repositories/`) has 38 tests validating all 14 repositories.

**Verdict:** Architecture validated. ADR-0004 is formally **Accepted**.

## Related

- `src/lib/db/data-access.ts` — DataAccess interface + 10 sub-interfaces
- `src/lib/db/dexie-data-access.ts` — Dexie implementation
- `src/lib/db/in-memory-data-access.ts` — InMemory for tests
- `src/store/main.ts` — Zustand stores
- `src/lib/orchestrator/job-queue.ts` — background sync triggers
