# Plan 147: Configure vitest coverage thresholds and add coverage CI step

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- vitest.config.ts package.json`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: test
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The project has no coverage thresholds configured. Coverage can silently regress with no guard. Adding thresholds and related tooling makes coverage decreases visible in CI and provides a CLI target for measuring progress.

## Current state

- `vitest.config.ts` exists with basic configuration
- No `coverage` section in `vitest.config.ts`
- CI workflow (`ci.yml`) has test step but no coverage step
- No `pnpm run coverage` script

## Steps

### Step 1: Enable coverage in vitest.config.ts

Add to `vitest.config.ts`:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json-summary", "html"],
  include: ["src/**/*.{ts,tsx}"],
  exclude: [
    "src/**/*.test.{ts,tsx}",
    "src/**/*.spec.{ts,tsx}",
    "src/**/__tests__/**",
    "src/**/__mocks__/**",
    "src/app/**/layout.tsx",
    "src/app/**/page.tsx",
    "src/app/**/loading.tsx",
    "src/app/**/error.tsx",
    "src/types/**",
    "src/instrumentation.ts",
    "next.config.ts",
  ],
  thresholds: {
    statements: 10,
    branches: 5,
    functions: 8,
    lines: 10,
  },
}
```

These thresholds are deliberately low to pass on the current baseline (empirically ~10% coverage). They prevent negative coverage. Raise thresholds as coverage improves.

### Step 2: Add coverage script

```json
// package.json scripts
"coverage": "vitest run --coverage"
```

### Step 3: Add coverage CI step in ci.yml

After the test step, add:

```yaml
- name: Coverage
  run: pnpm coverage
```

### Step 4: Verify

Run `pnpm coverage` → exits 0 with coverage report (thresholds pass). Typecheck should not be affected.

## Done criteria

- [ ] `pnpm coverage` runs and exits 0
- [ ] Coverage thresholds configured in vitest.config.ts
- [ ] `coverage` script in package.json
- [ ] Coverage step in CI workflow

## STOP conditions

Stop and report if vitest coverage provider `v8` requires additional dependencies (e.g., `@vitest/coverage-v8`). Install them as needed.
