# Phase 1: Learning Orchestrator & Job Queue

## Overview

Add a dedicated coordination layer between the existing QuestionEngine and VisualEngine, plus a background job queue with retry, priority, and monitoring. This replaces the current fire-and-forget pattern (`.catch(() => {})`) with tracked, retryable background work.

## Architecture

```
API Routes
    │
    ▼
LearningOrchestrator  (stateless, per-request)
    │
    ├── QuestionEngine  (generation, grading, hints)
    ├── VisualEngine    (diagram/image resolution)
    ├── JobQueue        (background work with retry)
    │       │
    │       └── JobProcessor (client-side hook + server API fallback)
    │               │
    │               ├── analytics-service   (localStorage + Appwrite sync)
    │               ├── spaced-rep-service  (SM-2 algorithm → Dexie → Appwrite)
    │               └── progress-service    (Dexie → Appwrite)
    │
    └── New services (extracted from existing inline/hook code)
```

## Components

### 1. LearningOrchestrator (`src/lib/orchestrator/learning-orchestrator.ts`)

Stateless class instantiated per request. Two main workflows:

**`generateQuestionSet(params)`**
1. Call `QuestionEngine.generate()` (full Dexie → Appwrite → AI cache chain)
2. Validate each question via `QuestionEngine.validate()`
3. Cache questions to Dexie
4. Enqueue `appwrite-sync` job (replaces `.catch(() => {})`)
5. Enqueue `visual-pre-cache` job (replaces `.catch(() => {})`)
6. Return `{ questions, count, type, jobIds }`

**`gradeAndTrack(question, answer)`**
1. Call `QuestionEngine.grade()`
2. Enqueue `spaced-rep-update` job
3. Enqueue `analytics-sync` job
4. Enqueue `progress-update` job
5. Return `{ result: GradingResult, jobIds }`

**`generateHint(question)`**
1. Call `QuestionEngine.generateHint()`
2. Return `{ hint }`

### 2. JobQueue (`src/lib/orchestrator/job-queue.ts`)

Dexie-backed background job system. New table `jobs` in the existing `lumni-offline` database (version 4 migration).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` (auto) | Primary key |
| `type` | `JobType` | See below |
| `payload` | `string` (JSON) | Job-specific data |
| `status` | `pending \| processing \| completed \| failed \| cancelled` | Current state |
| `priority` | `number` (0-100, default 50) | Higher = processed first |
| `attempts` | `number` | Retry count |
| `maxRetries` | `number` | Per-type default |
| `lastError` | `string?` | Most recent failure message |
| `scheduledAt` | `number` (epoch ms) | Delayed execution |
| `createdAt` | `number` | Timestamp |
| `startedAt` | `number?` | Processing started |
| `completedAt` | `number?` | Completed timestamp |
| `resultSummary` | `string?` | Short status for monitoring |

**Job Types:**

| Type | Priority | MaxRetries | Handler |
|------|----------|------------|---------|
| `visual-pre-cache` | 60 | 2 | VisualEngine.resolve() |
| `appwrite-sync` | 70 | 3 | syncQuestionsToAppwrite() |
| `analytics-sync` | 30 | 1 | AnalyticsService.sync() |
| `spaced-rep-update` | 50 | 2 | SpacedRepService.update() |
| `progress-update` | 50 | 2 | ProgressService.update() |

**Public API:**
- `enqueue(type, payload, opts?)` → `Promise<number>` (returns job ID)
- `getStatus(jobId)` → `{ status, lastError? }`
- `getStats()` → `{ pending, processing, failed, completed }`

**Processing (private):**
- `next()` — fetches highest-priority pending job past `scheduledAt`
- `markProcessing(id)` / `markCompleted(id)` / `markFailed(id, error)`
- Exponential backoff: base 1s, max 60s, with jitter (reuse `calculateBackoffDelay` from offline.ts)

### 3. JobProcessor (`src/lib/orchestrator/job-processor.ts`)

Processes jobs with a handler dispatch pattern.

```typescript
type JobHandler = (payload: unknown) => Promise<void>;

const handlers: Record<JobType, JobHandler> = {
  "visual-pre-cache": async (p) => { /* VisualEngine.resolve() */ },
  "appwrite-sync": async (p) => { /* syncQuestionsToAppwrite() */ },
  "analytics-sync": async (p) => { /* AnalyticsService.sync() */ },
  "spaced-rep-update": async (p) => { /* SpacedRepService.update() */ },
  "progress-update": async (p) => { /* ProgressService.update() */ },
};
```

**Processing loop:**
1. Fetch up to 5 pending jobs (ordered by priority DESC, scheduledAt ASC)
2. For each: mark processing → dispatch to handler → mark completed or failed
3. Failed jobs with remaining retries get `scheduledAt = now + backoff(attempts)`

Two contexts:
- **Client-side (primary):** `useJobProcessor()` hook — runs on mount + on reconnect, polls every 30s
- **Server-side (fallback):** `POST /api/jobs/process` — for admin dashboard or future cron

### 4. Services (`src/lib/services/`)

**AnalyticsService** — wraps existing `engine-analytics.ts`
- `track(type, data)`: writes to localStorage immediately (non-blocking)
- `sync(events)`: batch-writes to Appwrite analytics collection, purges synced events

**SpacedRepService** — wraps core algorithm from `use-spaced-repetition.ts`
- `update(question, result)`: SM-2 interval calculation, saves to Dexie progress, enqueues Appwrite sync

**ProgressService** — wraps existing `saveProgress()` from offline.ts
- `update(subject, result)`: updates attempts/correct/streaks in Dexie, enqueues Appwrite sync

### 5. API Route Changes

**`src/app/api/engine/generate/route.ts`** — minimal diff:
- Create `LearningOrchestrator` instead of `QuestionEngine`
- Call `orchestrator.generateQuestionSet(body)`
- Return `{ questions, count, type, jobIds }`

**`src/app/api/engine/grade/route.ts`** — minimal diff:
- Create `LearningOrchestrator` instead of `QuestionEngine`
- Call `orchestrator.gradeAndTrack(question, answer)`
- Return `{ ...gradingResult, jobIds }`

**`src/app/api/jobs/process/route.ts`** (new):
- Accepts optional `{ limit?: number }`
- Calls `JobProcessor.processBatch(limit)`
- Returns `{ processed, succeeded, failed }`

## Data Flow

### Question Generation Flow (before vs after)

**Before:**
```
API Route → QuestionEngine.generate()
  → AI generation
  → Dexie cache
  → syncQuestionsToAppwrite().catch(() => {})  ← invisible failure
  → preCacheVisuals().catch(() => {})            ← invisible failure
  → return
```

**After:**
```
API Route → Orchestrator.generateQuestionSet()
  → QuestionEngine.generate()
  → validate
  → Dexie cache
  → JobQueue.enqueue("appwrite-sync")     ← tracked, retryable
  → JobQueue.enqueue("visual-pre-cache")  ← tracked, retryable
  → return { questions, jobIds }           ← caller can monitor jobs
```

### Grading Flow (before vs after)

**Before:**
```
API Route → QuestionEngine.grade()
  → AI grading
  → return result
  (no follow-up — spaced repetition, analytics, progress all fire from hooks)
```

**After:**
```
API Route → Orchestrator.gradeAndTrack()
  → QuestionEngine.grade()
  → JobQueue.enqueue("spaced-rep-update")
  → JobQueue.enqueue("analytics-sync")
  → JobQueue.enqueue("progress-update")
  → return { result, jobIds }
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Job handler throws | Increment attempts; if < maxRetries, re-enqueue with backoff; else mark failed |
| Dexie write fails | Job stays pending; retry on next cycle |
| Appwrite unavailable | Job retries with backoff; eventually fails with error logged |
| Client goes offline | `useJobProcessor` pauses; resumes on `online` event |
| Server API called with no jobs | Returns `{ processed: 0 }` — no-op |
| Orchestrator workflow fails | Throws to API route (existing error handling preserved) |

## Files Changed

### New files:
- `src/lib/orchestrator/index.ts` — barrel export
- `src/lib/orchestrator/types.ts` — JobType, JobStatus, JobRecord, orchestrator types
- `src/lib/orchestrator/learning-orchestrator.ts` — main class
- `src/lib/orchestrator/job-queue.ts` — Dexie-backed queue
- `src/lib/orchestrator/job-processor.ts` — handler dispatch + processing loop
- `src/lib/services/index.ts` — barrel export
- `src/lib/services/analytics-service.ts`
- `src/lib/services/spaced-rep-service.ts`
- `src/lib/services/progress-service.ts`
- `src/hooks/use-job-processor.ts` — client-side job processor hook
- `src/app/api/jobs/process/route.ts` — server-side processing endpoint

### Modified files:
- `src/lib/db/offline.ts` — add version 4 with `jobs` table
- `src/app/api/engine/generate/route.ts` — use orchestrator
- `src/app/api/engine/grade/route.ts` — use orchestrator

## Implementation Order

1. Types (`orchestrator/types.ts`)
2. Dexie migration + JobQueue (`offline.ts` + `job-queue.ts`)
3. JobProcessor (`job-processor.ts`)
4. Services (analytics, spaced-rep, progress)
5. LearningOrchestrator (`learning-orchestrator.ts`)
6. Client hook (`use-job-processor.ts`)
7. API route: job processing (`/api/jobs/process`)
8. API route changes: generate + grade
9. Barrel exports + integration
10. Tests
