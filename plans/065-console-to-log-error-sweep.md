# Plan 065: Replace console.warn/error with logError in hot paths

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / observability
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

Three production hot-paths still use raw `console.error` / `console.warn` instead of the centralized `logError` from `@/lib/shared/logger`. The logger wires to Sentry in production. Raw console calls are invisible to Sentry. Session 23 (June 2026) swept 148 catch blocks across 53+ files to `logError`; these three were missed.

## Current state

`src/lib/question-engine/question-engine.ts:295`:

```typescript
console.error(`[QuestionEngine] Failed to generate ${type}:`, error);
```

`src/lib/question-engine/question-engine.ts:438`:

```typescript
console.error(`[QuestionEngine] Generation failed for ${tryType}:`, error);
```

`src/lib/question-engine/enrichment-pipeline.ts:79`:

```typescript
console.warn("Retrieve curriculum context failed:", e);
```

## Scope

**In scope** (only these three lines):

- `src/lib/question-engine/question-engine.ts` — lines 295 and 438
- `src/lib/question-engine/enrichment-pipeline.ts` — line 79

**Out of scope**: Any other `console.*` calls in the codebase. No sweeping beyond these three specific hot-path sites.

## Steps

### Step 1: Replace line 295 in question-engine.ts

Replace:

```typescript
console.error(`[QuestionEngine] Failed to generate ${type}:`, error);
```

With:

```typescript
logError("QuestionEngine.generateBatch", error);
```

### Step 2: Replace line 438 in question-engine.ts

Replace:

```typescript
console.error(`[QuestionEngine] Generation failed for ${tryType}:`, error);
```

With:

```typescript
logError("QuestionEngine.generateMixed", error);
```

### Step 3: Replace line 79 in enrichment-pipeline.ts

Replace:

```typescript
console.warn("Retrieve curriculum context failed:", e);
```

With:

```typescript
logError("EnrichmentPipeline.curriculum", e);
```

### Step 4: Verify imports

Both files should already import `logError` from `@/lib/shared/logger`. Check imports in both files — if missing, add:

```typescript
import { logError } from "@/lib/shared/logger";
```

**Verify for each step**: `pnpm run typecheck` → exit 0.

## Done criteria

- [ ] `rg "console\.error.*QuestionEngine" src/lib/question-engine/` returns no matches
- [ ] `rg "console\.warn.*curriculum" src/lib/question-engine/` returns no matches
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0 (1684+ tests pass)
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If `logError` is not imported in either file — add the import (still in scope). If `logError` doesn't exist at `@/lib/shared/logger`, stop and report.
