# Plan 053: DX sweep — tsc for test files, .env.example vars, README fix, knip CI

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- tsconfig.json tsconfig.test.json .env.example README.md package.json`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (config/docs changes only)
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

Four small DX issues compound to create onboarding friction and blind spots:

1. Test files excluded from `tsc --noEmit` — type errors in tests go undetected in CI
2. `DEEPGRAM_API_KEY` and `TINYFISH_API_KEY` missing from `.env.example` — silent runtime failures for new devs
3. README stale (references framer-motion, Lucide, 23 tables, v18 — all wrong)
4. `knip --no-exit-code` runs in CI but never fails the build

## Current state

**tsconfig.json** lines 51-54:

```json
"exclude": ["node_modules", ".next/**", "**/*.test.ts", "**/*.test.tsx", "**/*.int-test.ts", "**/__tests__"]
```

**package.json** line 26-27:

```json
"typecheck": "tsc --noEmit",
"deadcode": "knip --no-exit-code",
```

**.env.example** — has 19 vars but not `DEEPGRAM_API_KEY` or `TINYFISH_API_KEY`.

**README.md** — says "framer-motion 12" (package is `motion`), "Lucide" (icons are `@hugeicons/react`), "23 tables, v18 schema" (schema is now 36+).

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `tsconfig.json` — remove test file exclusions
- `package.json` — change knip script to remove `--no-exit-code`
- `.env.example` — add 2 missing vars
- `README.md` — fix stale claims

**Out of scope**:

- Creating a `tsconfig.test.json` (already exists)
- Adding Playwright or Storybook CI jobs
- Changes to vitest config
- Real test coverage improvements

## Steps

### Step 1: Remove test file exclusions from tsconfig.json

Remove these lines from `tsconfig.json`'s `exclude` array:

```json
"**/*.test.ts",
"**/*.test.tsx",
"**/*.int-test.ts",
"**/__tests__"
```

**Verify**: `pnpm run typecheck` → exit 0 (if new type errors surface in test files, fix them).

If new type errors appear in test files, they were previously hidden — fix them by adding proper type annotations. Common fixes:

- Missing `@testing-library/react` type extensions
- Mock functions without proper return types
- Import assertions for mock modules

### Step 2: Add missing env vars to .env.example

Add to `.env.example`:

```
# Deepgram API key for speech-to-text (transcription and pronunciation)
DEEPGRAM_API_KEY=

# TinyFish web search API key for RAG-grounded AI content
TINYFISH_API_KEY=
```

**Verify**: No command needed — config file change only.

### Step 3: Fix README.md stale claims

Replace the inaccurate lines in `README.md`:

| Current (wrong)       | Correct                        |
| --------------------- | ------------------------------ |
| framer-motion 12      | motion 12                      |
| Lucide                | (remove — icons are HugeIcons) |
| 23 tables, v18 schema | 36+ tables, latest schema      |
| sql.js (SQLite WASM)  | (remove — not in deps)         |

Update the tech stack table AND the project map section (line 98 "23 tables, v18 schema").

**Verify**: `pnpm run build` still works (README doesn't affect build).

### Step 4: Remove --no-exit-code from knip

In `package.json` line 27, change:

```json
"deadcode": "knip --no-exit-code",
```

to:

```json
"deadcode": "knip",
```

**Verify**: `pnpm run deadcode` → exits 0 (no current dead code warnings). If there are warnings, either fix them or temporarily re-add `--no-exit-code` and file a separate issue.

### Step 5: Run full verification

```bash
pnpm run typecheck && pnpm run lint && pnpm run test
```

All should pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run lint` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `pnpm run deadcode` exits 0 (no `--no-exit-code`)
- [ ] `tsconfig.json` no longer excludes test files
- [ ] `.env.example` has `DEEPGRAM_API_KEY` and `TINYFISH_API_KEY`
- [ ] `README.md` has accurate dependency names and schema version
- [ ] `plans/README.md` status row updated

## STOP conditions

- `pnpm run typecheck` shows >10 new errors in test files after removing exclusions — STOP and report the total count; fix only the most impactful ones, defer the rest
- `pnpm run deadcode` shows dead exports after removing `--no-exit-code` — STOP and report the findings
