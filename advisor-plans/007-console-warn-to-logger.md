# Advisor Plan 007: Sweep remaining console.warn/error calls to centralized logger

> **Source**: Audit finding CORR-03
> **Priority**: P3
> **Effort**: M (systematic replacement across ~30 files)
> **Risk**: LOW
> **Confidence**: HIGH

## Why this matters

Session 23 (June 2026) swept 148 catch blocks to `logError()`, but 99+ `console.warn` and `console.error` calls remain across 30+ files. These include critical paths like:

- `src/lib/ai/client.ts` — AI provider chain (Gemini, Nvidia, Groq)
- `src/lib/tinyfish/rag-pipeline.ts` — RAG pipeline
- `src/lib/services/study-planner-service.ts` — Study planner
- `src/lib/flashcard-engine/engine.ts` — Flashcard engine

Production errors in these paths bypass Sentry integration in `logger.ts`. Debugging is harder without structured context. This is inconsistent with the centralized logger adoption.

## Current state

`search_files` for `console.warn` or `console.error` in `src/` — 99+ matches. The centralized logger has:

- `logError(context, error, meta?)` — logs via dev console.error + Sentry.captureException in production
- `logWarn(context, message, meta?)` — logs via dev console.warn

These are imported from `src/lib/shared/logger.ts`.

## Scope

**In scope:**

- All `console.warn` calls in `src/` (not `src/app/` — API route logging is separate)
- All `console.error` calls in `src/` (not test files — tests use `vi.spyOn` for assertions)
- Critical paths first: AI client, RAG pipeline, flashcard engine, study planner

**Out of scope:**

- `console.log` calls (usually debug, not production paths)
- Test files (intentional assertions)
- `src/app/` API routes (may have different logging patterns)

## Execution order

1. **Critical paths** (do first, 5 files):
   - `src/lib/ai/client.ts` — AI provider chain, latency tracking
   - `src/lib/tinyfish/rag-pipeline.ts` — RAG calls
   - `src/lib/services/study-planner-service.ts` — study plan generation
   - `src/lib/flashcard-engine/engine.ts` — SM-2, leech detection
   - `src/lib/visual-engine/` — diagram generation

2. **Remaining files** — batch replace the rest

## Steps

1. For each file with `console.warn` or `console.error`:
   - Add `import { logError, logWarn } from "@/lib/shared/logger"` if not present
   - Replace `console.error("context", err)` with `logError("context", err)`
   - Replace `console.warn("context", msg)` with `logWarn("context", msg)`
2. `pnpm run typecheck` → exit 0
3. `pnpm run test` → all pass

## Done criteria

- [ ] All `console.warn` and `console.error` in `src/` replaced with `logWarn`/`logError`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Critical paths (AI, RAG, flashcard, visual engine) done first
