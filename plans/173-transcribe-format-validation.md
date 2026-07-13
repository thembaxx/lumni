---
status: TODO
priority: P2
effort: S
risk: LOW
confidence: MED
created: 2026-07-12
commit: 4fcd46a4
---

# 173 — Transcribe route uses client `format` as `Content-Type`

## Context

`POST /api/engine/transcribe` takes `format` verbatim from the JSON body and uses it as the outbound `Content-Type` header when calling Deepgram. An attacker controls the header value. Modern `undici` rejects CRLF/illegal values (so classic header injection is blocked), but an unexpected content type can alter upstream parsing. Unvalidated header values are poor practice.

## Current state (verified)

`src/app/api/engine/transcribe/route.ts:38-45`

```ts
const format = body.format || "audio/webm";
const response = await fetch("https://api.deepgram.com/v1/listen", {
  method: "POST",
  headers: {
    Authorization: `Token ${apiKey}`,
    "Content-Type": format,
  },
  body: audioBuffer,
});
```

## Goal

Validate `format` against an allowlist of audio MIME types before using it as `Content-Type`.

## Steps

1. Define an allowlist near the top of the route:
   ```ts
   const ALLOWED_AUDIO_TYPES = new Set([
     "audio/webm",
     "audio/ogg",
     "audio/wav",
     "audio/mp3",
     "audio/mpeg",
     "audio/x-wav",
     "audio/flac",
     "audio/x-flac",
     "audio/mp4",
     "audio/aac",
   ]);
   ```
2. Replace `const format = body.format || "audio/webm";` with:
   ```ts
   const format = body.format && ALLOWED_AUDIO_TYPES.has(body.format) ? body.format : "audio/webm";
   ```
   (Apply the same validated `format` to the fallback `Blob` type at line 25 for consistency.)
3. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/app/api/engine/transcribe/route.ts`.
- Out of scope: STT engine fallback chain, Deepgram response handling.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/app/api/engine/transcribe` → pass (add a test: `format: "text/html"` falls back to `audio/webm`; `format: "audio/wav"` preserved).

## Test plan

- Add/extend the transcribe route test: assert that with `body.format = "text/html"`, the outgoing `Content-Type` is `audio/webm` (spy/interceptor on `fetch` to Deepgram), and with a valid type it is forwarded.

## Maintenance

- If Deepgram adds support for a new audio type, add it to `ALLOWED_AUDIO_TYPES` in one place.

## Escape hatches

- None. This is a strict allowlist; any legitimate client always sends a standard audio MIME type.
