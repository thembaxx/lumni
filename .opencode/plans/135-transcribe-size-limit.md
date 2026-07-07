# Plan 135: Add base64 audio size limit to transcribe endpoint

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/app/api/engine/transcribe/route.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: security
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The transcribe endpoint forwards base64 audio to Deepgram (charges per minute). The only validation is `body.audio.length === 0` — a 100MB base64 payload passes. A 5MB cap (~2-3 min audio) covers any pronunciation recording while bounding cost exposure.

## Current state

`src/app/api/engine/transcribe/route.ts:10-15`:

```typescript
validate: (body) => {
  if (!body.audio || body.audio.length === 0) return "audio is required";
  return null;
},
```

## Scope

**In scope**: `src/app/api/engine/transcribe/route.ts`, `src/app/api/engine/transcribe/__tests__/route.test.ts`

## Steps

### Step 1: Add MAX_AUDIO_SIZE constant and size check

In `src/app/api/engine/transcribe/route.ts`, add:

```typescript
const MAX_AUDIO_SIZE_BYTES = 5_000_000;
```

Update validate:

```typescript
validate: (body) => {
  if (!body.audio || body.audio.length === 0) return "audio is required";
  if (body.audio.length > MAX_AUDIO_SIZE_BYTES) return "audio exceeds maximum size";
  return null;
},
```

### Step 2: Add test for the size limit

In `src/app/api/engine/transcribe/__tests__/route.test.ts`, add: "rejects audio exceeding max size" — POST `{ audio: "a".repeat(5000001) }`, expect 400.

### Step 3: Verify

`pnpm typecheck` → exit 0. `pnpm test -- transcribe` → all pass.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test -- transcribe` passes, including new size-limit test
- [ ] `grep "MAX_AUDIO_SIZE" src/app/api/engine/transcribe/route.ts` returns the constant
