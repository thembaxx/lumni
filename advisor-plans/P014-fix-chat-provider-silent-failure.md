# Plan P014: Fix Silent AI Provider Initialization Failure in Chat Route

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/app/api/chat/route.ts`
> If the file changed, compare excerpts against live code.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: P002 (chat auth refactor) — strongly recommended; do P002 first or rebase
- **Category**: bug
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

The chat route's `getModels()` function has 3 empty `catch {}` blocks (one per provider init). If a provider's API key becomes invalid or its base URL goes down, the provider creation throws, the error is silently swallowed, and the provider is skipped. The only signal is a degraded fallback chain — no log, no alert, no error monitoring. This means an expired NVIDIA NIM key or a misconfigured Groq URL goes undetected until users notice the AI chat is less capable.

## Current state

**`src/app/api/chat/route.ts:15-54`** (getModels):

```typescript
function getModels() {
  const models: Array<{ provider: string; model: LanguageModel }> = [];

  if (GEMINI_API_KEY) {
    try {
      const google = createGoogle({ apiKey: GEMINI_API_KEY });
      models.push({ provider: "gemini", model: google("gemini-2.0-flash-lite-001") });
    } catch {
      /* skip */
    }
  }

  if (NVIDIA_API_KEY) {
    try {
      const nvidia = createOpenAI({ ... });
      models.push(...);
    } catch {
      /* skip */
    }
  }

  // ... GROQ has the same pattern
}
```

The function is called on every request. A deployed problem (expired key, API endpoint change) stays silent until a manual config audit catches it.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/app/api/chat/route.ts` — add logError to each catch block in `getModels()`

**Out of scope**:

- Any other catch blocks in chat/route.ts (those are covered by P012)
- The P002 refactor to createRouteHandler (do that first)
- The `src/lib/ai/client.ts` which has similar silent catch blocks in `initAI`

## Git workflow

- Branch: `advisor/P014-chat-provider-logging`
- Commit message: `fix: add logError to silent catch blocks in chat route provider init`
- Do NOT push or open a PR

## Steps

### Step 1: Import logError and fix the 3 catch blocks

If not already imported, add:

```typescript
import { logError } from "@/lib/shared/logger";
```

Change each `catch { /* skip */ }` to:

```typescript
catch (err) {
  logError("Chat.getModels.gemini", err);
}
```

Use appropriate labels: `gemini`, `nvidia`, `groq`.

### Step 2: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

No new tests. Mechanical logging addition.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -n '"skip"' src/app/api/chat/route.ts` returns no matches (the `/* skip */` comments are removed)
- [ ] No files outside `src/app/api/chat/route.ts` are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- P002 hasn't been applied and the `logError` import already exists from another PR — just use it
