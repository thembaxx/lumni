# Plan 236: Move type-only packages and postcss from dependencies to devDependencies

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / dependencies
- **Generated at**: 2026-07-17

## Why this matters

`@types/katex` and `@types/simple-peer` are type-only packages that are only needed during development/type-checking. `postcss` is a build tool dependency. All three are in `dependencies` instead of `devDependencies`, meaning they're bundled into production builds unnecessarily. Moving them correctly signals the package's production vs development boundary.

## Current state

`package.json` `dependencies`:

```json
"@types/katex": "^0.16.8",
"@types/simple-peer": "^9.11.9",
"postcss": "8.5.15",
```

## Target state

All 3 moved to `devDependencies`:

```json
"devDependencies": {
    "@types/katex": "^0.16.8",
    "@types/simple-peer": "^9.11.9",
    "postcss": "8.5.15",
    ...
}
```

## Scope

- `package.json` — move 3 entries from `dependencies` to `devDependencies`
- `pnpm-workspace.yaml` — update the `postcss` override key if needed (postcss is already in `pnpm-workspace.yaml:16`)

## Steps

### 1. Edit package.json

Remove from `dependencies`:

```json
"@types/katex": "^0.16.8",
"@types/simple-peer": "^9.11.9",
"postcss": "8.5.15",
```

Add to `devDependencies` (maintain alphabetical order):

```json
"@types/katex": "^0.16.8",
"@types/simple-peer": "^9.11.9",
"postcss": "8.5.15",
```

### 2. Verify with knip

Run `pnpm run deadcode` — no warnings should appear for these packages (knip already has `devDependencies: "off"` in config).

### 3. Verify build

- `pnpm run typecheck` — 0 errors (type packages resolve correctly from devDependencies)
- `pnpm run build` — succeeds (postcss resolves correctly from devDependencies)

Verification: `pnpm install ; pnpm run typecheck ; pnpm run build`

## Stop conditions

- `pnpm run build` fails because a production build step can't resolve `postcss` — Next.js handles PostCSS config from `devDependencies` but verify with the specific version
- `pnpm run typecheck` fails because types can't be resolved

## Estimated time

10 minutes
