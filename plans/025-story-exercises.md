# Plan 025: Story exercises — fill-in-blank, true-false, matching

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none

## Why this matters

Stories currently have only MCQ and short-answer comprehension questions. Adding fill-in-blank, true-false, and matching exercise types makes story practice more engaging and pedagogically valuable.

## Scope

**In scope**:

- `src/lib/stories/types.ts` — expand `questionType` union
- `src/lib/stories/service.ts` — update AI system prompt to generate new types
- `src/components/stories/comprehension-question-card.tsx` — add rendering for new types
- `src/lib/stories/__tests__/service.test.ts` — update existing tests

**Out of scope**: Summary exercise, AI-based grading, ordering/drag-to-reorder

## Steps

### Step 1: Expand types

In `types.ts`, change `questionType` from `"mcq" | "short-answer"` to:

```typescript
questionType: "mcq" | "short-answer" | "fill-in-blank" | "true-false" | "matching";
```

Add optional fields:

- `sentenceTemplate?: string` — text with `___` for fill-in-blank
- `pairs?: { left: string; right: string }[]` — for matching exercises

### Step 2: Update AI prompt

In `service.ts`, update the system prompt to ask for:

1. `fill-in-blank`: "Create fill-in-the-blank questions by replacing a key word with `___` in a sentence. Set `questionType` to `\"fill-in-blank\"`, provide the sentence in `questionText`, the missing word as `correctAnswer`, and the full sentence in `sentenceTemplate`."
2. `true-false`: "Create true/false statements about the story. Set `questionType` to `\"true-false\"`, write the statement in `questionText`, set `correctAnswer` to `\"True\"` or `\"False\"`."
3. `matching`: "Create matching exercises with items in two columns. Set `questionType` to `\"matching\"`, write instructions in `questionText`, provide pairs in `pairs` array with `left` and `right` strings. The `correctAnswer` should be a string joining left-right pairs."

### Step 3: Add rendering in ComprehensionQuestionCard

In `comprehension-question-card.tsx`, add a `switch` on `question.type`:

- `"fill-in-blank"`: Render sentence with highlighted `___` and text input field. On submit, compare with `correctAnswer` using fuzzy-match.
- `"true-false"`: Render two buttons "True" / "False". Works just like MCQ with 2 options.
- `"matching"`: Render left column (clickable items) and right column (clickable items). User clicks a left item then a right item to create a pair. Show matched pairs. Grade by counting correct pairs as percentage.

### Step 4: Verify

```bash
npx tsc --noEmit
npx biome check
bun run test
```

## Done criteria

- Types expanded with new question types
- AI prompt updated to generate all 3 new types
- UI renders fill-in-blank with text input
- UI renders true-false with 2 buttons
- UI renders matching with two-column interaction
- Tests pass with no regressions
