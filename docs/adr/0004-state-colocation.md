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

## Related

- `src/lib/db/schema.ts`
- `src/store/main.ts`
- `src/lib/orchestrator/job-queue.ts`
