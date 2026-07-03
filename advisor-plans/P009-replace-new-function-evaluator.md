# Plan P009: Replace `new Function()` with Safe Math Evaluator

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/lib/solver/evaluator.ts src/lib/solver/`
> If either file changed, compare excerpts against live code.

## Status

- **Priority**: P0
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

`src/lib/solver/evaluator.ts:42` uses `new Function(...)` to evaluate math expressions from user or AI-supplied strings. While a character filter blocks most injection vectors, `new Function` is a well-known arbitrary code execution primitive. The character filter (`/[^0-9+\-*/.()%\s, a-zA-Z.:]/`) permits `.` and `()`, which in theory allows property traversal. This runs server-side in the V8 runtime and is invoked during the AI solve flow, which means an attacker who can influence the AI output or a user who submits a crafted expression can trigger code execution.

## Current state

**`src/lib/solver/evaluator.ts`** (61 lines total):

```typescript
export function evaluate(expression: string): number {
  if (!expression || typeof expression !== "string") { throw ... }

  let cleaned = expression.replace(/\s+/g, " ").trim();
  // Replace math aliases (sqrt→Math.sqrt, etc.)
  for (const [name, replacement] of Object.entries(MATH_ALIASES)) { ... }
  cleaned = cleaned.replace(/\bpi\b/gi, "Math.PI").replace(/\be\b/gi, "Math.E").replace(/\^/g, "**");

  const blocked = /[^0-9+\-*/.()%\s, a-zA-Z.:]/.test(cleaned);
  if (blocked) throw new Error("Expression contains disallowed characters");

  try {
    const fn = new Function("Math", "Number", "parseFloat", "parseInt", "isFinite", "isNaN",
      `"use strict"; return (${cleaned});`);
    const result = fn(Math, Number, parseFloat, parseInt, isFinite, isNaN);
    // ...
  } catch (err) { ... }
}
```

There is no `evaluator.test.ts` file — this module has zero tests.

**Approach**: Replace `new Function` with a simple recursive-descent or shunting-yard parser that evaluates arithmetic expressions node-by-node, with NO access to named variables, object properties, or the global scope. Only numbers and operators.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/lib/solver/evaluator.ts` — rewrite the `evaluate()` function
- Create `src/lib/solver/evaluator.test.ts` — characterization tests for the safe evaluator
- `src/lib/solver/` — any other files that import from `evaluator.ts`

**Out of scope**:

- Any other solver files (`math-solver.ts`, etc.)
- Adding mathjs or expr-eval as a dependency (this plan uses a hand-written parser to keep the dependency tree lean)

## Git workflow

- Branch: `advisor/P009-safe-evaluator`
- Commit message: `fix: replace new Function() evaluator with safe recursive-descent parser`
- Do NOT push or open a PR

## Steps

### Step 1: Write the safe evaluator

Replace `src/lib/solver/evaluator.ts` with a recursive-descent parser that handles:

- Numbers (integer and decimal: `42`, `3.14`)
- Binary operators: `+`, `-`, `*`, `/`, `**` (exponentiation), `%` (modulo)
- Unary minus: `-5`, `-(3+2)`
- Parentheses: `(2+3)*4`
- Math aliases: `sqrt`, `cbrt`, `abs`, `round`, `floor`, `ceil`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `ln`, `exp` (same set as current `MATH_ALIASES`)
- Constants: `pi` (→ Math.PI), `e` (→ Math.E)
- The `^` → `**` replacement

The parser should:

- Tokenize into numbers, operators, parentheses, identifiers, and commas
- Use precedence climbing for binary operators
- NOT use `eval`, `new Function`, `setTimeout`, `.constructor`, `Reflect`, or any dynamic execution
- NOT allow property access, variables, or function calls beyond the predefined math functions

Structure:

```typescript
type Token =
  | { type: "number"; value: number }
  | { type: "op"; value: string }
  | { type: "paren"; value: "(" | ")" }
  | { type: "ident"; value: string }
  | { type: "comma" };

const MATH_FUNCS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  ln: Math.log,
  exp: Math.exp,
};
```

The evaluate function:

1. Tokenize the input string
2. Parse using precedence climbing (or recursive descent)
3. Return the numeric result
4. Throw on invalid expressions, division by zero, or unsupported constructs

**Operator precedence** (lowest to highest):

- `+`, `-` → precedence 1
- `*`, `/`, `%` → precedence 2
- `**` → precedence 3 (right-associative)

### Step 2: Write characterization tests

Create `src/lib/solver/evaluator.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { evaluate } from "./evaluator";

describe("evaluate", () => {
  it("evaluates simple arithmetic", () => {
    expect(evaluate("2+3")).toBe(5);
    expect(evaluate("10-4")).toBe(6);
    expect(evaluate("3*4")).toBe(12);
    expect(evaluate("10/2")).toBe(5);
    expect(evaluate("7%3")).toBe(1);
  });

  it("handles exponentiation", () => {
    expect(evaluate("2**3")).toBe(8);
    expect(evaluate("2^3")).toBe(8);
    expect(evaluate("9**0.5")).toBe(3);
  });

  it("handles parentheses", () => {
    expect(evaluate("(2+3)*4")).toBe(20);
    expect(evaluate("2*(3+4)")).toBe(14);
  });

  it("handles unary minus", () => {
    expect(evaluate("-5")).toBe(-5);
    expect(evaluate("-(3+2)")).toBe(-5);
  });

  it("handles math functions", () => {
    expect(evaluate("sqrt(9)")).toBe(3);
    expect(evaluate("abs(-5)")).toBe(5);
    expect(evaluate("round(3.7)")).toBe(4);
    expect(evaluate("floor(3.7)")).toBe(3);
    expect(evaluate("ceil(3.2)")).toBe(4);
    expect(evaluate("sin(0)")).toBe(0);
    expect(evaluate("cos(0)")).toBe(1);
    expect(evaluate("ln(1)")).toBe(0);
    expect(evaluate("exp(0)")).toBe(1);
  });

  it("handles constants", () => {
    expect(evaluate("pi")).toBeCloseTo(3.14159, 4);
    expect(evaluate("e")).toBeCloseTo(2.71828, 4);
  });

  it("handles precedence correctly", () => {
    expect(evaluate("2+3*4")).toBe(14);
    expect(evaluate("2*3+4")).toBe(10);
    expect(evaluate("2+3+4")).toBe(9);
  });

  it("handles decimals", () => {
    expect(evaluate("3.14*2")).toBeCloseTo(6.28, 5);
    expect(evaluate("0.5+0.25")).toBeCloseTo(0.75, 5);
  });

  it("handles complex expressions", () => {
    expect(evaluate("sqrt(25)+3*2")).toBe(11);
    expect(evaluate("(2+3)*4-6/2")).toBe(17);
  });

  it("throws on invalid expressions", () => {
    expect(() => evaluate("")).toThrow();
    expect(() => evaluate("abc")).toThrow();
    expect(() => evaluate("2+/3")).toThrow();
    expect(() => evaluate("(2+3")).toThrow();
  });

  it("throws on division by zero", () => {
    expect(() => evaluate("1/0")).toThrow();
  });
});
```

**Verify**: `pnpm run test -- evaluator` → all pass.

### Step 3: Check all callers

Find all files that import from `src/lib/solver/evaluator`:

```bash
grep -rn "from.*evaluator\|import.*evaluator" --include="*.ts" --include="*.tsx" src/
```

Verify that the `evaluate(expression: string): number` signature is unchanged — callers should work without modification.

### Step 4: Build verification

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

The `evaluator.test.ts` created in Step 2 covers: basic arithmetic, operator precedence, parentheses, unary minus, math functions, constants, decimals, complex expressions, error cases (invalid input, division by zero). This matches the feature parity of the old implementation without the security risk.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass (including new test file with 12+ test cases)
- [ ] `grep -n "new Function" src/lib/solver/evaluator.ts` returns no matches
- [ ] `grep -rn "new Function\|\.call\|\.apply\|eval(" --include="*.ts" src/lib/solver/evaluator.ts` returns no matches (only for evaluator.ts)
- [ ] All existing tests still pass
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any caller of `evaluate()` relies on edge cases not handled in the test plan (e.g., multi-argument math functions like `pow(2,3)`, string concatenation behavior, implicit multiplication `2pi`)
- The parser approach chosen doesn't handle all the aliases in the current `MATH_ALIASES` map
- Any caller depends on the error message format from the old evaluator

## Maintenance notes

- The recursive-descent parser is self-contained with no dependencies. If future requirements demand more complex math (vectors, matrices, symbolic differentiation), consider adopting a library like `mathjs`.
- The `MATH_ALIASES` map can be extended by adding entries to the `MATH_FUNCS` record in the new parser.
- The safe evaluator naturally rejects any attempt to access `this`, `arguments`, or global scope — no character filter needed.
