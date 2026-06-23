# Plan 044: Fix consent bypass on engine API routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/app/api/engine/ src/lib/api/create-route-handler.ts src/lib/ai/client.ts src/lib/consent/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM (changing consent logic affects all AI operations — test thoroughly)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

All four engine API routes (`generate`, `grade`, `hint`, `visual`) hardcode `aiContext: { consentGranted: true }` in their `createRouteHandler` config. This bypasses the user's actual data-sharing consent decision. The server-side consent mechanism reads a module-level singleton (`src/lib/consent/ai-gate.ts:3`) which is never reliably synced per-request. User privacy preferences for AI operations are effectively ignored.

## Current state

`src/app/api/engine/generate/route.ts:10` (and identical in grade, hint, visual):

```typescript
export const POST = createRouteHandler({
  auth: "none",
  budget: "generate",
  aiContext: { consentGranted: true }, // <-- always grants consent
  // ...
});
```

`src/lib/consent/ai-gate.ts`:

```typescript
let _dataSharingConsent = false; // module-level singleton

export function getDataSharingConsent(): boolean {
  return _dataSharingConsent;
}
```

`src/lib/ai/client.ts:53`:

```typescript
const consent = getAICallContext()?.consentGranted ?? getDataSharingConsent();
// aiContext.consentGranted (true from route) wins over the module-level value
```

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/app/api/engine/generate/route.ts`
- `src/app/api/engine/grade/route.ts`
- `src/app/api/engine/hint/route.ts`
- `src/app/api/engine/visual/route.ts`
- `src/lib/api/create-route-handler.ts`
- `src/lib/consent/ai-gate.ts`
- `src/lib/ai/client.ts`

**Out of scope**:

- Other API routes using `aiContext`
- The `getAICallContext` / `runWithAICallContext` infrastructure in `src/lib/ai/call-context.ts`
- Client-side consent UI

## Steps

### Step 1: Remove hardcoded consentGranted from all 4 engine routes

In each of the 4 route files, remove the `aiContext: { consentGranted: true }` line. The routes should become:

```typescript
export const POST = createRouteHandler({
  auth: "none",
  budget: "generate",
  // aiContext removed — consent flows from per-request context
  parseBody: async (req) => { ... },
  // ...
});
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Wire per-request consent in createRouteHandler

In `src/lib/api/create-route-handler.ts`, after the `checkBudget` call but before `execute`, read the user's actual consent. The pattern already has `userId` available. Use `runWithAICallContext` (already imported at line 4) to set the consent value per-request.

Search for how `runWithAICallContext` is used in the file. It likely wraps the `execute` call. If the config has `aiContext`, merge it. If it doesn't, set consent from the user's stored preference:

```typescript
// Inside the handler, after resolving userId:
const consent = await getConsentForUser(userId ?? "anonymous");
// Or if runWithAICallContext is already wrapping, extend the context
```

Look at how `runWithAICallContext` is called in `create-route-handler.ts` (around line 100-120). You'll need to either:

- (a) Add `consentGranted` to the `AICallContext` based on the fetched user consent, or
- (b) Fetch it before the AI call and pass it through.

The key change: instead of always passing `consentGranted: true`, conditionally set it based on `syncDataSharingConsentFromService(userId)`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Remove or fix the module-level singleton

In `src/lib/consent/ai-gate.ts`, either:

- Remove `updateDataSharingConsent()` and `syncDataSharingConsentFromService()` if they're only used for the (now-replaced) module-level path, OR
- Keep them but ensure they're called per-request in `createRouteHandler`

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Run tests

**Verify**: `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No engine route hardcodes `consentGranted: true`
- [ ] `createRouteHandler` reads per-user consent (from `syncDataSharingConsentFromService` or AsyncLocalStorage context)
- [ ] Module-level `_dataSharingConsent` in `ai-gate.ts` is either removed or only used as fallback
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `create-route-handler.ts` structure is significantly different from described (read the full file first)
- `syncDataSharingConsentFromService` doesn't exist or has a different signature
- Removing `aiContext` from route configs breaks the `checkBudget` call chain
