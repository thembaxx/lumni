# Plan 231: Replace 4 remaining console.error calls with logError

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx / observability
- **Generated at**: 2026-07-17

## Why this matters

Session 23 (codebase hardening) replaced 148 catch-block `console.error` calls with centralized `logError()`. Four remaining `console.error` calls were left behind — two in collaborative services, one in teacher UI. These error reports never reach the central logger, meaning Sentry misses them in production and they don't follow the standard error-reporting pattern.

## Current state

Three files, 4 calls:

1. `src/lib/collaborative/voice-service.ts:195`:
   ```ts
   console.error("Voice peer error:", err);
   ```
2. `src/lib/collaborative/voice-service.ts:230`:
   ```ts
   console.error("Voice signal publish failed:", err);
   ```
3. `src/lib/collaborative/whiteboard-service.ts:162`:
   ```ts
   console.error("Failed to import whiteboard state:", err);
   ```
4. `src/components/teacher/risk-alerts.tsx:79`:
   ```ts
   console.error("Intervention failed:", err);
   ```

## Target state

All 4 replaced with:

```ts
logError("voice-service:voice-peer-error", err);
logError("voice-service:signal-publish-failed", err);
logError("whiteboard-service:import-failed", err);
logError("risk-alerts:intervention-failed", err);
```

## Scope

- 3 files, 4 `console.error` calls
- Add `import { logError } from "@/lib/shared/logger"` where missing

## Steps

### 1. Fix `voice-service.ts`

- Read file, find both `console.error` lines
- Add import: `import { logError } from "@/lib/shared/logger"`
- Replace both calls with `logError("voice-service:...", err)`

### 2. Fix `whiteboard-service.ts`

- Read file, find `console.error` at line 162
- Add import if missing
- Replace with `logError("whiteboard-service:import-failed", err)`

### 3. Fix `risk-alerts.tsx`

- Read file, find `console.error` at line 79
- Add import if missing
- Replace with `logError("risk-alerts:intervention-failed", err)`

### 4. Verify no lingering console.error in these files

- `Select-String -Path ... -Pattern "console\.error"` on all 3 files returns 0 matches

Verification: `pnpm run typecheck ; pnpm exec oxlint`

## Stop conditions

- Any file already imports `logError` but doesn't use it — just replace the call

## Estimated time

10 minutes
