# Plan 128: Extract AI provider initialization to a shared singleton

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/ai/ src/lib/services/ src/lib/question-engine/ src/lib/visual-engine/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

Five services contain identical `if (!isAIConfigured()) { initAI({...}) }` blocks. If the provider list changes, services silently diverge.

## Current state

Identical pattern at:

- `src/lib/services/ai-solver.ts:64-68`
- `src/lib/services/element-fact.ts:17-22`
- `src/lib/services/curated-problems.ts:79-80`
- `src/lib/question-engine/question-engine.ts:77-81`
- `src/lib/visual-engine/visual-engine.ts:68-69`

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |

## Steps

### Step 1: Create ensureAI() helper

In `src/lib/ai/index.ts` (or a new `src/lib/ai/ensure.ts`), add:

```ts
let _initialized = false;

export function ensureAI(): void {
  if (_initialized) return;
  if (!isAIConfigured()) {
    initAI({
      geminiApiKey: process.env.GEMINI_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
      nimApiKey: process.env.NIM_API_KEY,
    });
  }
  _initialized = true;
}
```

### Step 2: Replace init blocks in all 5 services

Replace the inline `if (!isAIConfigured()) { initAI({...}) }` with `ensureAI()`.

**Verify**: `grep -rn "isAIConfigured" src/lib/` → only `ensure.ts` and `client.ts`

### Step 3: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] Single `ensureAI()` function replaces 5 duplicate init blocks
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `initAI` function has different parameters across call sites (check for NIM_API_KEY presence)
