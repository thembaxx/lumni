# Plan P004: Fix Stale next.config.ts Flags

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- next.config.ts CONTEXT.md`
> If either file changed, compare the "Current state" excerpts against the live code.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / dx
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

Two config issues in `next.config.ts`:

1. `experimental.viewTransition: true` — CONTEXT.md (Session 36) says this was removed "to eliminate double-wrap conflict," but it's still in the config. This causes a double `startViewTransition()` wrapper conflict in production.
2. `cacheComponents: true` — This configuration key does NOT exist in Next.js 16. It is silently ignored, producing no error but also no effect. It wastes developer attention and signals stale migration state.

Both produce zero errors during build, making them invisible to CI.

## Current state

**`next.config.ts:56-67`**:

```typescript
const nextConfig: NextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  cacheComponents: true,            // ← NOT a valid Next.js 16 config key
  partialPrefetching: true,
  experimental: {
    viewTransition: true,           // ← Should have been removed per Session 36
    turbopackFileSystemCacheForBuild: true,
    turbopackRustReactCompiler: true,
    turbopackLocalPostcssConfig: true,
    optimizePackageImports: [...],
  },
  // ...
};
```

**`CONTEXT.md:11`** (Session 36 note):

```
View transitions consolidated in `useNavigationDirection` — removed `experimental.viewTransition: true` from next.config to eliminate double-wrap conflict.
```

The CONTEXT.md says it was removed, but the file still has it. Either CONTEXT.md is wrong (and the code is correct), or the removal was planned but never executed. Either way, there's a contradiction that needs resolution.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Build     | `pnpm run build`     | exit 0              |

## Scope

**In scope**:

- `next.config.ts` — remove invalid/conflicting keys
- `CONTEXT.md` — update the stale claim if viewTransition is intentionally kept

**Out of scope**:

- Any other next.config fields
- The `useNavigationDirection` hook or view transition implementation
- Any other CONTEXT.md edits

## Git workflow

- Branch: `advisor/P004-next-config`
- Commit message: `fix: remove invalid next.config keys (cacheComponents, viewTransition)`
- Do NOT push or open a PR

## Steps

### Step 1: Remove `cacheComponents: true`

Delete the line `cacheComponents: true,` from `next.config.ts`. This key is not a valid Next.js 16 configuration option. It was from an earlier version and has been silently ignored.

### Step 2: Remove `viewTransition: true` from `experimental`

Delete the line `viewTransition: true,` from the `experimental` block. Per Session 36, this was supposed to be removed. The `useNavigationDirection` hook in `src/hooks/use-navigation-direction.ts` already handles view transitions via `startViewTransition()`. Having both the Next.js experimental flag and the manual wrapper creates a double-wrap conflict.

### Step 3: Update CONTEXT.md if needed

If `viewTransition` was intentionally kept (e.g., re-added after Session 36), update CONTEXT.md to reflect the current state. If it was simply never removed, the removal is correct and CONTEXT.md was already accurate in intent — no CONTEXT.md changes needed.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm run build` → exit 0.

## Test plan

No new tests. Verify the build succeeds with the removed keys.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run build` exits 0
- [ ] `grep -n "cacheComponents" next.config.ts` returns no matches
- [ ] `grep -n "viewTransition" next.config.ts` returns no matches
- [ ] No files outside `next.config.ts` and optionally `CONTEXT.md` are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The build fails after removing `viewTransition: true` — this would indicate that the view transition API path depends on this flag
- Removing `cacheComponents` causes a build warning about unknown config key (it should be silently ignored, same as before)

## Maintenance notes

- If Next.js 16 stable adds `cacheComponents` as a legitimate config option in a later release, the team can re-add it with intention. Until then, it's dead code.
- The `partialPrefetching: true` key — verify it IS a valid Next.js 16 key. If not confirmed, flag it but do NOT remove it in this plan (out of scope).
