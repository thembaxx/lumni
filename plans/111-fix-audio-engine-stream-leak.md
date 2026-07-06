# Plan 111: Fix AudioEngine stream track leak on recording start failure

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/lib/audio-engine/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

When `startRecording()` acquires a microphone stream via `getUserMedia` at
line 101 but `MediaRecorder(stream)` or `recorder.start()` throws (e.g.,
unsupported MIME type), the catch block at line 138 handles the error but
never stops the stream tracks. The microphone stays locked. Subsequent
recording attempts fail with `NotReadableError` until the page is reloaded.

This is a MEDIUM-severity bug: unrecoverable without page refresh, and the
condition is triggered by browser/environment differences that are hard to
predict.

## Current state

`src/lib/audio-engine/audio-engine.ts:100-148`:

```ts
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // line 101
  // ... MediaRecorder created at line 105, started at line 123 ...
} catch (err) {
  logError("AudioEngineStartRecording", err); // line 139
  // error handling, but NEVER: stream.getTracks().forEach(t => t.stop())
  this.notify(); // line 147
}
```

The `stream` variable is scoped inside the `try` block (declared at line 101
with `const`). The `catch` block cannot access it. The stream tracks leak.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Tests     | `pnpm run test`          | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/audio-engine/audio-engine.ts` — fix the stream track leak

**Out of scope**:

- Object URL leaks in `startPlayback` / `destroy` (separate LOW finding)
- Any other audio engine features

## Steps

### Step 1: Fix the stream leak

In `startRecording()`, move the `stream` variable declaration outside the
`try` block so the `catch` block can access it. Add track cleanup in `catch`.

Current code structure (lines 100-148):

```ts
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // ... setup ...
} catch (err) {
  logError("AudioEngineStartRecording", err);
  // ... error state ...
  this.notify();
}
```

Replace with:

```ts
let stream: MediaStream | null = null;
try {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // ... rest of setup unchanged (lines 102-137) ...
} catch (err) {
  if (stream) {
    for (const t of stream.getTracks()) t.stop();
  }
  logError("AudioEngineStartRecording", err);
  // ... error state unchanged (lines 140-147) ...
  this.notify();
}
```

The key change: declare `stream` with `let` before the try block so it's
accessible in catch, and add the `if (stream) { for ... t.stop() }` guard
before any other catch logic.

**Verify**:

- `pnpm exec oxlint --fix` → 0 warnings
- `pnpm run typecheck` → 0 errors

### Step 2: Run tests

```bash
pnpm run test
```

→ all tests pass. If there are audio-engine tests, they verify the fix.

## Test plan

- No new tests required — the change is 4 lines added to the catch block
- If `src/lib/audio-engine/__tests__/` exists, run those tests specifically:
  `pnpm run test -- src/lib/audio-engine`

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Only `src/lib/audio-engine/audio-engine.ts` is modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The file structure has been significantly refactored — the try block layout
  may differ from the excerpt above; stop and read the current code
- Any test specifically testing the leak behavior fails (unlikely — no test
  existed for this path)

## Maintenance notes

- Future refactors should ensure that `getUserMedia` streams are always
  released in `finally` blocks, not just `catch` — the pattern to follow is
  "acquire resource, try/finally release"
- The same file has a related object-URL leak in `startPlayback`/`destroy`
  (BUG-02 from the audit) — not addressed here, tracked separately
