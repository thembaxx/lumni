# Plan 054: Sweep remaining console.warn/console.error calls to logError

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first:
> `pnpm exec grep -rn "console\.warn\|console\.error" src/lib/ --include="*.ts" | head -40`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (error reporting channel only — no logic change)
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

Session 23 created a centralized `logError()` function that wires to `Sentry.captureException()` in production. But 10+ lib files still use `console.warn()` or `console.error()` directly, and some files have both `console.warn` AND `logError` for the same error. Production errors reported via `console.warn` never reach Sentry.

## Current state

```bash
pnpm exec grep -rn "console\.warn\|console\.error" src/lib/ --include="*.ts" --include="*.tsx"
```

This will show ~20-30 calls across 10+ files. Examples from audit:

- `src/lib/question-engine/question-engine.ts:224` — `console.error(...)` with no `logError`
- `src/lib/question-engine/rag-enricher.ts:30` — both `logError` AND `console.warn` for same error
- `src/lib/flashcard-engine/engine.ts:175` — `console.warn("[FlashcardEngine] create sync:", e)`
- `src/lib/question-engine/question-engine.ts:311` — `console.error(...)`

The `logError` function is at `src/lib/shared/logger.ts`:

```typescript
export function logError(
  context: string,
  error: unknown,
  additional?: Record<string, unknown>,
): void;
```

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:
All `console.warn(` and `console.error(` calls in `src/lib/` and `src/hooks/` outside test files. The fix is to replace each with `logError(contextTag, error)`.

**Out of scope**:

- Files in `src/components/` — `console.warn` in components is user-visible and acceptable
- Test files entirely
- The `logError` implementation itself
- Files that use `console.warn` for structured log output (e.g., log formatting, not error reporting)

## Steps

### Step 1: Find all calls

```bash
pnpm exec grep -rn "console\.\(warn\|error\)(" src/lib/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v ".test."
```

This gives the full list. Also check `src/hooks/`:

```bash
pnpm exec grep -rn "console\.\(warn\|error\)(" src/hooks/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v ".test."
```

### Step 2: Replace each call

For each occurrence, determine:

1. Is the first argument a string constant? Use it (or a shortened version) as the context tag.
2. Is the second argument an error object? Pass it to `logError`.
3. Is there a nearby `logError` call? If so, this `console.warn` is likely a duplicate — remove it.

Replace pattern:

```typescript
// BEFORE:
console.warn("[FlashcardEngine] create sync:", e);

// AFTER:
logError("FlashcardEngine.create.sync", e);
```

For cases where `console.warn` is used for a structured non-error log:

```typescript
// BEFORE:
console.warn(`[AI] Provider ${name} rate-limited`);

// AFTER:
console.warn(`[AI] Provider ${name} rate-limited`);
// Keep as console.warn since it's informational logging, not an error
```

Use judgment: if a `console.warn` provides diagnostic info without an error object, keep it as `console.warn` but add a comment `// diagnostic log, not an error`.

### Step 3: Remove duplicate pairs

Where both `logError` and `console.warn` handle the same error:

```typescript
// BEFORE (rag-enricher.ts):
logError("RagEnricher.fetch", err);
console.warn("RAG fetch failed:", err);

// AFTER:
logError("RagEnricher.fetch", err);
// Remove the duplicate console.warn
```

### Step 4: Verify

```bash
pnpm run typecheck && pnpm run test
```

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] All `console.warn(` / `console.error(` calls in `src/lib/` (outside tests) that report errors are replaced with `logError()`
- [ ] No duplicate `console.warn`+`logError` pairs for the same error
- [ ] `plans/README.md` status row updated

## Maintenance notes

- The project standard is now: `logError()` for errors (wires to Sentry), `console.warn()` only for transient diagnostic info (non-error conditions).
- Remaining `console.warn` calls in components (`src/components/`) are acceptable since those are user-visible during development.
