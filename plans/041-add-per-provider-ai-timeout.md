# Plan 041: Add per-provider AI request timeout + Gemini image AbortController

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7525d6ed..HEAD -- src/lib/ai/client.ts src/lib/ai/providers/gemini.ts`
> If any in-scope file changed, compare before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (timeout is strictly additive — only truncates hanging requests)
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

The AI provider chain (`_callProviders`) loops through providers sequentially. If Gemini's HTTP call hangs (network partition, no exception thrown), the loop blocks until the underlying HTTP client's default timeout (~30–120s) before trying Nvidia/Groq. No `AbortController`-based timeout is set per provider. Separately, `gemini.ts` fetches image URLs with no timeout at all — a slow image can hang generation for 2+ minutes.

Together these cost 30–120s per user-visible AI generation during provider failures, consuming serverless execution time and blocking the fallback chain.

## Current state

`src/lib/ai/client.ts:66-98` — sequential fallback loop with no timeout:

```typescript
for (const provider of this.providers) {
  const start = performance.now();
  try {
    const response = await provider.generate(request);
    // ... no AbortSignal passed
  } catch (err) {
    // catches errors but doesn't timeout hanging connections
  }
}
```

`src/lib/ai/providers/gemini.ts:14` — image fetch with no timeout:

```typescript
const imageResponse = await fetch(m.imageUrl);
// No AbortController — can hang indefinitely
```

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/ai/client.ts` — add per-provider timeout
- `src/lib/ai/providers/gemini.ts` — add image fetch AbortController

**Out of scope**:

- Other AI providers (nvidia.ts, groq.ts) — their HTTP client defaults are sufficient for now
- `src/lib/ai/types.ts` — the `AIRequest` and `AIResult` types don't need changes
- The `AIClient` constructor or config

## Steps

### Step 1: Add per-provider timeout to client.ts

In `_callProviders`, add a provider-level timeout before the `for` loop and pass it to each `provider.generate(request)`:

The `AIRequest` type currently has fields for `prompt`, `systemPrompt`, etc. If it doesn't have a `signal` field, you'll need to add one. First check:

```bash
pnpm exec grep -n "interface AIRequest" src/lib/ai/types.ts
```

If `AIRequest` already has `signal?: AbortSignal`, use it. If not, add it:

```typescript
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  // ... existing fields
  signal?: AbortSignal;
}
```

Then in `_callProviders`:

```typescript
const PROVIDER_TIMEOUT_MS = 15_000;

for (const provider of this.providers) {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    const response = await provider.generate({ ...request, signal: controller.signal });
    clearTimeout(timeoutId);
    // ... rest of success path unchanged
  } catch (err) {
    clearTimeout(timeoutId);
    // ... rest of catch path unchanged
  }
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Add AbortController to Gemini image fetch

In `src/lib/ai/providers/gemini.ts`, find the `fetch(m.imageUrl)` call and add a 5-second timeout:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);
try {
  const imageResponse = await fetch(m.imageUrl, { signal: controller.signal });
  // ... rest of the function
} finally {
  clearTimeout(timeoutId);
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Run full test suite

**Verify**: `pnpm run test` → all pass.

## Test plan

- Existing tests must still pass (the timeout is additive and only affects hanging connections).
- If there are tests that mock `provider.generate()`, ensure the mock accepts the `signal` property.
- Search for tests that assert on `AIRequest` shape:
  ```bash
  pnpm exec grep -rn "AIRequest" src/ --include="*.test.*"
  ```
  Update any that construct mock `AIRequest` objects to include `signal?: undefined`.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0; all existing tests pass
- [ ] `_callProviders` in `client.ts` passes `AbortSignal.timeout(15000)` or equivalent to each `provider.generate()`
- [ ] `gemini.ts` image fetch uses an `AbortController` with a 5-second timeout
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The code at `client.ts:66-98` or `gemini.ts:14` doesn't match the excerpts
- `AIRequest` type is in a different file than expected (search for it)
- A test mocks `provider.generate()` without supporting `signal` — add `signal: undefined` to the mock

## Maintenance notes

- The 15s per-provider timeout is a starting point. If provider latency increases (e.g., larger models), bump this in the single constant.
- The Gemini image fetch timeout (5s) is independent and can be tuned separately — images are typically small.
