# ADR-0001: QuestionEngine as the single deep module for question operations

**Status:** Accepted  
**Date:** 2026-05-15  
**Deprecates:** The `LearningOrchestrator`-owned `ProcessorRegistry` + `PromptManager` duplication

## Context

The codebase had two classes — `QuestionEngine` and `LearningOrchestrator` — that each owned a `ProcessorRegistry`, a `PromptManager`, and implemented nearly identical methods (`generate`, `grade`, `generateHint`, `validate`, `listTypes`, `generateMixed`, `enrichParams`, `retrieveCurriculumContext`). Both lived under `src/lib/` and were used in different contexts:

- `QuestionEngine` was constructed but effectively unused as a direct dependency — all callers went through `LearningOrchestrator`
- `LearningOrchestrator` wrapped generation with job-queue orchestration (visual pre-cache, Appwrite sync, analytics tracking, spaced-repetition, progress, competency), but duplicated the entire generation pipeline instead of composing `QuestionEngine`

This violated the **depth** principle: neither module was deep. `QuestionEngine` had a shallow interface because all real callers bypassed it. `LearningOrchestrator` had a wide interface because it duplicated question logic alongside orchestration.

## Decision

`LearningOrchestrator` now composes `QuestionEngine` instead of duplicating it:

- `LearningOrchestrator` accepts a `QuestionEngine` instance at construction (created via `QuestionEngine.initialize()`)
- All core question operations (`generate`, `grade`, `generateHint`, `validate`, `listTypes`) delegate to the engine
- `LearningOrchestrator` retains only orchestration methods: `generateQuestionSet` (generate → cache → enqueue jobs → track) and `gradeAndTrack` (grade → enqueue jobs → track)
- The duplicated `generateMixed`, `enrichParams`, `retrieveCurriculumContext` private methods were removed from `LearningOrchestrator`

## Consequences

**Positive:**

- Question-generation logic lives in one module (`QuestionEngine`). Bugs in prompt schema, type batching, or curriculum enrichment are fixed in one place
- `LearningOrchestrator`'s interface shrinks to just orchestration. Callers who need questions use `QuestionEngine` directly; callers who need the full pipeline use the orchestrator
- Testability: `QuestionEngine` can be tested in isolation without mocking jobs/analytics. `LearningOrchestrator` tests verify only orchestration (did it delegate to generate + enqueue the right jobs?)

**Negative:**

- `LearningOrchestrator.initialize()` now calls `QuestionEngine.initialize()`, adding one level of indirection at startup

**Risks:**

- If a future feature needs different `ProcessorRegistry` or `PromptManager` instances for orchestrated vs. non-orchestrated paths, composition could be replaced by an interface seam. For now, a single shared engine is correct
