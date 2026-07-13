---
status: TODO
priority: P1
effort: S
risk: LOW
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 164 — AI `generateText` calls have no timeout/abort

## Context

Every AI-backed operation (quiz generation, grading, hints, `/api/solve`) can hang indefinitely if a provider stalls, because `ensureAI()` initializes the client **without** a `timeoutMs`. On serverless this pins a function open and exhausts concurrency, degrading all users. The timeout plumbing already exists end-to-end (`AIConfig.timeoutMs` → `createUniformProvider({ timeoutMs })` → `uniform-adapter` sets the `ai` SDK `timeout`), it is simply never supplied by the only `initAI` caller.

## Current state (verified)

`src/lib/ai/index.ts:12-19`

```ts
export function ensureAI(): boolean {
  if (isAIConfigured()) return true;
  initAI({
    geminiApiKey: process.env.GEMINI_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_NIM_API_KEY,
  });
  return isAIConfigured();
}
```

`src/lib/ai/client.ts:25-26` — `AIConfig.timeoutMs?: number` exists. `src/lib/ai/uniform-adapter.ts:72` — `...(timeoutMs ? { timeout: timeoutMs } : {})` only applies when truthy.

## Goal

Supply a sane default `timeoutMs` so AI calls fail fast and fall back to the next provider.

## Steps

1. Add a module constant in `src/lib/ai/index.ts`:
   - `const AI_CALL_TIMEOUT_MS = 30_000;`
2. Pass it into `initAI`:
   ```ts
   initAI({
     geminiApiKey: process.env.GEMINI_API_KEY,
     groqApiKey: process.env.GROQ_API_KEY,
     nvidiaApiKey: process.env.NVIDIA_NIM_API_KEY,
     timeoutMs: AI_CALL_TIMEOUT_MS,
   });
   ```
3. Confirm `createUniformProvider` (`client.ts:62-70, 81-89, 100-108`) forwards `timeoutMs` to `uniform-adapter`, which sets the SDK `timeout` (verified).
4. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/ai/index.ts` only.
- Out of scope: per-call timeout tuning, streaming endpoints, STT engine (separate `src/lib/stt-engine`).

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/ai` → pass (no timeout-specific test required, but existing AI tests must stay green).

## Test plan

- Add `src/lib/ai/__tests__/ensure-ai-timeout.test.ts` (or extend existing `src/lib/ai/__tests__/*`): mock `initAI`/`AIClient` and assert that `ensureAI()` constructs the client with `timeoutMs === 30000`. Follow the existing mock style in `src/lib/ai/__tests__/`.

## Maintenance

- If a longer generation (e.g. study-guide) needs more time, raise `AI_CALL_TIMEOUT_MS` in one place. The fallback chain (Gemini→Nvidia→Groq) is unaffected; a timeout now triggers the next provider instead of hanging.

## Escape hatches

- If the `ai` SDK version in this repo rejects a top-level `timeout` option (verify in `uniform-adapter.ts`), instead pass `timeout` via `GenerateOptions`/`AbortSignal` inside `callWithFallback`. STOP and report rather than silently dropping the timeout.
