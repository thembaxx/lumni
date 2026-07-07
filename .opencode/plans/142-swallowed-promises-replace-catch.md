# Plan 142: Replace swallowed catch blocks with logError in recording-orchestrator + dictionary

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts src/lib/dictionary/service.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Two critical write paths silently swallow promise rejections with empty catch blocks: pronunciation scores fail to persist (users think their progress is saved) and dictionary cache writes fail silently (causing repeated API calls). No monitoring visibility into either failure.

## Current state

`src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts:112`:

```typescript
savePronunciationScore(...).catch(() => {})  // All errors swallowed
```

`src/lib/dictionary/service.ts:111-112`:

```typescript
catch { // cache write fail silently
  // No logging
}
```

The repo convention for error logging is `logError` from `@/lib/shared/logger`:

```typescript
import { logError } from "@/lib/shared/logger";
logError("ComponentName", error);
```

## Steps

### Step 1: Fix recording-orchestrator.ts

Replace `.catch(() => {})` with error logging:

```typescript
savePronunciationScore(...).catch((err) => logError("RecordingOrchestrator.saveScore", err))
```

### Step 2: Fix dictionary/service.ts

Replace the empty `catch` block:

```typescript
catch { logError("Dictionary.cacheWrite", err) }
```

The variable name `err` may need to match the catch binding. Read the actual file to confirm how the catch block is structured.

### Step 3: Verify

`pnpm typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

The `logError` import may already exist in both files. If not, add it. Check the file's existing imports first.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `grep 'catch(() => {})' src/app/\[locale\]/pronunciation/pronunciation-client/recording-orchestrator.ts` returns no matches
- [ ] `grep 'catch {' src/lib/dictionary/service.ts` — the block is no longer empty
