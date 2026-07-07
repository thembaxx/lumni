# Plan 133: Gate CSP `'unsafe-eval'` behind development mode

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 649afc3b..HEAD -- next.config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The CSP `script-src` directive unconditionally includes `'unsafe-eval'`, which allows arbitrary `eval()` / `new Function()` calls in the browser. This weakens XSS defenses to near-zero — any reflected or stored XSS vulnerability becomes trivially exploitable as remote code execution. The `__impeccableLiveDev` entry shows the guard pattern is already understood; this applies the same gate to `'unsafe-eval'`.

## Current state

`next.config.ts:20-23` builds the CSP `script-src` value:

```typescript
function buildCsp(): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", __impeccableLiveDev].filter(
    Boolean,
  );
```

Line 2 shows the guard pattern:

```typescript
const __impeccableLiveDev = process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";
```

`'unsafe-eval'` is needed for Next.js's Fast Refresh in development (uses `eval` for HMR). In production, no legitimate code path requires it.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm typecheck`          | exit 0, no errors   |
| Lint      | `pnpm exec oxlint`        | exit 0              |
| Format    | `pnpm exec oxfmt --check` | exit 0              |

## Scope

**In scope**:

- `next.config.ts`

**Out of scope**:

- Any other CSP directives (style-src, connect-src, etc.) — leave them unchanged.
- The `__impeccableLiveDev` variable — already correctly gated.

## Git workflow

- Branch: `advisor/133-csp-unsafe-eval`
- Commit message: `fix: gate CSP 'unsafe-eval' behind NODE_ENV=development`

## Steps

### Step 1: Gate `'unsafe-eval'` behind `NODE_ENV`

In `next.config.ts`, add a dev-only variable alongside `__impeccableLiveDev`:

```typescript
const __unsafeEvalDev = process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "";
```

Update the `scriptSrc` array at line 21:

```typescript
const scriptSrc = ["'self'", "'unsafe-inline'", __unsafeEvalDev, __impeccableLiveDev].filter(
  Boolean,
);
```

**Verify**: `grep -n "unsafe-eval" next.config.ts` shows the variable is conditionally included. `pnpm exec oxlint` exits 0.

### Step 2: Run verification

**Verify**: `pnpm typecheck` → exit 0. `pnpm exec oxfmt --check` → exit 0. `pnpm test` → exit 0.

## Test plan

No new tests — this is a configuration change. The existing CSP enforcement via reporting remains unchanged.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm exec oxfmt --check` exits 0
- [ ] In production (`NODE_ENV=production`), the CSP header does not contain `unsafe-eval`

## STOP conditions

Stop and report back if:

- `next.config.ts` at the locations above doesn't match the excerpts.
- The `buildCsp()` function structure has changed significantly.

## Maintenance notes

- If a future Next.js version removes the dev-mode requirement for `'unsafe-eval'`, the variable and its usage can be deleted.
- If a production dependency legitimately requires `eval()`, document why with a comment and add it to the production list as an exceptional override.
