# Plan 073: Design spike — unified STT engine

> **Executor instructions**: This is a **design spike** — you are exploring, documenting, and prototyping. Do not implement a production STT engine. The output is a design doc, not code.

## Status

- **Priority**: P2 (Direction)
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction / architecture
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

Speech-to-text is currently fragmented:

1. **Pronunciation practice**: `POST /api/engine/transcribe` uses Deepgram (`/v1/listen`) with a Whisper WASM fallback on the client.
2. **Other potential uses**: Voice-based quiz answers, voice search, voice notes, accessibility (voice navigation) — all would need their own STT integration.
3. **No provider abstraction**: Each integration has its own API shape, error handling, and fallback chain. Adding a new STT use case means duplicating the Deepgram integration.

A unified STT engine would provide a single abstraction over Deepgram, Whisper, and (optionally) Browser-native `SpeechRecognition`, with a consistent API for all voice features.

## Design questions to answer

1. **Provider chain strategy**: Deepgram → Whisper WASM → Browser-native. What's the fallback? Which provider for which use case (accuracy vs latency)?
2. **Transcription modes**: Real-time streaming vs single-utterance (blob). Which use case needs which?
3. **Model selection**: Deepgram's `nova-2` vs `whisper-large-v3` tradeoffs. Do different use cases need different models?
4. **Language support**: Deepgram/Whisper support South African languages (isiZulu, Afrikaans). How does the engine handle language detection vs explicit language parameter?
5. **Audio preprocessing**: What normalization happens before sending to the provider (sample rate, channel count, noise gate)?
6. **Result normalisation**: How does the engine normalise confidence scores, timestamps, and alternative transcripts across providers?
7. **Caching strategy**: Can repeated phrases (e.g., "define mitosis") be cached to avoid API costs?
8. **Cost management**: Deepgram has per-audio-hour costs. How does the engine track usage and alert on spikes?

## Existing context

- `POST /api/engine/transcribe` — current Deepgram integration in `src/app/api/engine/transcribe/route.ts`
- Pronunciation client (`pronunciation-client.tsx`) — consumption of the transcribe endpoint
- Session 42 added the STT endpoint (June 2026)
- The existing `ai/client.ts` provider chain (Gemini → Nvidia → Groq) is a precedent for fallback-chaining in this codebase.

## Constraints

- Must work offline (at least basic transcription via Whisper WASM).
- Browser-native `SpeechRecognition` is a potential zero-cost fallback but has inconsistent API support.
- Per-audio-hour cost must be trackable — the engine must expose usage metrics.
- The engine must be use-case-agnostic — quiz answer dictation, voice search, and pronunciation grading should all use the same abstraction.

## What to produce

Create `docs/decisions/2026-06-29-unified-stt-engine-design.md` containing:

1. **Recommended architecture** — provider chain, routing logic
2. **Provider abstraction interface** — `STTProvider` or `Transcriber` interface
3. **Engine interface** — top-level `STTEngine` methods
4. **Cost tracking approach** — per-provider cost config, usage aggregation
5. **Caching approach** — what to cache, key structure, TTL
6. **Language support matrix** — which providers for which languages
7. **File organization** — `src/lib/stt-engine/` directory layout
8. **Open questions** — unresolved design decisions
9. **Migration path** — how to migrate the existing pronunciation endpoint without breaking it

## Research steps

### Step 1: Read existing STT code

Read:

- `src/app/api/engine/transcribe/route.ts` — current Deepgram integration
- `src/components/pronunciation/pronunciation-client.tsx` — client consumption
- Deepgram API docs for `nova-2` model options

### Step 2: Research STT options

- Deepgram API capabilities (streaming, language hints, model selection)
- Whisper WASM capabilities and limitations
- Browser SpeechRecognition API support matrix (caniuse)
- Existing cost-per-minute for Deepgram

### Step 3: Design provider chain

Define the fallback strategy. Example:

- Pronunciation grading → Deepgram only (accuracy first)
- Voice notes → Browser-native (zero cost) → Whisper WASM (offline fallback)
- Quiz answers → Deepgram (fast, accurate) → Browser-native (cost saving)

### Step 4: Write the design doc

Write `docs/decisions/2026-06-29-unified-stt-engine-design.md` following the outline above.

## Done criteria

- [ ] Design doc at `docs/decisions/2026-06-29-unified-stt-engine-design.md` exists
- [ ] Provider abstraction interface is clearly defined with TypeScript types
- [ ] Cost tracking approach is documented
- [ ] Migration path for existing pronunciation endpoint is documented
- [ ] No production code was modified

## STOP conditions

- If the existing Deepgram integration is already structured as a provider abstraction (read the route file first) — adjust the spike to document the gap between current abstraction and the unified vision, rather than designing from scratch.
