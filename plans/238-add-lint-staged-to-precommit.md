# Plan 238: Add lint-staged to speed up pre-commit hook

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Generated at**: 2026-07-17

## Why this matters

The current `.husky/pre-commit` hook runs `pnpm run lint && pnpm run format && pnpm run typecheck` on the **entire project**. This takes 30-60 seconds for every commit, incentivising developers to use `git commit --no-verify`. Running full-project `tsc` on every commit is wasteful — type checking the whole project is a pre-push or CI concern, not a pre-commit concern. Pre-commit should only check staged files.

## Current state

`.husky/pre-commit`:

```bash
pnpm run lint && pnpm run format && pnpm run typecheck
```

This runs oxlint + oxfmt + tsc on all 1260+ source files.

## Target state

- `lint-staged` installed and configured
- Pre-commit hook runs `oxlint --fix` and `oxfmt --check` only on staged files (~1-5s vs 30-60s)
- `tsc` moved to `.husky/pre-push` (runs only on `git push`)
- `oxfmt` runs in `--check` mode (no write) since staged files should already be formatted

## Scope

- `package.json` — add `lint-staged` config, add `lint-staged` to devDependencies
- `.husky/pre-commit` — replace with `npx lint-staged`
- `.husky/pre-push` — create with full `typecheck` command
- `pnpm-lock.yaml` — updated via `pnpm install`

## Steps

### 1. Install lint-staged

```bash
pnpm add -D lint-staged
```

### 2. Add lint-staged config to package.json

```json
"lint-staged": {
  "*.{ts,tsx}": ["oxlint --fix", "oxfmt --check"],
  "*.{js,mjs}": ["oxfmt --check"],
  "*.{css,json,md,yaml,yml}": ["oxfmt --check"]
}
```

### 3. Update pre-commit hook

Replace `.husky/pre-commit` content with:

```bash
npx lint-staged
```

### 4. Create pre-push hook

Create `.husky/pre-push`:

```bash
pnpm run typecheck
```

### 5. Make pre-push executable

```bash
git add .husky/pre-push && chmod +x .husky/pre-push
```

### 6. Verify

- Staging a single changed file and running `git commit` should only lint/format that file
- Running `git push` should run full typecheck
- `pnpm run typecheck` still passes from CI

Verification: `pnpm install ; npx lint-staged --dry-run ; git commit --allow-empty -m "test lint-staged"`

## Stop conditions

- `npx lint-staged` fails with a config parsing error — verify the config format against lint-staged v15 docs
- The pre-push hook blocks pushes during normal development — keep it to typecheck-only (fast) and avoid adding test/lint there

## Estimated time

30 minutes
