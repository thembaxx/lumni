# Plan 243: Add tests for shared quality check functions

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

The shared quality check functions (`checkGibberish`, `checkPlaceholders`, `checkPoints`, etc.) are used by every per-type question validator. If a gibberish check false-positives on a valid mathematical expression like `x = (-b ± √(b² - 4ac)) / 2a`, every algebra question gets rejected as "gibberish". Conversely, a weak check lets through real gibberish that wastes AI generation budget. These functions are called hundreds of times per quiz generation batch, yet have zero test coverage.

The gibberish check uses `(.)\1{5,}` which matches any character repeated 6+ times — this should catch `aaaaaa` but must not match `aaaaaaab` (7 chars with a different one at the end). The placeholder check has a complex pattern for `[填空]`, `[blank]`, `lorem ipsum`. Testing these boundary cases prevents both false positives and false negatives.

## Current state

- `src/lib/question-engine/validators/shared-quality-checks.ts` — exports 5 functions: `checkGibberish`, `checkPlaceholders`, `checkPoints`, `checkHasEnoughContent`, `checkMinOptions`
- No `__tests__/` directory in `src/lib/question-engine/validators/`
- All 5 functions are pure (no side effects, no external deps) — ideal for unit testing

## Target state

`src/lib/question-engine/validators/__tests__/shared-quality-checks.test.ts` with 10-12 test cases covering:

- `checkGibberish`: repeated chars (aaa), alternating chars (ababab), unique patterns, valid math expressions, empty string
- `checkPlaceholders`: detected patterns (lorem ipsum, [填空], TODO), clean content, mixed content with placeholders
- `checkPoints`: NaN, -1, 0, Infinity, valid positive numbers, missing field
- `checkHasEnoughContent`: empty, whitespace-only, minimum length, valid content
- `checkMinOptions`: 0 options, 1 option, sufficient options

## Scope

- `src/lib/question-engine/validators/__tests__/shared-quality-checks.test.ts` (new, ~80-100 lines)
- No changes to production code

## Steps

### 1. Read shared-quality-checks.ts

First read the file to confirm the 5 exported function signatures.

```bash
cat src/lib/question-engine/validators/shared-quality-checks.ts
```

### 2. Create test file

Create `src/lib/question-engine/validators/__tests__/shared-quality-checks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  checkGibberish,
  checkPlaceholders,
  checkPoints,
  checkHasEnoughContent,
  checkMinOptions,
} from "../shared-quality-checks";

describe("checkGibberish", () => {
  it("detects repeated single characters (aaaaaa)", () => {
    const result = checkGibberish("aaaaaa");
    expect(result.flagged).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("does not flag short repeated sequences (aa)", () => {
    const result = checkGibberish("aa");
    expect(result.flagged).toBe(false);
  });

  it("does not flag valid math expressions", () => {
    const result = checkGibberish("x = (-b ± √(b² - 4ac)) / 2a");
    expect(result.flagged).toBe(false);
  });

  it("detects long repeated character patterns", () => {
    const result = checkGibberish("xxxxxxxxxxxxxxxxxxxx");
    expect(result.flagged).toBe(true);
  });

  it("does not flag empty string", () => {
    const result = checkGibberish("");
    expect(result.flagged).toBe(false);
  });
});

describe("checkPlaceholders", () => {
  it("detects lorem ipsum", () => {
    const result = checkPlaceholders("Lorem ipsum dolor sit amet");
    expect(result.flagged).toBe(true);
  });

  it("detects [填空] style placeholders", () => {
    const result = checkPlaceholders("This is a [填空] question");
    expect(result.flagged).toBe(true);
  });

  it("does not flag clean content", () => {
    const result = checkPlaceholders("What is the capital of France?");
    expect(result.flagged).toBe(false);
  });

  it("flags mixed content with placeholder patterns", () => {
    const result = checkPlaceholders("Explain the [TODO] concept in physics");
    expect(result.flagged).toBe(true);
  });
});

describe("checkPoints", () => {
  it("flags NaN points", () => {
    expect(checkPoints({ points: NaN }).flagged).toBe(true);
  });

  it("flags negative points", () => {
    expect(checkPoints({ points: -1 }).flagged).toBe(true);
  });

  it("flags zero points", () => {
    expect(checkPoints({ points: 0 }).flagged).toBe(true);
  });

  it("flags infinite points", () => {
    expect(checkPoints({ points: Infinity }).flagged).toBe(true);
  });

  it("passes valid positive points", () => {
    expect(checkPoints({ points: 5 }).flagged).toBe(false);
  });
});

describe("checkHasEnoughContent", () => {
  it("flags empty content", () => {
    expect(checkHasEnoughContent("").flagged).toBe(true);
  });

  it("flags whitespace-only content", () => {
    expect(checkHasEnoughContent("   ").flagged).toBe(true);
  });

  it("passes content at minimum length", () => {
    // Use the actual minimum threshold from the implementation
    expect(checkHasEnoughContent("Hello world").flagged).toBe(false);
  });
});

describe("checkMinOptions", () => {
  it("flags 0 options", () => {
    expect(checkMinOptions([]).flagged).toBe(true);
  });

  it("flags 1 option", () => {
    expect(checkMinOptions([{ id: "a", text: "A" }]).flagged).toBe(true);
  });

  it("passes sufficient options", () => {
    const options = [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ];
    expect(checkMinOptions(options).flagged).toBe(false);
  });
});
```

Adjust function signatures and return shapes to match the actual implementation after reading.

### 3. Verify

```bash
pnpm test -- src/lib/question-engine/validators/__tests__/shared-quality-checks.test.ts
pnpm run typecheck
pnpm exec biome check src/lib/question-engine/validators/__tests__/shared-quality-checks.test.ts
```

## Test plan

10-12 test cases:

| Function                | Case                    | Expected       |
| ----------------------- | ----------------------- | -------------- |
| `checkGibberish`        | `"aaaaaa"` (6+ repeats) | flagged: true  |
| `checkGibberish`        | `"aa"` (short repeat)   | flagged: false |
| `checkGibberish`        | Math expression         | flagged: false |
| `checkPlaceholders`     | "Lorem ipsum..."        | flagged: true  |
| `checkPlaceholders`     | Clean content           | flagged: false |
| `checkPoints`           | NaN / -1 / 0 / Infinity | flagged: true  |
| `checkPoints`           | 5                       | flagged: false |
| `checkHasEnoughContent` | "" / " "                | flagged: true  |
| `checkHasEnoughContent` | "Hello world"           | flagged: false |
| `checkMinOptions`       | 0 / 1 options           | flagged: true  |
| `checkMinOptions`       | 4 options               | flagged: false |

## Done criteria

- [ ] `pnpm test -- src/lib/question-engine/validators/__tests__/shared-quality-checks.test.ts` passes (10+ tests)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on the new file
- [ ] `plans/README.md` status row updated

## STOP conditions

- If any of the 5 functions are no longer exported (refactored into a class or removed), stop and assess — the validator architecture may have changed
- If the return shape is a boolean instead of `{ flagged, score }`, adjust assertions — do not assume the shape
- If `checkGibberish` uses a regex that produces a false positive on valid mathematical content, stop and file a bug — this is a production issue

## Estimated time

1-2 hours
