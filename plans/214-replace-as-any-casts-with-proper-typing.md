# Plan 214: Replace `as any` casts in 5 production files with proper typing

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: bug / type-safety

## Why this matters

Six `as any` casts in 5 production files defeat TypeScript's type checking entirely. Each cast opens a window for runtime errors: mismatched enum values, undefined property access, and silent type-coercion bugs. The proper types already exist in the codebase (enums, discriminated unions, `QuestionType`, `SessionParticipant`) — they just aren't being used. These casts hide real type mismatches that `tsc --noEmit` should catch.

## Current state

**Site 1 — `risk-alerts.tsx:169,186`** (`src/components/teacher/risk-alerts.tsx`):

```tsx
onChange={(e) => setFilterSeverity(e.target.value as any)}   // line 169
```

```tsx
onChange={(e) => setSortBy(e.target.value as any)}            // line 186
```

`e.target.value` is `string`. The state setters expect `"all" | "high" | "medium" | "low"` and `"riskScore" | "lastActive" | "name"` respectively.

**Site 2 — `CollaborativeWhiteboard.tsx:306`** (`src/components/collaborative/CollaborativeWhiteboard.tsx`):

```tsx
onClick={() => setTool(t.id as any)}
```

`t.id` is `string` from the untyped tool button array. `setTool` expects `"pen" | "eraser" | "highlighter" | "select" | "text" | "shape"`.

**Site 3 — `collaborative/service.ts:138`** (`src/lib/collaborative/service.ts`):

```ts
return { session, participant: participant as any };
```

`participant` is typed as `Record<string, unknown>` from the object literal `{ userId, name, role, ... }`. The return type expects `SessionParticipant` (defined in `src/lib/collaborative/types.ts:18`).

**Site 4-5 — `multilingual-evaluation.ts:229-230`** (`src/lib/question-engine/multilingual-evaluation.ts`):

```ts
type: question.expectedType as any,
} as any;
```

`question.expectedType` is a `string` but the `type` field in `mockQuestion` expects `QuestionType` (a union of 17 string literals). The whole object `as any` bypasses all property validation.

## Target state

Each `as any` replaced with the correct type cast or interface conformance:

1. `risk-alerts.tsx` — Cast `e.target.value` to the specific union types via `as "all" | "high" | "medium" | "low"` and `as "riskScore" | "lastActive" | "name"`.
2. `CollaborativeWhiteboard.tsx` — Type the tool array elements with `as const` so `t.id` is a literal union, or cast `t.id as typeof tool`.
3. `collaborative/service.ts` — Type the `participant` object literal as `SessionParticipant` instead of `Record<string, unknown>`.
4. `multilingual-evaluation.ts` — Remove `as any` on the mock object; cast `expectedType` to `QuestionType` and let the object literal infer its type from `mockQuestion`'s structural shape, or cast with `as Question`.

## Scope

- `src/components/teacher/risk-alerts.tsx` — lines 169, 186
- `src/components/collaborative/CollaborativeWhiteboard.tsx` — line 306
- `src/lib/collaborative/service.ts` — line 138
- `src/lib/question-engine/multilingual-evaluation.ts` — lines 229-230
- No other files

## Steps

### 1. Fix risk-alerts.tsx — `onChange` select handlers

File: `src/components/teacher/risk-alerts.tsx`

Line 169: Change `e.target.value as any` to `e.target.value as "all" | "high" | "medium" | "low"`.
Line 186: Change `e.target.value as any` to `e.target.value as "riskScore" | "lastActive" | "name"`.

Alternatively, read the state type annotations to confirm the exact union literals. Search for `useState` calls for `filterSeverity` and `sortBy` in the same file.

### 2. Fix CollaborativeWhiteboard.tsx — tool button click

File: `src/components/collaborative/CollaborativeWhiteboard.tsx`

The `tool` state is typed as:

```ts
const [tool, setTool] = useState<"pen" | "eraser" | "highlighter" | "select" | "text" | "shape">(
  "pen",
);
```

Option A (preferred): Type the tool array with `as const`:

```ts
const TOOLS = [
  { id: "select", label: "Select", icon: "🖱️" },
  { id: "pen", label: "Pen", icon: "✏️" },
  { id: "eraser", label: "Eraser", icon: "🧽" },
  { id: "highlighter", label: "Highlighter", icon: "🖍️" },
  { id: "shape", label: "Shape", icon: "🔷" },
  { id: "text", label: "Text", icon: "📝" },
] as const;

type Tool = (typeof TOOLS)[number]["id"];
```

Then the inline map iterates `TOOLS` and `t.id` is automatically typed as the union. If the `setTool` state type is `Tool`, `as any` is no longer needed.

Option B (simpler): Cast inside the arrow:

```tsx
onClick={() => setTool(t.id as "pen" | "eraser" | "highlighter" | "select" | "text" | "shape")}
```

Use Option A for type-safety, Option B as a smaller diff. Choose based on how many other places reference the inline array.

### 3. Fix collaborative/service.ts — participant type

File: `src/lib/collaborative/service.ts`

Change the `participant` variable (line 126-133) from `Record<string, unknown>` to `SessionParticipant`:

```ts
import type { SessionParticipant } from "./types";

const participant: SessionParticipant = {
  userId,
  name: userName,
  role: "participant",
  joinedAt: Date.now(),
  color: PARTICIPANT_COLORS[(session.participants as unknown[]).length % PARTICIPANT_COLORS.length],
  isMuted: false,
  isVideoEnabled: false,
};
```

Also fix the `session.participants` access on line 119 — the `CollaborativeSession` type doesn't have a `participants` field in `types.ts`. Investigate: is there a separate persistent session type used in `service.ts`? If the `participants` field exists at runtime but not in the type, widen the type or add it to the interface as optional. This may be a separate latent type bug — but for this plan, fix the `as any` return at line 138 and document any additional type mismatches found.

After fixing the type, change line 138:

```ts
return { session, participant: participant as any };
```

to:

```ts
return { session, participant };
```

### 4. Fix multilingual-evaluation.ts — mockQuestion type

File: `src/lib/question-engine/multilingual-evaluation.ts`

Replace lines 222-230:

```ts
const mockQuestion = {
  id: question.id,
  subject: question.subject,
  topic: question.topic,
  questionText: question.questionText,
  explanation: "",
  hint: "",
  type: question.expectedType as any,
} as any;
```

With:

```ts
import type { QuestionType } from "./types";

const mockQuestion: Partial<Question<QuestionType>> & { type: QuestionType } = {
  id: question.id,
  subject: question.subject,
  topic: question.topic,
  questionText: question.questionText,
  explanation: "",
  hint: "",
  type: question.expectedType as QuestionType,
};
```

If `Partial<Question>` doesn't satisfy the validator signature, import the validator's expected input type instead. The key is to remove the whole-object `as any` so at least the known fields are checked.

### 5. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Expected: zero errors. No test regressions.

## Stop conditions

- Any file outside the 4 listed is modified — stop and revert
- `pnpm run typecheck` fails
- More than 2 tests regress
- The `CollaborativeSession.participants` type widening (Step 3) introduces a new type error in another file — stop and document the separate fix needed

## Estimated time

1-2 hours
