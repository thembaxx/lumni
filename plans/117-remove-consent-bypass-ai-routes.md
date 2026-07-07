# Plan 117: Remove hardcoded consent bypass from AI route configs

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/ src/lib/api/create-route-handler.ts`

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

Every AI-generating route hardcodes `aiContext: { consentGranted: true }` in its `createRouteHandler` config. This means the consent stored in `src/lib/consent/ai-gate.ts` is never consulted — user data is sent to third-party AI providers regardless of consent preference. This is a GDPR/POPIA violation.

## Current state

13 routes pass the hardcoded flag. The affected files and lines:

- `src/app/api/solve/route.ts:18`
- `src/app/api/engine/generate/route.ts:11`
- `src/app/api/engine/grade/route.ts:10`
- `src/app/api/engine/hint/route.ts:11`
- `src/app/api/engine/visual/route.ts:9`
- `src/app/api/engine/voice/route.ts:8`
- `src/app/api/chat/route.ts:126`
- `src/app/api/chat/image/route.ts:14`
- `src/app/api/generate-element-fact/route.ts:17`
- `src/app/api/curated-problems/route.ts:15`
- `src/app/api/engine/test/route.ts:10`
- `src/app/api/engine/visual/test/route.ts:8`

The `createRouteHandler` factory at `src/lib/api/create-route-handler.ts` receives `aiContext` in the config and passes it through to `runWithAICallContext`. The real consent check lives at `src/lib/consent/ai-gate.ts:5` via `getDataSharingConsent()`.

## Commands you will need

| Purpose   | Command              | Expected on success       |
| --------- | -------------------- | ------------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors         |
| Tests     | `pnpm run test`      | all pass                  |
| Lint      | `pnpm exec oxlint`   | 0 errors on changed files |

## Steps

### Step 1: Remove hardcoded consent from all route configs

For each of the 13 routes listed above, remove the `aiContext: { consentGranted: true }` line from the `createRouteHandler` config. The routes that need consent-gated behavior should pass `aiContext` dynamically inside the `execute` callback, not in the static config.

**Verify**: `grep -rn "consentGranted: true" src/app/api/` → 0 matches

### Step 2: Verify the consent check is actually wired

Read `src/lib/api/create-route-handler.ts` — confirm that when `aiContext` is not provided, the handler calls `getDataSharingConsent(userId)` to resolve consent from the user's stored record. If `createRouteHandler` doesn't do this automatically, add a fallback in the `execute` wrapper that resolves consent when `aiContext` is absent.

The consent resolution should follow the pattern at `src/lib/consent/ai-gate.ts`:

```ts
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
const consent = await getDataSharingConsent(userId);
```

**Verify**: `pnpm run typecheck` → exit 0

### Step 3: Test consent flow

Ensure the existing consent tests in `src/lib/consent/` still pass. Add a test to `src/lib/api/__tests__/create-route-handler.test.ts` that verifies:

- When consent is granted, AI calls proceed normally
- When consent is denied, AI calls return an appropriate error

**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] `grep -rn "consentGranted: true" src/app/api/` returns 0 matches
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `createRouteHandler` doesn't have access to `userId` in the config scope (only in `execute`)
- Removing hardcoded consent breaks an existing test that depends on it
- The consent resolution in `ai-gate.ts` requires a client-side-only flag that can't be resolved server-side
