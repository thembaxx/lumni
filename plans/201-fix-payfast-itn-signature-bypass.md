# Plan 201: Fix PayFast ITN signature bypass when passphrase unset

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: CRITICAL
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The PayFast ITN (Instant Transaction Notification) handler is the server-to-server callback that tells us a payment succeeded. It currently has a short-circuit at `src/app/api/payfast/itn/route.ts:17-19` that returns `true` (valid signature) when `PAYFAST_PASSPHRASE` is not configured. This means if the environment variable is accidentally unset — in development, staging, or a misconfigured production deployment — every incoming ITN request is automatically accepted as valid, regardless of its actual authenticity. An attacker who discovers the endpoint could forge payment confirmations and unlock premium features without paying.

## Current state

`src/app/api/payfast/itn/route.ts:17-19`:

```typescript
const passphrase = process.env.PAYFAST_PASSPHRASE;
if (!passphrase) return true; // <-- short-circuit bypasses all validation
```

The route has no rate limiting and no Sentry logging for the missing-passphrase case.

## Target state

- When `PAYFAST_PASSPHRASE` is not set, the route rejects the request with a 500 error and logs to Sentry
- The route has rate limiting applied
- The missing-passphrase case is monitored so ops can catch misconfiguration immediately

## Scope

- `src/app/api/payfast/itn/route.ts` — remove short-circuit, add error handling, configure rate limit
- Potentially `src/lib/shared/with-rate-limit.ts` — no changes needed if route already uses `createRouteHandler` with rate limit support

## Steps

### 1. Remove `if (!passphrase) return true` from `verifyPayfastSignature()`

Locate the `verifyPayfastSignature` function (or inline logic) in `src/app/api/payfast/itn/route.ts`. Remove the short-circuit at lines 17-19. Replace with a guard that throws or returns a 500:

```typescript
const passphrase = process.env.PAYFAST_PASSPHRASE;
if (!passphrase) {
  Sentry.captureMessage("PAYFAST_PASSPHRASE not configured — ITN endpoint is inoperative", {
    level: "fatal",
    tags: { endpoint: "payfast-itn" },
  });
  return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
}
```

If `verifyPayfastSignature` is a pure helper that returns boolean, change its signature to return `boolean | "missing-passphrase"` or throw — whichever fits the existing code style. The key is that the caller must reject the request rather than accept it.

### 2. Add rate limiting to the route

Check whether the route already uses `createRouteHandler` with `useRateLimit`. If not, wrap with `withRateLimit` or add `useRateLimit: true` to the factory config. Set a tight limit (e.g., 10 requests per minute per IP) since ITN callbacks should only arrive from PayFast's servers.

Read the route file to determine which pattern is in use.

### 3. Add Sentry logging for missing passphrase

Add `import * as Sentry from "@sentry/nextjs"` at the top (if not already present) and add the `captureMessage` call shown in Step 1. This ensures ops are immediately notified if the passphrase is missing in production.

### 4. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

## Stop conditions

- If the route does NOT use `createRouteHandler` and has a completely different handler pattern — stop and report. The rate-limiting approach must be adapted to match the existing pattern.
- If the PayFast ITN endpoint is also used for non-payment purposes — stop and report.

## Estimated time

30–45 minutes
