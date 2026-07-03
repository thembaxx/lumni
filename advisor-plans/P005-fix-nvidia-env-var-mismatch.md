# Plan P005: Fix NVIDIA API Key Environment Variable Name Mismatch

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/app/api/chat/route.ts src/app/api/engine/study-guide/route.ts src/app/api/engine/knowledge-graph/route.ts src/app/api/stories/generate/route.ts .env.example`
> If any file changed, compare excerpts against live code.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

`.env.example` documents `NVIDIA_NIM_API_KEY` as the environment variable for Nvidia NIM, but all 4 consumers read `NVIDIA_API_KEY`. The provider silently never initializes in production because the code reads a key that doesn't exist (if the operator followed `.env.example`), or the operator sets the wrong key (if they read the code directly). This means the Nvidia NIM fallback in the AI provider chain is always a no-op, reducing resilience from 3 providers to 2.

## Current state

**`.env.example`** documents `NVIDIA_NIM_API_KEY=` (line 27).

**4 consumer files** all read `process.env.NVIDIA_API_KEY`:

- `src/app/api/chat/route.ts:12` — `const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;`
- `src/app/api/engine/study-guide/route.ts:23` — reads `NVIDIA_API_KEY`
- `src/app/api/engine/knowledge-graph/route.ts:16` — reads `NVIDIA_API_KEY`
- `src/app/api/stories/generate/route.ts:37` — reads `NVIDIA_API_KEY`

Additionally, `src/lib/ai/client.ts:28` reads `process.env.NVIDIA_API_KEY` for the main AI provider chain.

**The fix**: Either rename the `.env.example` key to match the code, or rename the code to match `.env.example`. This plan renames all code references to `NVIDIA_NIM_API_KEY` (matching the documented name, which is more descriptive).

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `.env.example` — already has the correct name, no changes needed
- All files reading `process.env.NVIDIA_API_KEY`:
  - `src/app/api/chat/route.ts`
  - `src/app/api/engine/study-guide/route.ts`
  - `src/app/api/engine/knowledge-graph/route.ts`
  - `src/app/api/stories/generate/route.ts`
  - `src/lib/ai/client.ts`

**Out of scope**:

- Any other API keys or env vars
- The `GEMINI_API_KEY` or `GROQ_API_KEY` variables

## Git workflow

- Branch: `advisor/P005-nvidia-env`
- Commit message: `fix: rename NVIDIA_API_KEY to NVIDIA_NIM_API_KEY to match .env.example`
- Do NOT push or open a PR

## Steps

### Step 1: Find and replace all `NVIDIA_API_KEY` code references

Use global find-and-replace to change all `process.env.NVIDIA_API_KEY` → `process.env.NVIDIA_NIM_API_KEY` in all non-test source files.

The specific occurrences to change:

- `src/app/api/chat/route.ts:12` — `const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY` → `const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY`
- `src/app/api/engine/study-guide/route.ts` — find and replace
- `src/app/api/engine/knowledge-graph/route.ts` — find and replace
- `src/app/api/stories/generate/route.ts` — find and replace
- `src/lib/ai/client.ts` — find and replace (this is the main provider chain used by question engine)

Use `grep -rn "NVIDIA_API_KEY" --include="*.ts" --include="*.tsx" src/` to confirm you've caught all occurrences.

**Verify**: `grep -rn "process.env.NVIDIA_API_KEY" --include="*.ts" src/` returns no matches (only `NVIDIA_NIM_API_KEY` should remain).

### Step 2: Typecheck and test

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

No new tests. The change is a mechanical rename — if the old key still works (operator has it set), builds pass; if not, the rename is what makes it work.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -rn "NVIDIA_API_KEY" --include="*.ts" src/` returns exactly 0 occurrences of `process.env.NVIDIA_API_KEY` (all renamed to `NVIDIA_NIM_API_KEY`)
- [ ] `.env.example` unchanged (already has the correct name)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any file uses `NVIDIA_API_KEY` in a non-env-var context (e.g., a type name or function param) — that should NOT be renamed
- The tests reference a mock or fixture that sets `NVIDIA_API_KEY` — update those too

## Maintenance notes

- If new AI provider code is added, always check `.env.example` for the canonical env var name before hardcoding a new variable name
- The pattern of environment variable name mismatches suggests a systematic issue — consider adding a CI step that validates env var names match between `.env.example` and `process.env.*` references
