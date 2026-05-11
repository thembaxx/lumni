# KaTeX / Math Conventions

## Delimiter Standard
- **Inline math**: `$...$` (e.g., `$F = ma$`)
- **Display math**: `$$...$$` (e.g., `$$\int x^2 \, dx$$`)
- Do NOT use `\(...\)` or `\[...\]` — `remark-math` defaults to dollar-sign delimiters

## Rendering Components

### MarkdownRenderer
For math inside markdown content. Automatically enabled for all STEM subjects.

```tsx
<MarkdownRenderer content="$E = mc^2$" subject="physical-sciences" />
```

### Equation (standalone)
For rendering individual equations outside of markdown.

```tsx
import { Equation } from "@/components/ui/equation"
<Equation math="E = mc^2" />
<Equation math="\int x^2 \, dx" block />
```

## Question Engine Architecture

The `QuestionEngine` is the single source of truth for all question operations. Located at `src/lib/question-engine/`.

### API

```
POST /api/engine/generate   { subject, topic?, count, questionType?, difficulty? }
POST /api/engine/grade      { question, answer }
POST /api/engine/hint       { question }
GET  /api/engine/test       End-to-end health check
```

### Client Hook

```tsx
import { useQuestionEngine } from "@/hooks/use-question-engine"

const { questions, isLoading, generate, grade, hint } = useQuestionEngine(
  { subject: "mathematics", count: 5, questionType: "any" },
  { enabled: true }
)
```

### Question Types (11)
- **Selected Response**: `multiple-choice`, `matching`
- **Constructed Response**: `short-answer`, `long-answer`, `essay`
- **STEM / Technical**: `calculation`, `diagram`, `programming`
- **Context / Mixed**: `source-based`, `data-response`, `mixed`

### Validation
Questions are validated against per-type validators (score 0-100). Low-scoring questions are regenerated. Validators check: schema (required fields), quality (gibberish, placeholders), consistency (points vs difficulty).

### Caching + Persistence
1. Dexie IndexedDB (24h expiry) — fastest
2. Appwrite questions collection — cross-session
3. AI generation — on-demand fallback

### TypeScript Types

```typescript
// Re-exported from @/types/questions for backward compat:
import type { Question, QuestionType, GradingResult, Option } from "@/types/questions"

// Or import directly from engine:
import type { Question, GradingResult } from "@/lib/question-engine/types"
```
