# Plan 209: Replace 11 silent `.catch(() => {})` with logged error handling

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: bug / observability

## Why this matters

Silent `.catch(() => {})` swallows every failure — network errors, Dexie write failures, permission denials, and API 500s all vanish without a trace. Production Sentry dashboards cannot detect these failures; developers cannot diagnose the root cause of downstream bugs. The codebase already has a standard `logError("context", err)` function in `src/lib/shared/logger.ts` wired to `Sentry.captureException()` in production. These 11 sites are the remaining unbounded silent-catch sites outside the QuestionCard path (which already uses `logError` correctly).

## Current state

**Site 1 — webhook dispatch** (`src/lib/services/quiz-result-processor/index.ts:101`):

```ts
dispatcher
  .dispatchWebhook("quiz.completed", { ... })
  .catch(() => {});
```

**Site 2 — story cache put** (`src/lib/stories/service.ts:152`):

```ts
_deps.db.storyCache.put(entry).catch(() => {});
```

**Sites 3-5 — sync provider init/trigger** (`src/components/providers/sync-provider.tsx:42,55,77`):

```ts
initSyncWriters().catch(() => {}); // line 42
service.trigger().catch(() => {}); // line 55
serviceRef.current?.trigger().catch(() => {}); // line 77
```

**Site 6 — story meta fetch** (`src/components/teacher/story-assignment-builder.tsx:51`):

```ts
getAllStoryMetas()
  .then(setStories)
  .catch(() => {});
```

**Site 7 — API fetch** (`src/components/dashboard/study-buddy-card.tsx:20`):

```ts
fetch("/api/study-buddies/commitments")
  .then((r) => r.json())
  .then((data) => { ... })
  .catch(() => {});
```

**Sites 8-9 — clipboard write** (`src/components/study-groups/invite-button.tsx:29,45`):

```ts
if (result && typeof result.catch === "function") result.catch(() => {});
```

**Site 10 — story reader track** (`src/app/[locale]/stories/[storyId]/story-reader-client/index.tsx:204`):

```ts
trackQuestionResult({ ... }).catch(() => {});
```

**Site 11 — pronunciation track** (`src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts:124`):

```ts
trackQuestionResult({ ... }).catch(() => {});
```

## Target state

All 11 sites replaced with `logError("context", err)`. Story-assignment-builder and study-buddy-card also get error UI states (toast or inline error message) so the user sees the failure.

## Scope

- `src/lib/services/quiz-result-processor/index.ts` — line 101 `.catch(() => {})` → `.catch((err) => logError("WebhookDispatch", err))`
- `src/lib/stories/service.ts` — line 152 `.catch(() => {})` → `.catch((err) => logError("StoryCachePut", err))`
- `src/components/providers/sync-provider.tsx` — lines 42, 55, 77 `.catch(() => {})` → `.catch((err) => logError("...", err))`
- `src/components/teacher/story-assignment-builder.tsx` — line 51 `.catch(() => {})` → error setState + toast. Also add `error` state variable.
- `src/components/dashboard/study-buddy-card.tsx` — line 20 `.catch(() => {})` → logError + fallback UI state (show "Unable to load" text).
- `src/components/study-groups/invite-button.tsx` — lines 29, 45 `.catch(() => {})` → `.catch((err) => logError("ClipboardCopy", err))`
- `src/app/[locale]/stories/[storyId]/story-reader-client/index.tsx` — line 204 `.catch(() => {})` → `.catch((err) => logError("StoryTrackQuestionResult", err))`
- `src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts` — line 124 `.catch(() => {})` → `.catch((err) => logError("PronunciationTrackQuestionResult", err))`
- NOT the 30+ sites in QuestionCard that already use `.catch((err) => logError(...))` — those are fine.
- NOT changing any other silent catches found incidentally — stick to these 11.

## Steps

### 1. Fix quiz-result-processor webhook dispatch

File: `src/lib/services/quiz-result-processor/index.ts:101`

Replace `.catch(() => {})` with `.catch((err: unknown) => logError("WebhookDispatch", err))`.

Add `import { logError } from "@/lib/shared/logger"` at top of file if not already present.

### 2. Fix story cache silent catch

File: `src/lib/stories/service.ts:152`

Replace `.catch(() => {})` with `.catch((err: unknown) => logError("StoryCachePut", err))`.

`logError` is already imported in this file (line 5).

### 3. Fix sync provider 3 silent catches

File: `src/components/providers/sync-provider.tsx`

- Line 42: `initSyncWriters().catch(() => {})` → `initSyncWriters().catch((err: unknown) => logError("SyncInitWriters", err))`
- Line 55: `service.trigger().catch(() => {})` → `service.trigger().catch((err: unknown) => logError("SyncTriggerOnline", err))`
- Line 77: `serviceRef.current?.trigger().catch(() => {})` → `serviceRef.current?.trigger().catch((err: unknown) => logError("SyncTriggerManual", err))`

Add `import { logError } from "@/lib/shared/logger"` at top.

### 4. Fix story-assignment-builder fetch failure

File: `src/components/teacher/story-assignment-builder.tsx`

Replace lines 49-52:

```ts
useEffect(() => {
  getAllStoryMetas()
    .then(setStories)
    .catch(() => {});
}, []);
```

With:

```ts
useEffect(() => {
  getAllStoryMetas()
    .then(setStories)
    .catch((err: unknown) => {
      logError("StoryAssignmentBuilder.fetchMetas", err);
      toast({ type: "error", message: "Failed to load stories" });
    });
}, []);
```

Add `import { logError } from "@/lib/shared/logger"` and ensure `toast` is imported (it already is, line 27).

### 5. Fix study-buddy-card fetch failure

File: `src/components/dashboard/study-buddy-card.tsx`

Replace lines 11-21:

```ts
useEffect(() => {
  fetch("/api/study-buddies/commitments")
    .then((r) => r.json())
    .then((data) => {
      const active = (data.commitments ?? []).filter(
        (c: { status: string }) => c.status === "active",
      );
      setActiveCount(active.length);
    })
    .catch(() => {});
}, []);
```

With:

```ts
useEffect(() => {
  fetch("/api/study-buddies/commitments")
    .then((r) => r.json())
    .then((data) => {
      const active = (data.commitments ?? []).filter(
        (c: { status: string }) => c.status === "active",
      );
      setActiveCount(active.length);
      setLoadError(null);
    })
    .catch((err: unknown) => {
      logError("StudyBuddyCard.fetchCommitments", err);
      setLoadError("Unable to load commitments");
    });
}, []);
```

Add `[loadError, setLoadError] = useState<string | null>(null)` state variable. In the render, when `loadError` is set and `activeCount === 0`, show a muted fallback text instead of "Find a study buddy".

Add `import { logError } from "@/lib/shared/logger"`.

### 6. Fix invite-button clipboard silent catches

File: `src/components/study-groups/invite-button.tsx`

Replace line 29: `if (result && typeof result.catch === "function") result.catch(() => {});`
With: `if (result && typeof result.catch === "function") result.catch((err: unknown) => logError("ClipboardCopyCode", err));`

Replace line 45: same pattern → `logError("ClipboardCopyLink", err)`.

Add `import { logError } from "@/lib/shared/logger"`.

### 7. Fix story-reader-track silent catch

File: `src/app/[locale]/stories/[storyId]/story-reader-client/index.tsx`

Replace line 204: `.catch(() => {});` → `.catch((err: unknown) => logError("StoryReader.trackQuestionResult", err));`

Check if `logError` is already imported; add if not.

### 8. Fix pronunciation track silent catch

File: `src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts`

Replace line 124: `.catch(() => {});` → `.catch((err: unknown) => logError("Pronunciation.trackQuestionResult", err));`

Check if `logError` is already imported; add if not.

### 9. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

## Stop conditions

- Any file not listed in Scope is modified — stop and revert
- A `.catch(() => {})` outside the 11 listed sites is changed — stop and revert
- `pnpm run typecheck` fails (regression in type signatures or imports)
- `pnpm exec biome check` finds lint errors in changed files
- More than 2 tests regress

## Estimated time

1-2 hours
