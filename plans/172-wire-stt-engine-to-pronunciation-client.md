# Plan 172: Wire Unified STT Engine to Pronunciation Client

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts src/app/api/engine/transcribe/route.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The unified `STTEngine` at `src/lib/stt-engine/` has a clean provider chain (Deepgram → Browser Native → Whisper WASM) with Dexie caching (`sttCache`, `sttUsage`). But the pronunciation client bypasses it entirely — it calls `/api/engine/transcribe` which does its own Deepgram fetch, and the client-side fallback calls the old `getWhisperService()`. Two Whisper WASM initialization paths, two caching layers, no cost tracking from the STT engine.

## Current state

- `src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts:70-96` — calls `/api/engine/transcribe` (server-side Deepgram fetch), falls back to `getWhisperService().transcribe()` (old path)
- `src/app/api/engine/transcribe/route.ts` — does its own Deepgram fetch, then conditionally calls `createSTTEngine()` only when Deepgram key is absent
- `src/lib/stt-engine/engine.ts` — `transcribeWithFallback()` with full provider chain + caching

The unified engine should own the entire transcription pipeline. Remove the dual, overlapping logic.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/api/engine/transcribe/route.ts` — simplify to delegate to STTEngine
- `src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts` — remove old Whisper fallback

**Out of scope**:

- The `STTEngine` implementation itself (it's already correct)
- Other consumers of the transcribe route

## Steps

### Step 1: Simplify the transcribe API route

In `src/app/api/engine/transcribe/route.ts`, replace the dual-path logic (Deepgram fetch vs `createSTTEngine()`) with a single call to the STT engine:

```typescript
import { createSTTEngine } from "@/lib/stt-engine";

export async function POST(req: Request) {
  const body = await req.json();
  const engine = createSTTEngine();
  const result = await engine.transcribeWithFallback(body.audio, { language: body.language });
  return Response.json(result);
}
```

Remove the direct Deepgram fetch logic. The engine handles provider chain and caching internally.

### Step 2: Update recording-orchestrator to not import old Whisper

In `recording-orchestrator.ts`, find the fallback path that imports `getWhisperService()`. Since the API route now delegates to STTEngine (which includes Whisper as the last fallback), the client-side fallback is no longer needed. Remove the direct Whisper import and its call path. The orchestration flow becomes: call API → if API fails, surface error (the engine has already tried all providers).

**Verify**: `rg "getWhisperService" src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts` → 0 matches

### Step 3: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing transcribe API tests should pass. If there's a test that mocks the old dual-path behavior, update it to mock the STT engine instead.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Transcribe route delegates to `createSTTEngine().transcribeWithFallback()` only
- [ ] `recording-orchestrator.ts` no longer imports old `getWhisperService`
- [ ] Zero direct Deepgram fetch logic in the transcribe route
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The transcribe route structure differs significantly from the excerpt
- `createSTTEngine` requires DI parameters not available in the route
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

This plan consolidates the transcription path into the unified STT engine. Future transcription features (voice search, voice quiz answers) should use the STT engine directly, not the API route.
