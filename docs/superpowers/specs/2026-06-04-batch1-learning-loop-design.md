# Batch 1 — Learning Loop Design

## 1.7 Knowledge-Graph Retrieval

### Source
AI-generated on-demand, cached in Dexie with 7-day TTL. Uses existing AI provider chain (Gemini → Nvidia → Groq).

### API
```
POST /api/engine/knowledge-graph
Body: { subject: string; topic: string }
Response: { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] }
```

### Dexie v29
New `knowledgeGraph` table: `&key` (subject:topic), `graph`, `createdAt`, `expiresAt`.

### UI — Two surfaces

**Dashboard card** (`<LearningMapCard>`)
- Positioned in the dashboard grid (after TodayFocusCard)
- Shows an SVG-based topic graph: nodes arranged in rows (prerequisite → core → advanced), connected by curved edges
- Scrollable container with pinch-zoom via CSS `scale()` on a wrapper div
- Uses cached graphs, fetches missing ones
- Click a node → navigate to quiz for that topic

**Per-topic mini-graph** (`<TopicGraph>`)
- Rendered in quiz topic header and study topic page
- Shows local subgraph: prerequisites → current topic → downstream topics (3-hop max)
- Compact, inline, scrollable

### AI Prompt
Prompt asks the model to return JSON matching the `KnowledgeGraph` schema:
```typescript
interface KnowledgeGraph {
  nodes: { id: string; label: string; type: "prerequisite" | "core" | "advanced" }[];
  edges: { from: string; to: string; relation: string }[];
}
```

### Cache Flow
1. Check Dexie `knowledgeGraph` for `subject:topic` key
2. If valid (within TTL), return cached
3. If missing/expired, call AI provider, store in Dexie, return

### Files
- New: `src/lib/knowledge-graph/service.ts` — `fetchGraph()`, `getCachedGraph()`, `storeGraph()`
- New: `src/lib/knowledge-graph/types.ts`
- New: `src/components/dashboard/learning-map-card.tsx` — dashboard card
- New: `src/components/quiz/topic-graph.tsx` — per-topic mini-graph
- New: `src/app/api/engine/knowledge-graph/route.ts`
- Modify: `src/lib/db/schema.ts` — Dexie v29 with `knowledgeGraph`

---

## 1.8 Content-Locking States

### Component: `<ContentLock>`
A reusable shadcn-style composition for gating premium features behind a blurred preview.

### API
```tsx
<ContentLock feature="offline-quiz-packs">
  <ContentLockPreview>
    <p className="text-muted-foreground">Offline Quiz Packs</p>
  </ContentLockPreview>
  <ContentLockUpgrade>
    <p>Upgrade to Premium to generate offline quiz packs.</p>
    <Button>Upgrade</Button>
  </ContentLockUpgrade>
</ContentLock>
```

### Behavior
- Uses `usePremium().hasFeature(feature)` 
- If feature available → renders `children` directly (no wrapper)
- If not → renders `<ContentLockPreview>` (blurred/shimmered) + `<ContentLockUpgrade>` (CTA overlay)
- Backdrop blur + reduced opacity on preview content
- Upgrade button navigates to `/premium`

### Migration
Replace inline `hasFeature` early-return gates in:
- `ProblemsClient` (problem-library)
- `OfflinePackManager` (offline-quiz-packs)
- `useVisualEngine` (visual-engine)
- `exam-engine` (exam-simulator)
- `analytics-panel` + `comparative-analytics-panel` (advanced-analytics)
- `study-plan-overview` + `smart-scheduler` (custom-study-plans)

### Files
- New: `src/components/ui/content-lock.tsx` — ContentLock + ContentLockPreview + ContentLockUpgrade
- Modify: 8 components listed above

---

## 1.9 Analytics-Driven Item-Bank Pruning

### Background Job
New job type `"prune-stale-questions"` in the job processor.

### Behavior
1. Query Dexie `questions` table for records where `createdAt < 30 days ago` AND (`ratingCount` IS NULL OR `ratingCount` = 0)
2. Soft-delete: set `pruned: true` flag on each matching question
3. Log count of pruned questions
4. Runs on a schedule (triggered by quiz generation — no cron dependency)

### Trigger
Enqueued after every successful quiz generation (`POST /api/engine/generate`). A guard ensures the job only runs once per day per user (checks `lastPruned` timestamp in localStorage). Low priority (`10`).

### Configuration
```typescript
const PRUNE_CONFIG = {
  maxAgeDays: 30,
  minRatingCount: 0,  // pruned if ratingCount <= this
  jobPriority: 10,     // low priority
};
```

### Schema
No new Dexie table needed. Add `pruned?: boolean` field to the existing `Question` type and Dexie question tables.

### Files
- Modify: `src/lib/question-engine/types.ts` — add `pruned?: boolean` to `Question`
- Modify: `src/lib/orchestrator/job-processor.ts` — add `prune-stale-questions` handler
- Modify: `src/lib/question-engine/engine.ts` — filter out pruned questions in queries

---

## Verification

- `npx tsc --noEmit` — zero errors
- `npx biome check` — zero errors
- `bun test` — no regressions
