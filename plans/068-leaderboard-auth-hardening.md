# Plan 068: Harden leaderboard endpoint auth

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

The leaderboard endpoint at `GET /api/leaderboard` has `auth: "none"` in a codebase where every other sensitive endpoint requires authentication. This means the Appwrite user's email, display name, and cumulative XP are publicly accessible with no auth check. The endpoint returns a fixed number of top users — currently no pagination or token-based gating.

## Current state

`src/app/api/leaderboard/route.ts:17`:

```typescript
export const GET = withRateLimit(createRouteHandler(...{ auth: "none" }));
```

## Scope

**In scope**:

- `src/app/api/leaderboard/route.ts` — change auth mode

**Out of scope**:

- The leaderboard UI — the frontend already works with authenticated users
- The leaderboard-service — no changes needed
- Any other route

## Steps

### Step 1: Change `auth` to `"optional"`

In `src/app/api/leaderboard/route.ts`, change `auth: "none"` to `auth: "optional"`:

```typescript
export const GET = withRateLimit(
  createRouteHandler({
    auth: "optional",
    handler: async ({ userId }) => {
      // handler logic — userId may be undefined for unauthenticated, which is fine
      // The endpoint returns aggregate data, no per-user filtering needed
    },
  }),
);
```

**Why "optional" and not "required"**: The leaderboard may be shown on the public marketing or landing page for non-logged-in users. The data returned (top users' display names and XP) is not personally identifying beyond what a user voluntarily submitted. Requiring auth would break the landing page use-case. Optional auth allows guest view while still providing rate limiting.

### Step 2: Verify the handler doesn't assume `userId` exists

Read the handler body — if it uses `userId` for anything (e.g., to compute "You are rank N"), wrap that usage in an `if (userId)` guard.

Update the handler's response to include `"authenticated": !!userId` so the frontend can decide whether to show per-user rank.

### Step 3: Verify

**Verify**:

- `pnpm run typecheck` → exit 0
- `pnpm exec oxlint --fix` → exit 0

## Done criteria

- [ ] `auth` is `"optional"` (not `"none"`) in the leaderboard route handler
- [ ] Handler gracefully handles `userId` being `undefined`
- [ ] `pnpm run typecheck` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If the `createRouteHandler` factory does not support `"optional"` auth — stop and report. Look at `src/lib/api/create-route-handler.ts` to confirm the supported `AuthMode` values.
- If the leaderboard endpoint is only called from within the app (no external/public links) — then `auth: "required"` is actually the correct choice. Report this to the executor's reviewer.
