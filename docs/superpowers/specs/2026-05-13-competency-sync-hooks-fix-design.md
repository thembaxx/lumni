# Competency Sync & Hooks Fix Design

## Problem

Three interconnected bugs in the Learning Experience system:

1. **API routes crash on server**: `GET /api/engine/next-topics` and `GET /api/engine/study-plan` call `competencyService.getCompetencies()` which accesses Dexie (IndexedDB) — not available in Node.js server context.

2. **Client hooks make dead API calls**: `useNextTopics` and `useStudyPlan` call these broken API routes via `fetch()`, so they never return data. The UI components that depend on them (LessonLibrary, StudyPlanner) are effectively broken.

3. **Competency Appwrite sync incomplete**: `competencyService.update()` writes to the Dexie sync queue, but `initSyncQueue()` is never called with an `onSync` handler. Sync queue items accumulate and are silently discarded — competencies never persist to Appwrite.

## Architecture

```
Before:
  useNextTopics → fetch /api/engine/next-topics → competencyService.getCompetencies() → 💥 server has no IndexedDB
  useStudyPlan  → fetch /api/engine/study-plan  → competencyService.getCompetencies() → 💥 server has no IndexedDB

After:
  useNextTopics → directly calls: competencyService.getCompetencies() + pathEngine.getNextTopics() → ✅ client has IndexedDB
  useStudyPlan  → directly calls: competencyService.getCompetencies() + pathEngine.generateStudyPlan() → ✅ client has IndexedDB

  API routes → read from Appwrite COMPETENCIES collection → call pathEngine → return response → works for future server consumers

  Sync queue → onSync handler upserts to Appwrite → initSyncQueue() registered in Providers.tsx
```

## Changes

### 1. Fix client hooks (`src/hooks/use-next-topics.ts`, `src/hooks/use-study-plan.ts`)

Replace `fetch()` calls with direct imports of `competencyService` and `pathEngine`. The hooks remain `"use client"` with React Query — same interface, same caching/stale-time/retry behavior, only the queryFn body changes.

- `useNextTopics`: import `competencyService`, `pathEngine`; build competency map; call `pathEngine.getNextTopics()`; return `{ recommendations, summary }`
- `useStudyPlan`: same pattern; call `pathEngine.generateStudyPlan()`; return `{ plan, days, dailyGoalMinutes }`

### 2. Fix API routes (`src/app/api/engine/next-topics/route.ts`, `src/app/api/engine/study-plan/route.ts`)

Change data source from Dexie to Appwrite `competencies` collection. Both routes keep their existing `pathEngine` calls — only the data retrieval changes.

- Query Appwrite: `listDocuments(COLLECTIONS.COMPETENCIES, [Query.equal("subjectId", subject)])`
- Map Appwrite documents to `CompetencyRecord` shape
- Build `Map<string, CompetencyRecord>` (key: `${subjectId}:${topicId}:${bloomLevel}`)
- Call `pathEngine.getNextTopics()` / `pathEngine.generateStudyPlan()` as before

Known limitation: eventual consistency — data may lag behind Dexie. Documented for future consumers.

### 3. Wire up competency sync handler (new file + Provider change)

**New file: `src/lib/competency-engine/sync-handler.ts`**

Single function `handleCompetencySync(action, payload)`:

- Guards: only processes `action === "sync"` with `payload.type === "competency"`
- Queries Appwrite for existing document matching `(subjectId, topicId, bloomLevel)`
- If exists: `updateDocument()` with new score/level/timestamp
- If not: `createDocument()` with full record

**Existing file modification: `src/components/providers/providers.tsx`**

Add `useEffect` to call `initSyncQueue({ onSync: handleCompetencySync })` on mount. This runs once in the client-side Providers component, alongside the existing `useAutoSync()` call.

## Appwrite Document Schema

```
competencies collection:
  subjectId: string (indexed)
  topicId: string (indexed)
  bloomLevel: string (indexed)
  score: number
  level: string
  attempts: number
  createdAt: string (ISO)
  updatedAt: string (ISO)
```

## Files Changed

| File                                        | Change                                  |
| ------------------------------------------- | --------------------------------------- |
| `src/hooks/use-next-topics.ts`              | Replace fetch with direct service calls |
| `src/hooks/use-study-plan.ts`               | Replace fetch with direct service calls |
| `src/app/api/engine/next-topics/route.ts`   | Read from Appwrite instead of Dexie     |
| `src/app/api/engine/study-plan/route.ts`    | Read from Appwrite instead of Dexie     |
| `src/lib/competency-engine/sync-handler.ts` | NEW — Appwrite upsert handler           |
| `src/components/providers/providers.tsx`    | Register handler via initSyncQueue      |

## No Changes Needed

- `competency-service.ts` — already writes to sync queue correctly
- `src/lib/db/client.ts` — `COMPETENCIES: "competencies"` already defined
- `src/lib/sync-queue.ts` — infrastructure is sound, just lacked a registered handler
- `src/lib/competency-engine/types.ts` — schema unchanged
