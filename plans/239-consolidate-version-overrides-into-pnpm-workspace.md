# Plan 239: Consolidate version overrides into pnpm-workspace.yaml

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / config
- **Generated at**: 2026-07-17

## Why this matters

Version overrides are split across two files: `package.json` has 5 overrides and `pnpm-workspace.yaml` has 4 overrides. `protobufjs: 7.6.3` is duplicated in both. This split creates confusion about where canonical overrides live and risks drift when one file is updated but the other is not. The pnpm docs recommend putting overrides in `pnpm-workspace.yaml` when using pnpm — `package.json` overrides are a npm/pnpm compat feature.

## Current state

`package.json:151-156`:

```json
"overrides": {
  "@opentelemetry/core": "2.8.0",
  "dompurify": "3.4.11",
  "esbuild": "0.28.1",
  "protobufjs": "7.6.3",
  "undici": "6.27.0"
}
```

`pnpm-workspace.yaml:13-17`:

```yaml
overrides:
  protobufjs: 7.6.3
  effect: ">=3.20.0"
  postcss: 8.5.15
  tmp: ^0.2.6
```

## Target state

All overrides consolidated in `pnpm-workspace.yaml`:

```yaml
overrides:
  @opentelemetry/core: 2.8.0
  dompurify: 3.4.11
  effect: ">=3.20.0"
  esbuild: 0.28.1
  postcss: 8.5.15
  protobufjs: 7.6.3
  tmp: ^0.2.6
  undici: 6.27.0
```

`package.json` overrides removed entirely.

## Scope

- `package.json` — remove `overrides` section
- `pnpm-workspace.yaml` — add the 4 missing overrides to existing block

## Steps

### 1. Read both override sections

Verify they are exactly as documented above. Note that Plan 236 moves `postcss` to `devDependencies` — confirm the override still applies correctly.

### 2. Update pnpm-workspace.yaml

Add to the `overrides` block:

```yaml
  @opentelemetry/core: 2.8.0
  dompurify: 3.4.11
  esbuild: 0.28.1
  undici: 6.27.0
```

Remove the duplicate `protobufjs` entry (keep one).

### 3. Remove package.json overrides

Delete lines 151-157 (the entire `"overrides": { ... }` block).

### 4. Reinstall and verify

```bash
pnpm install
```

### 5. Check that overrides applied

```bash
pnpm ls @opentelemetry/core dompurify protobufjs undici --depth 0
```

Each should show the overridden version.

Verification: `pnpm install ; pnpm ls @opentelemetry/core dompurify protobufjs undici --depth 0 ; pnpm run typecheck`

## Stop conditions

- `pnpm install` fails because `package.json` overrides are required for npm compatibility (e.g., for `patch-package`) — keep the override there but verify pnpm reads from workspace only
- A transitive dependency resolves to a different version without the `package.json` override — re-add only the problematic one to `package.json`

## Estimated time

15 minutes
