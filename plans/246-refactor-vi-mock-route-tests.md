# Plan 246: Refactor 7 API route test files to remove vi.mock pollution

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

Module-scope `vi.mock()` calls remain in the import-time module graph after the test file finishes. When Vitest `pool: 'forks'` reuses workers (the default), a `vi.mock` from one file can leak into the next file's module resolution, causing "unexpected mock" failures in unrelated tests. Session 19 documents this exact pattern as a known pollution source — the `mock.module` lesson applies equally to `vi.mock`.

Seven API route test files use `vi.mock()` at module scope. Refactoring them to either DI-based injection (where the route uses `createRouteHandler` factory) or `vi.hoisted` factory patterns eliminates this class of pollution entirely.

## Current state

7 route test files use module-scope `vi.mock`:

- `src/app/api/engine/__tests__/grade.test.ts`
- `src/app/api/engine/__tests__/generate.test.ts`
- `src/app/api/engine/__tests__/hint.test.ts`
- `src/app/api/engine/__tests__/visual.test.ts`
- `src/app/api/engine/__tests__/next-topics.test.ts`
- `src/app/api/engine/__tests__/test.test.ts`
- `src/app/api/engine/__tests__/engine-handler.test.ts`

Each typically has 1-4 `vi.mock()` calls at the top of the file:

```ts
vi.mock("@/lib/question-engine", () => ({ ... }));
vi.mock("@/lib/shared/api-fetch", () => ({ ... }));
```

## Target state

Each test file uses one of these patterns instead:

1. **`vi.hoisted()` factory** (for module mocks that must be at the import level):

```ts
const { mockGenerate } = vi.hoisted(() => ({
  mockGenerate: vi.fn(),
}));

vi.mock("@/lib/question-engine", () => ({
  QuestionEngine: { generate: mockGenerate },
}));
```

2. **DI-based injection** (for routes using `createRouteHandler`, mock deps through the handler's `deps` parameter):

```ts
const handler = createGradeHandler({
  engine: { grade: vi.fn().mockResolvedValue({ ... }) },
});
```

3. **No module-level mocks** (for pure logic testing where deps are passed directly)

Run `pnpm test -- --reorder` to detect hidden pollution between files.

## Scope

- The 7 route test files listed above
- Do NOT change the production route implementations — this is purely a test refactoring

## Steps

### 1. Audit all 7 files

Read each file to understand its mock structure:

```bash
for f in \
  src/app/api/engine/__tests__/grade.test.ts \
  src/app/api/engine/__tests__/generate.test.ts \
  src/app/api/engine/__tests__/hint.test.ts \
  src/app/api/engine/__tests__/visual.test.ts \
  src/app/api/engine/__tests__/next-topics.test.ts \
  src/app/api/engine/__tests__/test.test.ts \
  src/app/api/engine/__tests__/engine-handler.test.ts; do
  echo "=== $f ==="
  head -30 "$f"
done
```

### 2. Categorize each mock

For each `vi.mock()` in each file, determine:

- `vi.hoisted` candidate: mock is needed at module level but doesn't depend on dynamic test state
- DI candidate: the route handler accepts deps that can be injected per-test
- Unused: mock no longer needed (dead code)

### 3. Refactor each file

Work through files one at a time. For each:

1. Move `vi.mock` factory functions into `vi.hoisted()` blocks
2. Or, if the route uses `createRouteHandler`, instantiate the handler with mock deps inside each `it()` block
3. Remove any unused mocks

### 4. Run test in isolation

After each file refactor, run the file in isolation to confirm it passes:

```bash
pnpm test -- src/app/api/engine/__tests__/grade.test.ts
```

### 5. Run with --reorder to detect pollution

```bash
pnpm test -- --reorder src/app/api/engine/__tests__/
```

This runs tests in random order — any remaining `vi.mock` pollution will surface as a non-deterministic failure.

### 6. Verify full test suite

```bash
pnpm test
pnpm run typecheck
pnpm exec biome check
```

## Test plan

| File                     | Mocks to refactor                       | Approach                    |
| ------------------------ | --------------------------------------- | --------------------------- |
| `grade.test.ts`          | `@/lib/question-engine`, `@/lib/grader` | `vi.hoisted`                |
| `generate.test.ts`       | `@/lib/question-engine`                 | `vi.hoisted`                |
| `hint.test.ts`           | `@/lib/question-engine`                 | `vi.hoisted`                |
| `visual.test.ts`         | `@/lib/visual-engine`                   | `vi.hoisted`                |
| `next-topics.test.ts`    | `@/lib/question-engine`                 | `vi.hoisted`                |
| `test.test.ts`           | Health check deps                       | DI pattern if using factory |
| `engine-handler.test.ts` | Engine modules                          | `vi.hoisted`                |

## Done criteria

- [ ] All 7 files refactored to `vi.hoisted` or DI patterns
- [ ] Each file passes in isolation
- [ ] `pnpm test -- --reorder` passes (no pollution)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on changed files
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `vi.hoisted()` is not available in the project's Vitest version (`vi.hoisted` was added in Vitest 0.34.x), check `pnpm vitest --version` first — if too old, use a different approach (e.g., `vi.mock` with inline `vi.fn()` that is reassigned in `beforeEach`)
- If any file is >300 lines with deeply nested mock setup, consider splitting test setup into `describe`-scoped helpers rather than a monolithic refactor
- If `--reorder` flag is not supported (added in Vitest 1.3+), run tests sequentially with `--pool forks --repeats 3` to stress-test isolation

## Estimated time

3-4 hours
