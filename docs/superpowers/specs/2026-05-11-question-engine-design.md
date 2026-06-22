# Question Engine — Design Spec

**Date:** 2026-05-11
**Status:** Approved for implementation

## Overview

A unified AI-powered question engine that serves as the single source of truth for all question-related operations in Lumni. Replaces all existing ad-hoc question fetching, generation, and grading code with a modular orchestrator + per-type processor architecture.

## Architecture

```
QuestionEngine (orchestrator)
  ├── ProcessorRegistry
  │   ├── MCQProcessor
  │   ├── MatchingProcessor
  │   ├── ShortAnswerProcessor
  │   ├── LongAnswerProcessor
  │   ├── EssayProcessor
  │   ├── CalculationProcessor
  │   ├── DiagramProcessor
  │   ├── ProgrammingProcessor
  │   ├── SourceBasedProcessor
  │   ├── DataResponseProcessor
  │   └── MixedProcessor
  └── Shared Services
      ├── AIClient (provider chain: Gemini → Groq → DeepSeek)
      ├── PromptManager (per-type templates + schemas)
      ├── MediaResolver (rendering dispatch)
      ├── QuestionCache (Dexie + Zustand)
      └── RateLimiter
```

## Core Interfaces

### Question Types (12 types, 4 families)

| Family               | Types                                    | Grade Method                   |
| -------------------- | ---------------------------------------- | ------------------------------ |
| Selected Response    | `multiple-choice`, `matching`            | Deterministic (compare to key) |
| Constructed Response | `short-answer`, `long-answer`, `essay`   | AI-graded                      |
| STEM / Technical     | `calculation`, `diagram`, `programming`  | AI-graded                      |
| Context / Mixed      | `source-based`, `data-response`, `mixed` | AI-graded                      |

### Type Definitions

```typescript
type QuestionType =
  | "multiple-choice"
  | "matching"
  | "short-answer"
  | "long-answer"
  | "essay"
  | "calculation"
  | "diagram"
  | "programming"
  | "source-based"
  | "data-response"
  | "mixed";

interface QuestionBase<T extends QuestionType> {
  id: string;
  type: T;
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  bloomTaxonomy: BloomLevel;
  points: number;
  questionText: string;
  hint: string;
  explanation: string;
  steps?: string[];
  media?: MediaContent[];
  body: QuestionBody[T];
}

interface QuestionBody {
  "multiple-choice": { options: Option[]; correctOptionId: string; allowMultiple: boolean };
  matching: { pairs: { left: string; right: string }[]; shuffle: boolean };
  "short-answer": { modelAnswer: string; acceptableAnswers: string[]; maxLength: number };
  "long-answer": {
    rubric: RubricCriterion[];
    modelAnswer: string;
    minWords: number;
    maxWords: number;
  };
  essay: { rubric: RubricCriterion[]; modelAnswer: string; wordLimit: number };
  calculation: { formula: string; correctValue: number; unit: string; tolerance: number };
  diagram: { diagramData: DiagramSpec; instructions: string };
  "source-based": { source: Source; subQuestions: SubQuestion[] };
  programming: { language: string; starterCode?: string; testCases: TestCase[]; timeLimit: number };
  "data-response": { data: DataSet; questions: SubQuestion[] };
  mixed: { parts: MixedPart[] };
}
```

### Processor Interface

```typescript
interface QuestionProcessor<T extends QuestionType> {
  type: T;
  generate(params: GenerationParams): Promise<Question<T>[]>;
  generateHint(question: Question<T>): Promise<string>;
  grade(question: Question<T>, answer: UserAnswer): Promise<GradingResult>;
  validate(question: Question<T>): ValidationResult;
}
```

### Media Content

```typescript
interface MediaContent {
  type: "inline-svg" | "image-url" | "diagram-data" | "map-coordinates" | "interactive";
  label: string;
  svgContent?: string;
  diagramData?: DiagramSpec;
  imageUrl?: string;
  mapCoordinates?: { lat: number; lng: number; zoom: number; markerLabel?: string };
  interactiveUrl?: string;
  interactiveData?: Record<string, unknown>;
}
```

### Generation Parameters

```typescript
interface GenerationParams {
  subject: string;
  topic?: string;
  curriculumUnit?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  bloomLevel?: BloomLevel;
  questionType?: QuestionType | QuestionType[] | "any";
  count: number;
  sourceExamPaper?: string;
}
```

### Grading Result

```typescript
interface GradingResult {
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  breakdown?: { criterion: string; score: number; maxScore: number; feedback: string }[];
}
```

## Generation Pipeline

```
GenerationParams → QuestionEngine.generate()
  1. Build cache key, check Dexie → Zustand
  2. RAG-enrich if curriculum content available
  3. Route to correct processor
  4. Processor builds prompt via PromptManager
  5. AIClient.generateWithSystem() with provider fallback
  6. Parse JSON → zod schema validation
  7. Post-process: deduplicate, assign IDs, attach media
  8. Cache + return
```

## Answer Checking Pipeline

```
UserAnswer → QuestionEngine.grade()
  1. Route to processor by question.type
  2. Processor determines strategy:
     - Deterministic: compare option IDs / pair IDs
     - AI short-answer: semantic equivalence check
     - AI calculation: numerical eval with tolerance
     - AI essay: rubric-based scoring
     - AI programming: code review + test case pass/fail
     - AI source-based: source interpretation check
     - AI diagram: element matching check
  3. Cache result
  4. Return { correct, score, feedback, breakdown }
```

## AI Integration

- `PromptManager` provides per-type system + user prompt templates
- Each template includes: role definition, JSON output schema, few-shot examples
- Output validated against per-type zod schema
- Chain-of-thought used for complex types (essay, programming)
- Provider fallback: Gemini → Groq → DeepSeek (preserved from existing AIClient)

## Error Handling

| Failure              | Behavior                               |
| -------------------- | -------------------------------------- |
| All providers fail   | Return cached if available, else error |
| Malformed JSON       | Retry × 2 with stricter prompt         |
| Low validation score | Reject + regenerate (max 3 attempts)   |
| Rate limited         | 429 with Retry-After                   |
| Grading AI fails     | Partial score with explanatory note    |

## File Cleanup Plan

**Files to delete:**

- `src/types/questions.ts`
- `src/hooks/use-subject-questions.ts`
- `src/hooks/use-ai-generate-questions.ts`
- `src/hooks/use-quiz-engine.ts`
- `src/store/quiz-engine.ts`
- `src/lib/utils/question-validator.ts`
- `src/app/api/generate-questions/route.ts`
- `src/app/api/questions/route.ts`
- `src/app/api/list-qa-files/route.ts`
- `src/data/demo-questions.ts`
- All QA JSON files in `questions/` directory
- `src/lib/server/upload-qa-json.ts`
- `src/lib/utils/upload-subject-questions.ts`
- `src/lib/server/sync-qa.ts`

**Files to refactor:**

- `src/components/quiz/question-card.tsx` → use new Question type
- `src/components/quiz/quiz-view.tsx` → use new engine hooks
- `src/components/quiz/question-diagram.tsx` → use MediaResolver
- `src/hooks/use-quiz-session.ts` → use QuestionEngine
- `src/lib/db/client.ts` → update Question type
- `src/lib/db/offline.ts` → update CachedQuestion type

## File Structure (New)

```
src/lib/question-engine/
├── index.ts                    # Public API: QuestionEngine class
├── types.ts                    # All core types (Question, UserAnswer, etc.)
├── processor-registry.ts       # Processor lookup
├── prompt-manager.ts           # Per-type prompt templates
├── media-resolver.ts           # Media dispatch / hydration
├── validation-error.ts         # Validation errors
├── processors/
│   ├── base-processor.ts       # Base class / interface
│   ├── mcq-processor.ts
│   ├── matching-processor.ts
│   ├── short-answer-processor.ts
│   ├── long-answer-processor.ts
│   ├── essay-processor.ts
│   ├── calculation-processor.ts
│   ├── diagram-processor.ts
│   ├── programming-processor.ts
│   ├── source-based-processor.ts
│   ├── data-response-processor.ts
│   └── mixed-processor.ts
├── prompts/
│   ├── mcq-prompt.ts
│   ├── matching-prompt.ts
│   ├── short-answer-prompt.ts
│   ├── long-answer-prompt.ts
│   ├── essay-prompt.ts
│   ├── calculation-prompt.ts
│   ├── diagram-prompt.ts
│   ├── programming-prompt.ts
│   ├── source-based-prompt.ts
│   ├── data-response-prompt.ts
│   └── mixed-prompt.ts
├── validators/
│   ├── base-validator.ts
│   ├── mcq-validator.ts
│   ├── matching-validator.ts
│   ├── ... (per type)
│   └── shared-quality-checks.ts
```

## API Routes (New)

```
POST /api/engine/generate       → QuestionEngine.generate()
POST /api/engine/grade          → QuestionEngine.grade()
POST /api/engine/hint           → QuestionEngine.generateHint()
```

## Hooks (New)

```typescript
useQuestionEngine(params) → { questions, isLoading, error, generate, grade, hint }
```

Single hook replaces: useSubjectQuestions, useAIGenerateQuestions, useQuizEngine.
