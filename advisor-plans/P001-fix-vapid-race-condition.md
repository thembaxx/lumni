# Plan P001: Fix Push Notification VAPID Race Condition

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/lib/services/push-delivery.ts`
> If the file changed, compare the "Current state" excerpts against the live code.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

The first push notification — and every notification after a server reload — is silently dropped because `ensureVapid()` fires an async `import("web-push")` without awaiting it, and `sendToSubscription()` calls `sendNotification()` before `setVapidDetails()` resolves. Users who rely on push notifications for study reminders, weekly digests, and daily alerts miss the first one every time the server restarts.

## Current state

**`src/lib/services/push-delivery.ts:20-54`**:

```typescript
let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  // Lazy import to avoid bundling web-push on client
  void import("web-push").then(({ default: webpush }) => {
    webpush.setVapidDetails("mailto:study@lumni.app", pub, priv);
    vapidConfigured = true;
  });
}

async function sendToSubscription(...): Promise<boolean> {
  try {
    const { default: webpush } = await import("web-push");
    if (!vapidConfigured) ensureVapid();
    // ...
    await webpush.sendNotification(subscription, JSON.stringify({ ... }));
    return true;
  } catch {
    return false;
  }
}
```

The problem: `ensureVapid()` fires `void import(...).then(...)` — it does NOT return a Promise. `sendToSubscription` imports web-push, calls `ensureVapid()` (which starts the async process but doesn't await), then immediately calls `sendNotification()`. On cold start, `setVapidDetails()` hasn't been called yet, so `sendNotification` throws "VAPID keys not configured", which is silently caught.

**Repo conventions**: This file uses a `PushDeliveryService` class with `deps` DI pattern. Error handling uses `catch { return false }` for expected-failure paths (missing subscriptions). The rest of the codebase uses `logError()` from `@/lib/shared/logger` for unexpected failures — see `src/lib/sync/service.ts:64` for the pattern.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/lib/services/push-delivery.ts`

**Out of scope**:

- Any other push notification code
- The `digest-service.ts` or `submission-service.ts` that call `PushDeliveryService`
- Any changes to how VAPID keys are configured

## Git workflow

- Branch: `advisor/P001-fix-vapid-race`
- Commit message style: `fix: await VAPID configuration before sending push notification` (matches repo's conventional commit style)
- Do NOT push or open a PR

## Steps

### Step 1: Fix `ensureVapid()` to return a Promise

Change `ensureVapid()` from a fire-and-forget `void` call to returning a Promise that resolves once VAPID is configured. Use a module-level promise variable so subsequent calls reuse the same promise.

Replace `let vapidConfigured = false;` and `function ensureVapid() { ... }` (lines 18-29) with:

```typescript
let vapidInitPromise: Promise<void> | null = null;

function ensureVapid(): Promise<void> {
  if (vapidInitPromise) return vapidInitPromise;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    vapidInitPromise = Promise.resolve();
    return vapidInitPromise;
  }
  vapidInitPromise = (async () => {
    const { default: webpush } = await import("web-push");
    webpush.setVapidDetails("mailto:study@lumni.app", pub, priv);
  })();
  return vapidInitPromise;
}
```

**Key points**:

- Use `vapidInitPromise` (a Promise, not a boolean flag) so multiple callers can `await` the same in-flight initialization
- If keys are missing, resolve immediately (graceful no-op, same as before)
- The `void import(...).then(...)` pattern is replaced with an `async` IIFE

### Step 2: Update `sendToSubscription()` to await VAPID init

In `sendToSubscription()` (lines 32-55), replace the `if (!vapidConfigured) ensureVapid();` guard with `await ensureVapid();` — always await (it's a no-op after first call since the promise resolves immediately).

Change lines 37-38 from:

```typescript
const { default: webpush } = await import("web-push");
if (!vapidConfigured) ensureVapid();
```

to:

```typescript
const { default: webpush } = await import("web-push");
await ensureVapid();
```

### Step 3: Update `constructor` to not eagerly call ensureVapid

The `constructor` (line 102) calls `ensureVapid()` eagerly during construction. Change it to `ensureVapid()` — the return value can be ignored since `sendToSubscription` will also call it. Just remove the `void`:

Keep `ensureVapid();` (without void) — it starts the init process. All callers in `sendToSubscription` now properly await it.

**Verify**: `pnpm exec oxlint` → exit 0. `pnpm run typecheck` → exit 0.

## Test plan

There are no existing tests for `push-delivery.ts`. This plan does NOT add test files — the fix is mechanical and the risk is LOW. Add tests if the operator requests it.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -n "vapidConfigured" src/lib/services/push-delivery.ts` returns no matches (the boolean flag is removed)
- [ ] `grep -n "void.*ensureVapid" src/lib/services/push-delivery.ts` returns no matches
- [ ] No files outside `src/lib/services/push-delivery.ts` are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The code at `src/lib/services/push-delivery.ts:18-54` doesn't match the excerpts above
- A step's verification fails after a reasonable fix attempt
- The fix requires touching a file outside the in-scope list

## Maintenance notes

- If future code adds another direct call to `sendToSubscription()` bypassing `PushDeliveryService`, it must also `await ensureVapid()`.
- The `web-push` dynamic import pattern (`await import("web-push")`) appears in both `ensureVapid` and `sendToSubscription`. If a bundler change makes dynamic imports expensive, consider static import with a `typeof window` guard instead.
