# Plan 235: Remove 5 unused production dependencies (three, lucide-react, react-day-picker, canvas, sharp)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / dependencies
- **Generated at**: 2026-07-17

## Why this matters

Five production dependencies (`three`, `lucide-react`, `react-day-picker`, `canvas`, `sharp`) are confirmed unused via triple-grep across all 1260+ source files. `react-day-picker`, `canvas`, and `sharp` are currently in knip's `ignoreDependencies` list (explicitly flagged as suspicious). Removing them shrinks `node_modules`, reduces install time, and eliminates the maintenance burden of updating unused packages.

## Current state

| Package            | package.json     | knip ignoreDependencies | Import evidence |
| ------------------ | ---------------- | ----------------------- | --------------- |
| `three`            | dependencies:82  | not listed              | Zero imports    |
| `lucide-react`     | dependencies:82  | not listed              | Zero imports    |
| `react-day-picker` | dependencies:94  | listed                  | Zero imports    |
| `canvas`           | dependencies:70  | not listed              | Zero imports    |
| `sharp`            | dependencies:103 | listed                  | Zero imports    |

Additionally, `sharp` and `canvas` are in `trustedDependencies` (package.json:164-170).

## Target state

- 5 packages removed from `dependencies` in `package.json`
- 3 packages removed from `ignoreDependencies` in `knip.json`
- `canvas` and `sharp` removed from `trustedDependencies` in `package.json`
- `pnpm run deadcode` shows no warnings for these packages
- `pnpm install` succeeds

## Scope

- `package.json` — remove 5 deps from `dependencies`, remove 2 from `trustedDependencies`
- `knip.json` — remove 3 from `ignoreDependencies`
- Do NOT run `pnpm install` with `--force` or change lockfile manually — let `pnpm install` handle it

## Steps

### 1. Edit package.json

Remove from `dependencies`:

```json
"three": "^...",
"lucide-react": "^1.24.0",
"react-day-picker": "^10.0.1",
"canvas": "^3.2.3",
"sharp": "^0.35.3",
```

Remove from `trustedDependencies`:

```json
"canvas",
"sharp",
```

### 2. Edit knip.json

Remove from `ignoreDependencies`:

```json
"react-day-picker",
"sharp",
```

### 3. Reinstall

```bash
pnpm install
```

### 4. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm run deadcode` — no unexpected warnings
- `pnpm run test` — no regressions

Verification: `pnpm install ; pnpm run typecheck ; pnpm run deadcode ; pnpm run test`

## Stop conditions

- `pnpm install` fails due to a transitive dependency referencing one of these packages — re-add them as transitive hoisting might be needed
- A test or build fails because it implicitly depends on one of these packages being installed — re-add the specific one that broke

## Estimated time

15 minutes
