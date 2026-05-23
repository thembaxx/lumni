<!-- LAST_SYNC: 2026-05-23 -->
# Context Reference

## PROJECT_IDENTITY
Lumni: AI-powered study platform for South African Matric students. Built with Next.js, React, and Appwrite. Mobile-first and offline-capable.

## CURRENT_FOCUS
Enhancing gamification, study planning, and ensuring data consistency across competency tracking.

## KEY_CONSTRAINTS
- Offline-first architecture using Dexie.
- AI token budgets per user and global.
- South African CAPS curriculum alignment.

## DEFINITIONS
- **NSC**: National Senior Certificate.
- **CAPS**: Curriculum Assessment Policy Statements.
- **APS**: Admission Point Score.
- **SM-2**: Spaced Repetition Algorithm.

## DECISION_LOG
- Used Dexie for IndexedDB management to ensure robust offline support.
- Implemented a tiered AI provider strategy (Gemini -> Nvidia -> Groq) for cost and reliability.
- Biome for linting/formatting instead of ESLint/Prettier for speed.

## KNOWLEDGE_GRAPH
QuestionEngine -> VisualEngine -> LearningOrchestrator -> Dexie/Appwrite

## REUSABLE_SNIPPETS
```tsx
// Using Question Engine
const { questions, generate } = useQuestionEngine({ subject: "mathematics", count: 5 });
```

## AVOID_LIST
- Do not use `\(...\)` or `\[...\]` for math; use `$...$` or `$$...$$`.
- Avoid direct Appwrite calls in components; use hooks or server actions.

## PROMPT_LOOKUP_TABLE
- If I ask about architecture, check `system-design.md`.
- If I ask about code signatures, check `code-signatures.json`.
