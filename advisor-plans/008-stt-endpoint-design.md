# Advisor Plan 008: STT Endpoint — Design/Spike Plan

> **Source**: Audit finding DIR-01
> **Priority**: P3 (strategic direction)
> **Effort**: M (M — 2-3 days for implementation after spike)
> **Risk**: MED (audio handling, model loading, API key dependency)
> **Confidence**: HIGH (all infrastructure already exists)

## Why this matters

The VoiceEngine is complete: TTS (`src/lib/voice-engine/`, `/api/engine/voice`, `TTSButton`, `ListenToLesson`). But the voice loop is one-sided — students can hear lessons read aloud, but cannot speak answers or get pronunciation assessment outside the existing pronunciation flow.

**Completing the voice loop** means students can:

- Speak answers to quiz/exam questions (voice input)
- Get real-time transcription for note-taking
- Practice oral exam preparation with AI feedback
- Use voice commands for hands-free navigation

## Existing Infrastructure Audit

Everything needed already exists in the codebase:

### Audio capture

- `src/lib/voice-engine/audio-recorder.ts` — MediaRecorder wrapper, blob output
- `src/hooks/use-voice-input.ts` — recording state machine
- `src/components/voice/voice-input-button.tsx` — UI button with recording visualization

### Speech-to-text providers

- **Deepgram**: Used in `src/app/api/engine/transcribe/route.ts` (created Session 42) — `POST /api/engine/transcribe` accepts base64 audio, forwards to Deepgram `/v1/listen`. Fails open when `DEEPGRAM_API_KEY` is absent.
- **Whisper WASM**: `@xenova/transformers` (74MB model) — used in pronunciation flow via `src/lib/voice-engine/whisper-service.ts`. Slow first-load (download) but free.

### Pronunciation assessment

- `src/lib/voice-engine/phoneme-service.ts` — phoneme comparison
- `src/lib/voice-engine/pronunciation-history.ts` — history tracking
- `src/app/[locale]/pronunciation/` — existing pronunciation page

### Integration points

- `src/components/quiz/question-card.tsx` — already has visual + TTS context
- `src/components/quiz/hooks/use-quiz-view.ts` — quiz state management
- `src/lib/quiz/use-quiz.ts` — quiz hook

## Gap Analysis

Current `POST /api/engine/transcribe` (Session 42):

```typescript
// Accepts base64 audio, forwards to Deepgram
// Returns { text, confidence, provider }
// Fails open when DEEPGRAM_API_KEY is absent
// Pronunciation client falls back to Whisper WASM
```

**What's missing:**

1. **Provider chain** — No fallback between Deepgram and Whisper (currently Deepgram-only with no fallback, Whisper is only in pronunciation flow)
2. **UI integration** — No voice input button in quiz/exam views
3. **Result display** — No transcribed text display + edit capability
4. **Oral exam mode** — No "listen to question → speak answer → assess" flow

## Proposed Architecture

### Provider chain (mirrors TTS pattern in `src/lib/ai/client.ts`)

```
POST /api/engine/transcribe
  ├── Deepgram (primary) — low latency, needs API key
  ├── Whisper WASM (fallback) — free, 74MB download, slower
  └── Fails open → { text: null, confidence: null }
```

### Provider implementation

```typescript
// src/lib/voice-engine/stt-provider.ts
interface SttProvider {
  transcribe(audio: Blob): Promise<{ text: string; confidence: number | null }>;
}

class DeepgramSttProvider implements SttProvider {
  async transcribe(audio: Blob) {
    const base64 = await blobToBase64(audio);
    const res = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": audio.type,
      },
      body: audio,
    });
    const data = await res.json();
    return {
      text: data.results.channels[0].alternatives[0].transcript,
      confidence: data.results.channels[0].alternatives[0].confidence,
    };
  }
}

class WhisperSttProvider implements SttProvider {
  private pipeline: null | Pipeline;
  async transcribe(audio: Blob) {
    // Uses @xenova/transformers whisper pipeline
    const result = await this.getPipeline()(audio);
    return { text: result.text, confidence: null };
  }
}
```

### UI Integration Points

1. **Quiz question card**: Add voice input button next to text input (MCQ answers spoken, free-text answers transcribed)
2. **Exam session**: Oral exam mode — listen to question, respond verbally, auto-advance
3. **Note-taking**: Voice-to-text note creation in study groups

### Data flow

```
User speaks → MediaRecorder captures → Blob → POST /api/engine/transcribe
  → Deepgram (fast path) → { text, confidence }
  → Whisper (fallback, slow) → { text }
  → Return to client → fill answer field / display transcription
```

## Implementation Plan

### Phase 1 — Provider chain consolidation (S effort)

1. Create `src/lib/voice-engine/stt-provider.ts` with factory pattern
2. Update `/api/engine/transcribe` to use the chain with fallback
3. Add unit tests for provider selection + fallback
4. Status: **Ready for implementation**

### Phase 2 — Quiz voice input (M effort)

1. Add `useVoiceInput()` hook (already exists, may need tuning)
2. Add voice button to `QuestionCardInput`
3. Transcribe → fill answer → submit flow
4. Status: **Needs design decisions** (when to auto-submit? show transcribed text for confirmation?)

### Phase 3 — Oral exam mode (L effort)

1. New exam mode: listen → speak → AI assess
2. Pronunciation assessment integration
3. Auto-advance through questions
4. Status: **Strategic feature, separate plan needed**

## Recommended Next Step

**Proceed with Phase 1 only** — provider chain consolidation. This is:

- Independent of UI design decisions
- Mirrors the TTS provider pattern exactly
- Adds unit tests for existing but untested transcription endpoint
- Unblocks Phase 2 without committing to specific UX

## Test plan

- `stt-provider.test.ts`: factory pattern, provider selection, fallback chain
- `transcribe/route.test.ts`: integration with mocked providers
- No UI tests needed for Phase 1

## Done criteria (Phase 1)

- [ ] `src/lib/voice-engine/stt-provider.ts` created with factory pattern
- [ ] `/api/engine/transcribe` uses provider chain with fallback
- [ ] Deepgram provider: uses existing API key, returns text + confidence
- [ ] Whisper fallback: lazy-loads pipeline only when needed
- [ ] Fails open when both providers unavailable
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
