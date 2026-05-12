# Visual Engine Plan

## Overview

A new `VisualEngine` module (`src/lib/visual-engine/`) that sits alongside the existing `QuestionEngine`. It generates **diagrams for STEM subjects** (via AI → Konva with Mermaid.js fallback) and **fetches images for non-STEM subjects** (via Wikimedia Commons API), then integrates into the question display pipeline.

## Architecture

```
src/lib/visual-engine/
├── types.ts              # VisualContent, subject classification maps
├── visual-engine.ts      # Main engine (cache → AI → fallback flow)
├── stem-renderer.ts      # AI prompt → validates → maps to Konva/Mermaid
├── diagram-mapper.ts     # Map AI output shapes to konva data structures
├── image-resolver.ts     # Wikimedia Commons search for images
├── prompts.ts            # AI system/user prompts for diagram gen
└── index.ts              # Barrel exports

src/components/visual/
├── visual-content.tsx     # Top-level: shows diagram or image above question
├── diagram-renderer.tsx   # Routes Konva vs Mermaid rendering
├── mermaid-diagram.tsx    # Mermaid.js client wrapper
└── image-viewer.tsx       # Image with attribution, loading, error states

src/components/quiz/diagrams/
├── geometry.tsx           # Geometric constructions (angles, triangles, circles)
├── chart.tsx              # Bar/line/pie charts (Accounting, Economics, Geography)
├── chemistry.tsx          # Molecular structures, reactions (Life Sciences, Physical Sciences)
└── graph.tsx              # Coordinate graphs, functions (Mathematics)

src/hooks/use-visual-engine.ts   # React query hook (fetch + cache)

src/app/api/engine/visual/route.ts  # POST /api/engine/visual
```

## Subject Classification (Broad STEM)

| Category | Subjects | Engine |
|---|---|---|
| **Sciences** (6) | Mathematics, Technical Mathematics, Mathematical Literacy, Physical Sciences, Life Sciences, Agricultural Sciences, Technical Sciences | AI → Konva / Mermaid |
| **Technology** (6) | Civil Tech, CAT, Electrical Tech, EGD, IT, Mechanical Tech | AI → Konva / Mermaid |
| **Agriculture** (2) | Agricultural Management Practices, Agricultural Technology | AI → Konva / Mermaid |
| **Business** (3) | Accounting, Business Studies, Economics | AI → Konva / Mermaid |
| **Geography** (1) | Geography | AI → Konva / Mermaid |
| **Design/Arts** (2) | Design, Visual Arts | AI → Konva / Mermaid |
| **Languages** (16) | All Home/FAL languages | Image search |
| **Humanities** (2) | History, Religion Studies | Image search |
| **Arts** (3) | Dance Studies, Dramatic Arts, Music | Image search |
| **Services** (3) | Consumer Studies, Hospitality Studies, Tourism | Image search |
| **Compulsory** (1) | Life Orientation | Image search |

## Diagram Generation Flow (STEM)

```
Question + Subject
  → AI prompt: "Generate a diagram for this question"
  → AI classifies type + outputs JSON data
  → Validates against known Konva renderer interfaces
  → If valid → return VisualContent { type: "konva-diagram", diagramType, diagramData }
  → If invalid → fallback to Mermaid.js prompt
  → If Mermaid also fails → return null (no visual)
```

## Image Search Flow (Non-STEM)

```
Question + Subject
  → Extract key terms from question text
  → Query Wikimedia Commons API
  → Filter best match by relevance + license
  → Return VisualContent { type: "image", imageUrl, sourceUrl, attribution }
  → If no good match → return null
```

## Caching Strategy (Hybrid)

| Layer | Storage | Expiry | Purpose |
|---|---|---|---|
| L1 | Dexie (IndexedDB) | 7 days | Fast offline retrieval |
| L2 | Appwrite `visuals` collection | Indefinite | Cross-session persistence |
| L3 | AI generation / Wikimedia API | On-demand | Fallback when uncached |

## Data Flow

```
Question generated/loaded
  → QuestionCard renders
  → useVisualEngine(question, subject) fires
     → Check Dexie cache (key: question.id + subject)
     → If cached: return VisualContent immediately
     → If not cached: POST /api/engine/visual
        → VisualEngine.resolve()
           → If STEM subject:
              → AI generates JSON diagram data
              → diagram-mapper validates + maps to Konva interface
              → If valid: VisualContent { type: "konva-diagram", ... }
              → If invalid: fallback to Mermaid prompt → VisualContent { type: "mermaid-diagram", ... }
              → If both fail: return null
           → If non-STEM:
              → image-resolver queries Wikimedia Commons API
              → Filters + deduplicates → VisualContent { type: "image", ... }
              → If no match: return null
        → Cache result in Dexie (7-day expiry)
        → Return VisualContent
  → VisualContent component renders above question text
```

## Files to Create (18 new files)

### Engine Layer
- `src/lib/visual-engine/types.ts`
- `src/lib/visual-engine/prompts.ts`
- `src/lib/visual-engine/diagram-mapper.ts`
- `src/lib/visual-engine/stem-renderer.ts`
- `src/lib/visual-engine/image-resolver.ts`
- `src/lib/visual-engine/visual-engine.ts`
- `src/lib/visual-engine/index.ts`

### Visual UI Components
- `src/components/visual/visual-content.tsx`
- `src/components/visual/diagram-renderer.tsx`
- `src/components/visual/mermaid-diagram.tsx`
- `src/components/visual/image-viewer.tsx`

### New Konva Diagram Renderers
- `src/components/quiz/diagrams/geometry.tsx`
- `src/components/quiz/diagrams/chart.tsx`
- `src/components/quiz/diagrams/chemistry.tsx`
- `src/components/quiz/diagrams/graph.tsx`

### API + Hooks
- `src/app/api/engine/visual/route.ts`
- `src/hooks/use-visual-engine.ts`

## Files to Modify (2 files)
- `src/components/quiz/question-card.tsx` — Insert `<VisualContent>` above question text
- `package.json` — Add `"mermaid": "^11"` dependency
