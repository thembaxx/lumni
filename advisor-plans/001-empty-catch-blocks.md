# Advisor Plan 001: Fix 7 empty catch blocks still swallowing errors

> **Source**: Audit finding CORR-01
> **Priority**: P2
> **Effort**: S (hours)
> **Risk**: LOW
> **Confidence**: HIGH

## Why this matters

Session 23 (June 2026) swept the codebase and wired 148 catch blocks to `logError()`. However, 7 empty `.catch(() => {})` / `.catch(() => ({}))` blocks remain across 5 files. These silently discard errors — no logging, no user feedback, no recovery. The centralized `logError()` from `src/lib/shared/logger.ts` is available but not used here.

## Locations

### 1. `src/hooks/use-curated-problems.ts` — Line ~33

```typescript
const err = await res.json().catch(() => ({}));
```

Fix: Replace with `.catch((e) => { logError("useCuratedProblems.json", e); return {}; })`

### 2. `src/hooks/use-solver.ts` — Line ~45

```typescript
const error = await response.json().catch(() => ({}));
```

Fix: Replace with `.catch((e) => { logError("useSolver.json", e); return {}; })`

### 3. `src/hooks/use-solver.ts` — Line ~70

```typescript
const error = await response.json().catch(() => ({}));
```

Fix: Same pattern, different context tag: `"useSolver.followUp.json"`

### 4. `src/lib/vocabulary/service.ts` — Line ~49

```typescript
await createVocabularyCard(savedEntry).catch(() => {});
```

Fix: Replace with `.catch((e) => logError("vocab.createCard", e))`

### 5. `src/lib/shared/api-fetch.ts` — Line ~46

```typescript
const body = await response.json().catch(() => ({}));
```

Fix: Replace with `.catch((e) => { logError("apiFetch.json", e); return {}; })`

### 6. `src/components/quiz/hooks/use-quiz-view.ts` — Line ~171

```typescript
.catch(() => {});
```

Fix: Replace with `.catch((e) => logError("useQuizView", e))`

### 7. `src/app/api/exam-dates/route.ts` — Line ~35

```typescript
const body = (await req.json().catch(() => ({}))) as { slots?: ExamSlot[] };
```

Fix: Remove the `.catch()` and let the Zod validation in `createRouteHandler` handle it, or explicitly check `Content-Type` first. If the catch is needed for non-JSON bodies, log the error: `.catch((e) => { logError("examDates.json", e); return {}; })`

## Steps

1. Open each file, replace the empty catch with `logError` call
2. Import `logError` from `@/lib/shared/logger` where not already imported
3. `pnpm run typecheck` → exit 0
4. `pnpm run test` → all pass

## Done criteria

- [ ] All 7 empty catch blocks replaced with `logError()` calls
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No regression in any of the 5 files
