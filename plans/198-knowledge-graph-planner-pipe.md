# Plan 198: Pipe knowledge graph prerequisites into planner schedule

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Issue**: (none)

## Why this matters

The adaptive planner (Plan 193) schedules topics by inverse-competency weight — weakest topics get the most time. But it ignores prerequisite relationships. If "Calculus" depends on "Algebra" but Algebra is scheduled after Calculus, the student studies the harder topic first without foundation. The knowledge graph (`src/lib/knowledge-graph/`) already computes prerequisite/advanced edge relationships. This plan pipes those edges into the planner's `generateSessions()` step.

## Current state

- `src/lib/knowledge-graph/types.ts` — `KnowledgeEdge { sourceId, targetId, relationship: "prerequisite" | "advanced" | "corequisite" }`
- `src/lib/knowledge-graph/service.ts` — `fetchGraph(subject)` returns `{ nodes: KnowledgeNode[], edges: KnowledgeEdge[] }` (AI-generated, cached 7d in Dexie)
- `src/lib/study-planner/adaptive-planner.ts` — `detectWeakTopics()` returns weighted list; `generateSessions()` schedules by weight desc; no knowledge of edges
- Planner runs client-side via `useStudyPlanner()` hook → `StudyPlannerService.generateStudyPlan()`

## Steps

### Step 1: Add prerequisite sorting to adaptive planner

In `src/lib/study-planner/adaptive-planner.ts`:

1. After `detectWeakTopics()` returns the weighted topic list, add a new step:
   - Call `fetchGraph(subject)` from `@/lib/knowledge-graph/service`
   - Extract prerequisite edges (`relationship === "prerequisite"`)
   - Topological sort: if topic A is prerequisite for topic B, A must appear before B in the schedule
   - For cycles (rare in curriculum graphs), break ties by weight (heavier weight first)

2. The sort operates on the `topicId` field of `TopicWeight[]` — map topic IDs to knowledge graph node IDs (they should already match — both use slug-style IDs like "algebra", "calculus")

3. Add `graph?: Graph` as an optional dep: if `fetchGraph` fails or returns empty, fall through to the current weight-only sort (fail-open)

### Step 2: Handle out-of-graph topics

When a topic exists in `TopicWeight[]` but not in the knowledge graph (e.g., new or very specific subtopics):

- Append them after the sorted topics (preserving their original weight order)
- This ensures graph coverage improves incrementally — missing nodes don't break scheduling

### Step 3: Verify

```bash
pnpm typecheck
pnpm exec biome check
pnpm test
```

## Test plan

In `src/lib/study-planner/__tests__/adaptive-planner.test.ts`:

1. **Prerequisite ordering**: 4 topics (A, B, C, D) where A→B, C→D edges. Verify A before B, C before D in output.
2. **Weight tiebreak**: A→B with `weight(A) > weight(B)`. Verify A before B despite lower weight (prerequisite wins).
3. **Out-of-graph topics**: 2 graphed + 2 ungraphed. Verify graphed ones sorted by prerequisites first, ungraphed appended in weight order.
4. **Fail-open**: Mock `fetchGraph` to reject. Verify output matches weight-only sort (no crash).
5. **Cycle handling**: A→B, B→C, C→A. Verify no infinite loop; falls back to weight sort.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] Planner sequences topics so prerequisites appear before advanced topics
- [ ] Out-of-graph topics appended after sorted topics (graceful degradation)
- [ ] Knowledge graph fetch failure falls through to weight-only sort
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- `fetchGraph()` requires an AI call and may be slow in the client-side planner path — check if it's cached/Dexie-first in `service.ts`. If it always hits AI, the planner step may need a loading state or async boundary.
- The knowledge graph node IDs don't match planner topic IDs — check `src/lib/knowledge-graph/types.ts` for the node ID format vs the planner's topic keys. If they differ, add a mapping step.

## Maintenance notes

- This is a pure ordering algorithm — no new tables, no new API routes, no new UI. ~50 lines of logic.
- Future: surface prerequisite warnings in the planner UI ("We recommend studying Algebra before Calculus"). After this plan, the data exists to show these.
- The topological sort is on the client side (planner runs in browser from Dexie competencies). No server changes needed.
