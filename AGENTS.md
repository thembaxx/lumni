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

## Visual Engine Architecture

The `VisualEngine` sits alongside `QuestionEngine` and generates diagrams/images for questions. Located at `src/lib/visual-engine/`.

### Subject Classification
- **STEM subjects** (30 subjects including sciences, tech, business, geography, design, agriculture) → AI-generated diagrams via Konva renderers
- **Non-STEM subjects** (languages, humanities, arts, services, compulsory) → Wikimedia Commons image search
- Cross-fallback: if primary method fails, tries the alternative

### API

```
POST /api/engine/visual     { questionId, questionText, subject, topic? }
GET  /api/engine/visual/test End-to-end health check
```

### Client Hook

```tsx
import { useVisualEngine } from "@/hooks/use-visual-engine"

const { data: visual, isLoading } = useVisualEngine(question)
```

### Rendering Components

```tsx
import { VisualContent } from "@/components/visual/visual-content"
import { DiagramRenderer } from "@/components/visual/diagram-renderer"

<VisualContent visual={visual} isLoading={loading} />
```

### Diagram Types (11)
- **Physics**: `force-vector`, `circuit`, `wave`, `motion`
- **Math**: `geometry`, `graph`
- **Data**: `chart` (bar/line/pie)
- **Science**: `chemistry`
- **General**: `node-flow`, `node`, `custom-svg`
- **Fallback**: `mermaid-diagram` (Mermaid.js)

### New Konva Renderers (in `src/components/quiz/diagrams/`)
- `geometry.tsx` — circles, lines, polygons, arcs, angle marks, right-angle marks
- `chart.tsx` — bar/line/pie charts with legends and gridlines
- `chemistry.tsx` — atoms (colored circles), bonds (single/double/triple/dashed), reaction arrows
- `graph.tsx` — coordinate planes, function curves, tick marks, asymptotes, labeled intercepts

### Caching + Persistence
1. Dexie IndexedDB (7-day expiry) — fastest
2. Appwrite visuals collection — cross-session (optional, fails silently)
3. AI generation / Wikimedia search — on-demand fallback

### Pre-caching
When `POST /api/engine/generate` creates questions, the engine fires background visual generation for each question so visuals are cached and ready when the question card renders.

### AI Provider Order
1. Gemini (primary, first attempted)
2. Groq (fallback)
3. DeepSeek (last resort)

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels with default naming. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
