# Plan 081: Implement offline Whisper WASM STT provider

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 44169e58..HEAD -- src/lib/stt-engine/ package.json`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `44169e58`, 2026-07-03

## Why this matters

The STT engine promises a three-tier fallback chain (Deepgram → Browser-native → Whisper WASM) with 10 SA languages marked as `offline: true`, but the WASM provider throws `new Error("Whisper WASM is not yet implemented")` at runtime. For a platform targeting data-constrained South African students, the absence of offline transcription is a critical capability hole — pronunciation exercises today require server connectivity. The `@xenova/transformers` package (v2.17.2) is already in `package.json` and provides exactly the Whisper model loading API needed.

## Current state

- `src/lib/stt-engine/providers/whisper-wasm.ts:13` — Skeleton that throws:

  ```ts
  transcribe: async (_audio: AudioInput, _options?: STTOptions): Promise<STTResult> => {
    throw new Error("Whisper WASM is not yet implemented. Install @xenova/transformers and load the model.");
  },
  ```

  Declares `offline: true` and `languages: ["en", "af", "zu", "xh", "st", "tn", "nso", "ss", "ve", "ts"]` — promises offline support for all 11 SA languages but never delivers.

- `package.json:65` — `"@xenova/transformers": "2.17.2"` is already installed as a dependency.

- `src/lib/stt-engine/types.ts` — `STTProvider` interface with `transcribe(audio: AudioInput, options?: STTOptions): Promise<STTResult>`. The `AudioInput` type accepts `blob: Blob | Float32Array; sampleRate: number; channels: number`.

- `src/lib/stt-engine/engine.ts:18-23` — `createSTTEngine` creates all 3 providers and tries them in order. The WASM provider is the last fallback.

- `src/lib/stt-engine/cache.ts` + `cost-tracker.ts` — Full caching and cost tracking infrastructure exists and works.

Relevant conventions:

- Error handling uses `logError()` from `@/lib/shared/logger` — never silent catches.
- All providers return `STTResult { text, confidence, duration, provider }`.
- Model loading should show a loading state (see `src/lib/audio-engine/transcriber.ts` for the Whisper model loading pattern used in the client-side pronunciation tool).

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm typecheck`          | exit 0, no errors   |
| Tests     | `pnpm test -- stt-engine` | all pass            |
| Lint      | `pnpm lint`               | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `src/lib/stt-engine/providers/whisper-wasm.ts` — implement the provider
- `src/lib/stt-engine/__tests__/whisper-wasm.test.ts` — new: provider tests (create)

**Out of scope** (do NOT touch):

- `src/lib/stt-engine/engine.ts` — no changes needed; it already tries the provider in the fallback chain
- `src/lib/stt-engine/cache.ts` or `cost-tracker.ts` — no changes
- `src/lib/stt-engine/types.ts` — interface is adequate
- `src/lib/audio-engine/` — separate subsystem for the client-side pronunciation app
- `src/app/api/engine/transcribe/` — server-side route, not affected

## Git workflow

- Branch: `advisor/081-whisper-wasm`
- Commits: one per step, conventional message style
- Do NOT push or open a PR

## Steps

### Step 1: Implement the Whisper WASM provider

Replace the skeleton body in `src/lib/stt-engine/providers/whisper-wasm.ts` with a real implementation.

Key requirements:

**Model loading:**

- Use `@xenova/transformers` `pipeline` function to load `"openai/whisper-tiny.en"` for English, `"openai/whisper-tiny"` for multilingual (all other languages).
- The model should be lazily loaded on first `transcribe()` call and cached in a module-level variable.
- Handle the case where `@xenova/transformers` is unavailable (e.g. server-side rendering) — throw a descriptive error.

**Audio preprocessing:**

- The `AudioInput` provides `blob: Blob | Float32Array` and `sampleRate: number`.
- If `blob` is a `Blob`, read it as an `ArrayBuffer` and decode to `Float32Array` at the correct sample rate (Whisper expects 16000 Hz mono).
- Use the Web Audio API (`AudioContext.decodeAudioData`) for decoding.
- Resample to 16000 Hz mono using linear interpolation if the source sample rate differs.

**Transcription:**

- Call the loaded pipeline with the processed audio array.
- Pass the `language` option from `STTOptions` if provided (maps to Whisper's `language` parameter).
- Extract the transcribed text and confidence from the pipeline output.
- The pipeline output typically has `{ text: string, chunks?: [{ text, timestamp }] }`. Map the `text` field and estimate confidence from chunk scores.

**Return value:**

- Must match `STTResult` interface:
  ```ts
  {
    text: string;
    confidence: number;
    duration: number;
    provider: "whisper-wasm";
  }
  ```
- Set `duration` from the audio duration (blob size / sample rate / channels / 2).

**Implementation sketch:**

```ts
import type { AudioInput, STTOptions, STTProvider, STTResult } from "../types";
import { logError } from "@/lib/shared/logger";

let pipelineInstance: any = null;
let loading: Promise<void> | null = null;

async function getPipeline(language?: string): Promise<any> {
  if (pipelineInstance) return pipelineInstance;
  if (loading) return loading.then(() => pipelineInstance);

  loading = (async () => {
    try {
      const { pipeline } = await import("@xenova/transformers");
      const modelId =
        !language || language === "en" ? "openai/whisper-tiny.en" : "openai/whisper-tiny";
      pipelineInstance = await pipeline("automatic-speech-recognition", modelId);
    } catch (err) {
      logError("WhisperWasm.load", err);
      throw new Error(
        "Failed to load Whisper WASM model: " + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      loading = null;
    }
  })();

  return loading;
}

async function decodeAudio(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();
  // Mix down to mono and resample to 16000
  const channelData = audioBuffer.getChannelData(0);
  if (audioBuffer.sampleRate === 16000) return channelData;
  // Simple linear resampling
  const ratio = audioBuffer.sampleRate / 16000;
  const length = Math.round(channelData.length / ratio);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const left = Math.floor(pos);
    const right = Math.min(left + 1, channelData.length - 1);
    const frac = pos - left;
    result[i] = channelData[left] * (1 - frac) + channelData[right] * frac;
  }
  return result;
}
```

The `transcribe` function should:

1. Accept `AudioInput` and optional `STTOptions`
2. Process the audio (decode + resample to 16kHz mono)
3. Load the Whisper pipeline (lazy, cached)
4. Call the pipeline with `{ language: options?.language }`
5. Map the result to `STTResult`
6. Handle errors gracefully — if model loading fails, the `transcribeWithFallback` in the engine catches and tries the next provider

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Write provider tests

Create `src/lib/stt-engine/__tests__/whisper-wasm.test.ts` with:

1. **Provider shape**: Create the provider, verify `name === "whisper-wasm"`, `capabilities.offline === true`, `capabilities.languages` includes all 11 SA languages
2. **Model loading handles missing environment**: Verify that calling `transcribe` in a Node.js server environment (without browser APIs) throws an error rather than crashing silently
3. **Audio decoding fallback**: Test that when `AudioContext` is unavailable (jsdom/Node), the error is captured gracefully

Pattern follows `src/lib/stt-engine/__tests__/engine.test.ts` for provider test style.

**Verify**: `pnpm test -- stt-engine` exits 0 and all existing tests still pass.

## Test plan

- New test file: `src/lib/stt-engine/__tests__/whisper-wasm.test.ts`
- Tests:
  1. Provider shape and capabilities match expected values
  2. `capabilities.offline` is `true`
  3. `capabilities.languages` includes "en", "af", "zu", "xh", "st", "tn", "nso", "ts", "ss", "ve"
  4. Throws when called in environment without AudioContext (graceful degradation)
- All existing STT engine tests should still pass

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test -- stt-engine` exits 0 (all tests)
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 overall
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `@xenova/transformers` has been removed from `package.json` since this plan was written, stop and report.
- If the `STTProvider` interface has changed, stop and report the new shape.
- If the Whisper model fails to load in the test environment (WASM/WebAssembly constraints), wrap in a try/catch and skip test — do not force a real model load in CI.

## Maintenance notes

- The `@xenova/transformers` WASM backend may throw in some browser environments (Safari, older Chrome). The `transcribeWithFallback` in `engine.ts` handles this — if Whisper WASM fails, the engine falls through to the browser-native provider.
- When a new Whisper model release happens, update the model ID strings. The current selection (`whisper-tiny.en` / `whisper-tiny`) prioritises speed over accuracy — if device capabilities allow, upgrade to `base` or `small`.
- The model is loaded on first call — consider adding a preload step triggered during app idle time (e.g. after dashboard mounts) for a smoother first-use experience.
