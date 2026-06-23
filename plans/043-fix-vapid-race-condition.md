# Plan 043: Fix VAPID initialization race in PushDeliveryService

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/services/push-delivery.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`ensureVapid()` fires `void import("web-push").then(...)` without returning the promise. The `sendToSubscription()` function calls `ensureVapid()` but does not await VAPID configuration. The first push notification in each server process lifetime silently fails because `webpush.sendNotification()` is called before `webpush.setVapidDetails()` completes.

## Current state

`src/lib/services/push-delivery.ts:20-30`:

```typescript
let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  void import("web-push").then(({ default: webpush }) => {
    webpush.setVapidDetails("mailto:study@lumni.app", pub, priv);
    vapidConfigured = true;
  });
}
```

`sendToSubscription()` (line 32-55) calls `ensureVapid()` but doesn't await the import resolution.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**: `src/lib/services/push-delivery.ts`
**Out of scope**: Any consumer of `PushDeliveryService`

## Steps

### Step 1: Make ensureVapid return a Promise

```typescript
let vapidReady: Promise<void> | null = null;

function ensureVapid(): Promise<void> {
  if (vapidReady) return vapidReady;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    vapidReady = Promise.resolve();
    return vapidReady;
  }
  vapidReady = import("web-push").then(({ default: webpush }) => {
    webpush.setVapidDetails("mailto:study@lumni.app", pub, priv);
  });
  return vapidReady;
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Await ensureVapid in sendToSubscription

Change the guard at line 38 from:

```typescript
if (!vapidConfigured) ensureVapid();
```

to:

```typescript
await ensureVapid();
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Verify web-push import is only called once

The `ensureVapid` promise cache (`vapidReady`) ensures the dynamic import of "web-push" happens exactly once, even with concurrent calls.

**Verify**: `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `ensureVapid()` returns `Promise<void>` and is awaited in `sendToSubscription()`
- [ ] `plans/README.md` status row updated

## STOP conditions

- Code at `push-delivery.ts:20-30` doesn't match excerpts
- A test imports `web-push` module-level and the dynamic import conflicts (unlikely — the dynamic import is intentional)
