# Plan 122: Fix RAG timeout timer leak in fetchRagContext

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/question-engine/rag-enricher.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

When `fetchRagContext` races a `setTimeout` against `searchWithRAG`, the timer handle is never cleared if the fetch wins. The timer fires 3 seconds later, calling `reject` on an already-settled promise. Individually trivial, but it accumulates under heavy usage.

## Current state

`src/lib/question-engine/rag-enricher.ts:20-26`:

```ts
try {
  const result = await Promise.race([
    fetch({ subject, topic, userId: userId ?? undefined }),
    new Promise<ReturnType<typeof emptyRagContext>>((_, reject) =>
      setTimeout(() => reject(new Error("RAG fetch timeout")), RAG_TIMEOUT_MS),
    ),
  ]);
  return result;
}
```

No `clearTimeout` on the success path.

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test -- rag-enricher` | all pass            |

## Steps

### Step 1: Fix the timer leak

```ts
try {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("RAG fetch timeout")), RAG_TIMEOUT_MS);
  });
  const result = await Promise.race([
    fetch({ subject, topic, userId: userId ?? undefined }),
    timeout,
  ]);
  clearTimeout(timer!);
  return result;
} catch (err) {
  logError("FetchRagContext", err);
  return emptyRagContext();
}
```

**Verify**: `pnpm exec oxlint src/lib/question-engine/rag-enricher.ts` → 0 errors

### Step 2: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test -- rag-enricher` → all pass (8 existing tests)

## Done criteria

- [ ] Timer is cleared on the success path via `clearTimeout`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `Promise<never>` type annotation causes a type error with the `ReturnType` usage
