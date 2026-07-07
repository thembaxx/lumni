# Plan 135: Fix seed CSRF origin substring check

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/app/api/seed/route.ts`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`src/app/api/seed/route.ts:23` uses `origin.includes(host)` — a substring check. An attacker with `origin: "https://evil-seed-app.com"` and host `"seed-app.com"` would pass because `"evil-seed-app.com".includes("seed-app.com")` is `true`. This is a defense-in-depth bypass (the `SEED_CSRF_TOKEN` env var is the primary guard).

## Current state

`src/app/api/seed/route.ts:20-24`:

```ts
if (
    origin &&
    host &&
    !origin.includes(host) &&
    !origin.includes("localhost") &&
    !origin.includes("127.0.0.1")
) {
```

## Steps

### Step 1: Replace substring check with proper origin comparison

Replace the `includes` check with a proper URL hostname comparison:

```ts
if (
    origin &&
    host &&
    new URL(origin).hostname !== host.split(":")[0] &&
    !origin.includes("localhost") &&
    !origin.includes("127.0.0.1")
) {
```

The `host.split(":")[0]` strips the port from the host header (e.g. `localhost:3000` → `localhost`).

**Verify**: `pnpm run typecheck` → 0 errors

### Step 2: Verify the fix logic

- `origin: "https://evil-seed-app.com"`, `host: "seed-app.com"` → `new URL(origin).hostname` = `"evil-seed-app.com"` ≠ `"seed-app.com"` → blocked ✓
- `origin: "https://seed-app.com"`, `host: "seed-app.com"` → `"seed-app.com"` == `"seed-app.com"` → allowed ✓
- `origin: "http://localhost:3000"`, `host: "localhost:3000"` → `new URL(origin).hostname` = `"localhost"` == `"localhost"` → allowed ✓

**Verify**: Trace the logic manually or add a test

### Step 3: Add `.env.example` check

Verify `SEED_CSRF_TOKEN` is documented in `.env.example`. If not, add it.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] The substring `origin.includes(host)` is removed from `src/app/api/seed/route.ts`
- [ ] Hostname comparison uses `new URL()` parsing with port stripping
