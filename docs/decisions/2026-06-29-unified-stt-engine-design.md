# Unified STT Engine — Design Spike

**Date:** 2026-06-29
**Status:** Design exploration (not implemented)
**Reference:** `POST /api/engine/transcribe` (current Deepgram endpoint)

## 1. Recommended architecture

**Provider chain with progressive fallback:** Deepgram (best accuracy) → Whisper WASM (offline fallback) → Browser-native SpeechRecognition (zero-cost fallback).

Routing logic:

- **Pronunciation grading** → Deepgram only (accuracy critical)
- **Voice search** → Browser-native first (near-instant), fallback to Deepgram if no result
- **Voice notes / dictation** → Deepgram (fast, accurate), fallback to Browser-native (cost saving)
- **Offline** → Whisper WASM (74MB download, cached via Cache API)

## 2. Provider abstraction interface

```typescript
interface STTProvider {
  readonly name: string;
  readonly capabilities: {
    streaming: boolean;
    languages: string[];
    offline: boolean;
    costPerMinute: number; // USD
  };
  transcribe(audio: AudioInput, options?: STTOptions): Promise<STTResult>;
  transcribeStream?(audio: ReadableStream, options?: STTOptions): AsyncIterable<STTResult>;
}

interface AudioInput {
  blob: Blob | Float32Array; // raw audio or PCM
  sampleRate: number; // 16000 recommended
  channels: number; // 1 (mono)
}

interface STTOptions {
  language?: string; // BCP-47 code
  model?: "nova-2" | "whisper-large-v3";
  punctuate?: boolean;
  diarize?: boolean;
  maxAlternatives?: number;
}

interface STTResult {
  text: string;
  confidence: number;
  alternatives?: { text: string; confidence: number }[];
  words?: { word: string; start: number; end: number; confidence: number }[];
  duration: number; // audio duration in seconds
  provider: string; // which provider served this
}
```

## 3. Engine interface

```typescript
interface STTEngine {
  transcribe(audio: AudioInput, options?: STTOptions): Promise<STTResult>;
  transcribeWithFallback(audio: AudioInput, options?: STTOptions): Promise<STTResult>;
  getCostEstimate(durationSeconds: number, provider: string): number;
  getUsageReport(): Promise<STTUsageReport>;
}

interface STTUsageReport {
  totalMinutes: number;
  totalCost: number;
  byProvider: { provider: string; minutes: number; cost: number }[];
  byDate: { date: string; minutes: number; cost: number }[];
}
```

## 4. Cost tracking approach

| Provider                  | Cost/min | Model              |
| ------------------------- | -------- | ------------------ |
| Deepgram nova-2           | $0.0043  | Per audio minute   |
| Whisper WASM              | $0.0     | Free (client-side) |
| Browser SpeechRecognition | $0.0     | Free (browser API) |

Track via Dexie table `sttUsage`: keyed by date+provider, increment minutes and cost. Exposed as a dashboard widget for admin (cost monitoring).

## 5. Caching approach

Cache STT results for identical audio content (hash-based):

- Input: SHA-256 of audio blob + language + model
- Key: `stt:${hash}`
- TTL: 7 days
- Cache store: Dexie `sttCache` table
- Useful for: repeated pronunciation practice of the same word

## 6. Language support matrix

| Language     | Deepgram | Whisper WASM         | Browser-native |
| ------------ | -------- | -------------------- | -------------- |
| English (ZA) | ✅       | ✅ (large-v3)        | ✅             |
| Afrikaans    | ✅       | ✅                   | ❌             |
| isiZulu      | ✅       | ✅ (medium accuracy) | ❌             |
| isiXhosa     | ✅       | ✅                   | ❌             |
| Sesotho      | ✅       | ✅                   | ❌             |

Deepgram is the primary multi-language provider. Whisper large-v3 covers all SA languages with moderate accuracy.

## 7. File organization

```
src/lib/stt-engine/
├── index.ts              — barrel
├── engine.ts             — STTEngine implementation
├── types.ts              — interfaces from above
├── providers/
│   ├── deepgram.ts       — Deepgram REST API provider
│   ├── whisper-wasm.ts   — Whisper WASM (via @xenova/transformers or similar)
│   └── browser-native.ts — window.SpeechRecognition adapter
├── cache.ts              — Dexie-based result cache
├── cost-tracker.ts       — Usage + cost tracking
└── __tests__/
    └── engine.test.ts
```

## 8. Open questions

1. **WASM model download UX**: Whisper large-v3 is ~74MB. Show download progress bar on first use? Cache via Cache API?
2. **Browser SpeechRecognition consistency**: Safari supports it behind a flag; Firefox on Android doesn't. How to detect and degrade gracefully?
3. **Pronunciation grading**: Currently uses Deepgram + Levenshtein distance. Could the engine provide phoneme-level alignment for better assessment?
4. **Rate limiting**: Deepgram has concurrent request limits. How does the engine queue requests?
5. **Audio preprocessing**: All providers need 16kHz mono PCM. Should normalization happen in the engine or in the audio capture code?

## 9. Migration path

1. **Create `src/lib/stt-engine/`** with types + provider interfaces (no functional changes)
2. **Wrap `POST /api/engine/transcribe`** behind `STTEngine.transcribe()` — same Deepgram logic, new interface
3. **Add Browser-native fallback** for voice search (new use case, no existing code to change)
4. **Add Whisper WASM** as the offline fallback
5. **Add cost tracking + caching** as optional middleware layers

No existing code needs to change until step 2. The migration is purely additive.
