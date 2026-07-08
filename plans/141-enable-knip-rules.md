# Plan 141: Enable knip dead-code detection rules

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- knip.json`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

knip has 6/8 rules set to `"off"`. Dead exports, unused types, duplicate exports, unused enum members all silently accumulate. Session 35 removed ~250 lines of dead code, but without enforcement it will creep back.

## Steps

### Step 1: Enable exports and types rules

In `knip.json`, change:

```json
"rules": {
    "exports": "warn",
    "types": "warn",
    "nsExports": "warn",
    "nsTypes": "warn",
    "duplicates": "warn",
    "enumMembers": "warn"
}
```

Start with `warn` (not `error`) to avoid breaking CI.

### Step 2: Run knip and triage warnings

```bash
pnpm run deadcode
```

Add `@public` JSDoc annotations or `ignore` entries for legitimate false positives (re-exported barrel types, intentionally public API).

**Verify**: Warnings are either fixed or documented in `knip.json` `"ignore"` list.

### Step 3: Add knip to pre-commit or pre-push

Add `pnpm run deadcode` to `.husky/pre-push` — warn only, don't block push.

**Verify**: `.husky/pre-push` includes the deadcode check.

## Done criteria

- [ ] `knip.json` has at least `exports`, `types`, `nsExports`, `nsTypes` set to `"warn"`
- [ ] `pnpm run deadcode` runs without errors (warnings OK)
- [ ] False positives are documented in `knip.json` `"ignore"` or via `@public`
