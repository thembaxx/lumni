# Plan 067: Replace synthetic pool question body with real past-paper data

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

The question-pool system (`checkDuplicate` → `generateForPool`) creates "pool questions" with a synthetic body string of the form `question.stem` + `\n\n` + serialized options. These synthetic bodies are passed to the AI grader (`POST /api/engine/grade`), which produces inconsistent results because the body format differs from real questions. Additionally, the pool questions lose critically needed context: linked past-paper section name, paper year, and marking guidelines. This makes the "Practice More" and wrong-answer re-encounter loops less effective.

## Current state

`src/lib/question-engine/question-engine.ts`:

```typescript
// Line 173-186 — generateForPool:
private async generateForPool(params: GenerationParams, pool: Question[]): Promise<Question[]> {
  return pool.map(q => ({
    ...q,
    id: generateId(),
    // body is a synthetic string
    body: `${q.stem}\n\n${q.options?.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.text}`).join("\n")}`,
  }));
}

// Lines 196-202 — checkDuplicate:
// Uses `stem` to check for duplicates but doesn't enrich the body
```

## Scope

**In scope**:

- `src/lib/question-engine/question-engine.ts` — `generateForPool` and `checkDuplicate`
- `src/lib/question-engine/types.ts` — pool question type (if `PoolQuestion` is a distinct type)
- Past-paper data types (`src/lib/past-paper/` or wherever `PastPaperQuestion`, `PaperMetadata` live)
- The grading pipeline (`src/lib/question-engine/grader.ts` or wherever the grading prompt is built)

**Out of scope**:

- The source-of-truth data for past papers (the Appwrite collection or Dexie tables). Do not modify schemas.
- The visual engine — no changes needed there.
- The pool generation prompt itself — only the re-packaging of existing data.

## Commands

| Purpose   | Command                                    | Expected on success |
| --------- | ------------------------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`                       | exit 0              |
| Tests     | `pnpm run test -- src/lib/question-engine` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                   | exit 0              |

## Steps

### Step 1: Read and understand the data flow

1. Read `src/lib/question-engine/question-engine.ts` — focus on `generateForPool`, `checkDuplicate`, `generateInternal`, and `enrichParams`
2. Read `src/lib/question-engine/types.ts` — look at `PoolQuestion`, `PoolEntry`, any pool-related types
3. Read `src/lib/past-paper/` barrel — find the past-paper question type, `PaperMetadata`, `PaperSection`
4. Read `src/lib/question-engine/grader.ts` — understand how `body` is used in grading prompts

**Output**: Document the current data flow in comments (no source-code mutation; write in your own notes).

### Step 2: Add `pastPaperMetadata` to pool question type

Extend the pool question type (or add to `Question` if it's shared) to include:

```typescript
pastPaperMetadata?: {
  paperYear: number;
  sectionName: string;
  questionNumber: string;
  markScheme?: string; // brief marking guideline
  totalMarks?: number;
}
```

This should be optional so existing pool entries in Dexie are backward compatible.

### Step 3: Enrich `generateForPool`

Modify `generateForPool` to inject past-paper metadata that's already available in the pool entries:

```typescript
private async generateForPool(params: GenerationParams, pool: PoolEntry[]): Promise<Question[]> {
  return pool.map(entry => ({
    ...entry.question,
    id: generateId(),
    pastPaperMetadata: entry.pastPaperMetadata ?? undefined, // if the pool stores it
    body: buildPoolBody(entry), // richer body with context
  }));
}
```

If the pool entries don't store past-paper metadata, modify `addToPool` (or the pipeline that creates pool entries) to include it. This is the higher-effort path — track it.

### Step 4: Update the grading pipeline

In the grader, when `body` contains a reference to "from Paper X, Section Y" and includes mark scheme context, the AI grader produces more consistent evaluations. Find how the grader reads `question.body` and ensure the enriched format is compatible.

### Step 5: Verify

**Verify**:

- `pnpm run typecheck` → exit 0
- `pnpm run test -- src/lib/question-engine` → all pass
- `pnpm exec oxlint --fix` → exit 0
- Manually inspect a generated pool question: the body should contain meaningful context like "From Mathematics P1 2024, Question 3: ..."

## Done criteria

- [ ] Pool questions include `pastPaperMetadata` (year, section, question number, mark scheme) when available
- [ ] Pool question `body` is not a synthetic reshape of `stem + options` but includes past-paper context
- [ ] Grading pipeline works correctly with enriched body format
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/lib/question-engine` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If `PoolEntry` does not store past-paper metadata and adding it requires a schema migration (Dexie version bump) — stop and report. The scope needs to be re-evaluated with the schema evolution requirements.
- If the grading pipeline only reads `question.body` and expects a specific format — stop and verify backward compatibility before changing the body format.
