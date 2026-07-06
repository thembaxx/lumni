# Plan 105: Remove freeTTS third-party data sharing fallback

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7bb0d688..HEAD -- src/lib/voice-engine/voice-engine.ts src/app/api/tts/route.ts`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `7bb0d688`, 2026-07-06
- **Issue**: (omit unless published via `--issues`)

## Why this matters

The VoiceEngine and the `/api/tts` route both use a free third-party service (`api.freetts.org`) as an unauthenticated fallback for TTS. User-submitted text (which may contain PII, homework answers, or sensitive study content) is transmitted to this unaffiliated service with no data-processing agreement, contractual guarantees, or user-facing disclosure. This is a POPIA/GDPR compliance risk. The fix is to either remove the freeTTS fallback entirely or gate it behind an explicit feature flag that signals consent. Removing it is the safer path: ElevenLabs and Google Cloud TTS are the paid providers that have contractual data protections.

## Current state

1. **`src/lib/voice-engine/voice-engine.ts:24-41`** — `buildProviderChain()` always appends freeTTS as the last fallback:

```ts
private buildProviderChain(): TTSProviderConfig[] {
  const chain: TTSProviderConfig[] = [];

  if (process.env.ELEVENLABS_API_KEY) {
    chain.push({ name: "elevenlabs", synthesize: (t, o) => this.elevenlabsSynthesize(t, o) });
  }

  if (process.env.GOOGLE_TTS_API_KEY) {
    chain.push({
      name: "google-cloud-tts",
      synthesize: (t, o) => this.googleTtsSynthesize(t, o),
    });
  }

  chain.push({ name: "freetts", synthesize: (t, o) => this.freeTtsSynthesize(t, o) });

  return chain;
}
```

2. **`src/lib/voice-engine/voice-engine.ts:129-150`** — `freeTtsSynthesize()` sends text to `https://api.freetts.org/v1/synthesizes`.

3. **`src/app/api/tts/route.ts:5`** — Contains `const FREE_TTS_API_URL = "https://api.freetts.org/v1/synthesizes"` — a standalone TTS route that uses freeTTS directly (with `auth: "required"` but still no consent).

4. **`src/lib/voice-engine/voice-engine.ts:43-50`** — `synthesize()` iterates providers in order and returns the first success:

```ts
async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult | null> {
  if (!text || text.trim().length === 0) return null;
  const merged: TTSOptions = { ...DEFAULT_OPTIONS, ...options };

  for (const provider of this.providers) {
    try {
      const result = await provider.synthesize(text, merged);
      if (result) return result;
    } catch (err) {
      logError(`VoiceEngine.${provider.name}`, err);
    }
  }
  return null;
}
```

5. **Repo conventions**: The codebase has a `CONSENT_GATE` pattern in `src/lib/consent/ai-gate.ts` and `getDataSharingConsent()` for AI features. VoiceEngine has no corresponding consent gate. When both paid providers are missing keys, the engine falls back to freeTTS silently.

## Commands you will need

| Purpose   | Command                                  | Expected on success |
| --------- | ---------------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`                     | exit 0, no errors   |
| Tests     | `pnpm run test -- --grep "voice-engine"` | all pass            |
| Lint      | `pnpm exec oxlint`                       | exit 0              |
| Format    | `pnpm exec oxfmt --check`                | exit 0              |

## Scope

**In scope**:

- `src/lib/voice-engine/voice-engine.ts` — remove freeTTS from the provider chain and delete the `freeTtsSynthesize()` method
- `src/app/api/tts/route.ts` — delete the file (the VoiceEngine via `/api/engine/voice` is the canonical TTS path)

**Out of scope**:

- `src/lib/voice-engine/types.ts` — do not modify (the `TTSProviderName` type includes `"freetts"` but removing it without updating types would cause type errors; see step 2)
- `src/lib/voice-engine/index.ts` — update if the barrel change is needed
- Any other TTS-consuming components
- Adding a Google TTS/ElevenLabs fallback confirmation — this plan only removes the risky fallback

## Git workflow

- Branch: `advisor/105-remove-free-tts`
- Commits: `feat: remove freeTTS fallback from VoiceEngine`, then `feat: remove standalone /api/tts route`
- Do NOT push or open a PR unless instructed

## Steps

### Step 1: Remove freeTTS from VoiceEngine provider chain

In `src/lib/voice-engine/voice-engine.ts`:

1. Remove the `freeTtsSynthesize()` method entirely (lines 129-150)
2. Remove the `chain.push({ name: "freetts", ... })` line from `buildProviderChain()` (line 38)
3. Remove the `import { logError } from "@/lib/shared/logger"` if it becomes unused (check first — it's used in other methods)

**Verify**:

```bash
pnpm run typecheck
# → exit 0, no errors
pnpm exec oxlint
# → exit 0
```

### Step 2: Update `TTSProviderName` type

In `src/lib/voice-engine/types.ts`, find the `TTSProviderName` type (or equivalent union) and remove `"freetts"` from the union.

**Verify**:

```bash
pnpm run typecheck
# → exit 0 (no "unused member" or "missing member" errors)
```

### Step 3: Delete standalone `/api/tts` route

Delete the directory `src/app/api/tts/route.ts`. Since it's the only file in that route directory, also check if `src/app/api/tts/` has any other files — if not, the parent directory can remain empty (Next.js ignores empty route directories).

Check for any imports of `@/app/api/tts` or `"/api/tts"` in the codebase:

```bash
rg -l "/api/tts" src/
# → should return no results (if it does, those are OUT OF SCOPE — stop and report)
```

**Verify**:

```bash
pnpm run typecheck
# → exit 0 (no broken imports)
```

### Step 4: Run full verification

**Verify**:

```bash
pnpm run typecheck
# → exit 0
pnpm run test
# → all pass (1843+)
pnpm exec oxfmt --check
# → exit 0
pnpm exec oxlint
# → exit 0
```

## Test plan

The VoiceEngine test file (if one exists at `src/lib/voice-engine/__tests__/`) should be checked. If tests reference `freeTtsSynthesize`, remove those test cases. Run:

```bash
pnpm run test -- --grep "voice-engine|VoiceEngine|tts"
# → all pass
```

If no VoiceEngine tests exist, no test changes are needed — this is a known gap (see TST-01 in the audit).

## Done criteria

ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm exec oxfmt --check` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `freeTtsSynthesize` method no longer exists in `src/lib/voice-engine/voice-engine.ts`
- [ ] `"freetts"` is no longer in the provider chain in `buildProviderChain()`
- [ ] `"freetts"` is removed from `TTSProviderName` in `src/lib/voice-engine/types.ts`
- [ ] `src/app/api/tts/route.ts` is deleted
- [ ] No files outside the in-scope list are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- Any import of `@/app/api/tts` or `/api/tts` is found in the codebase after deleting the route (indicating consumers that must be updated — this would be out of scope for this plan)
- The `TTSProviderName` type doesn't exist or has a different name in `types.ts`
- Typecheck fails after removing `"freetts"` from the provider chain (may indicate the type is used elsewhere that expects all variants to be present)

## Maintenance notes

- After this change, VoiceEngine will return `null` from `synthesize()` when both ElevenLabs and Google TTS API keys are absent. The consuming code (TTSButtons, pronunciation sessions) already handles null gracefully — check `voice-engine.ts:43-50` to confirm.
- If the team later wants a free/open TTS fallback, they should add one with a proper consent gate (matching the `getDataSharingConsent()` pattern in `src/lib/consent/ai-gate.ts`).
- The `src/app/api/tts/` directory can be deleted entirely after removal — it will be recreated if the team adds a TTS route later.
