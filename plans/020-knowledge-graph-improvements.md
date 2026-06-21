# Plan 020: Knowledge Graph Improvements

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: improvement
- **Planned at**: commit after `016-stories-content`, 2026-06-21

## Why this matters

The knowledge graph has three bugs and missing features that make it less useful:
1. **Curriculum graph classification bug**: Topics with prerequisites but no dependents are classified as "prerequisite" (starting point) when they should be "advanced" (endpoint). This inverts the visual hierarchy.
2. **Edge relations all "requires"**: Curriculum graphs only create `"requires"` edges, but `PathEngine.getAdvancedFromGraph()` filters on `"leads_to"` — so path traversal never finds curriculum-generated edges.
3. **Hardcoded first-subject**: `LearningMapCard` always shows the first enrolled subject with no way to switch.

## Scope

**In scope**:
- `src/lib/knowledge-graph/curriculum-graph.ts` — fix classification bug + edge relations
- `src/components/dashboard/learning-map-card.tsx` — add subject selector
- `src/lib/knowledge-graph/service.test.ts` — add tests for curriculum graph

**Out of scope**:
- SVG layout improvements (separate effort)
- AI graph generation changes
- Graph caching changes

## Steps

### Step 1: Fix curriculum graph classification bug

In `curriculum-graph.ts`, the `classifyTopic()` function at line ~20:

Current (broken):
```typescript
if (hasPrereqs && !hasDependents) return "prerequisite";
if (!hasPrereqs && hasDependents) return "advanced";
```

Fixed:
```typescript
if (hasPrereqs && !hasDependents) return "advanced";   // leaf node
if (!hasPrereqs && hasDependents) return "prerequisite"; // starting node
```

A topic with prerequisites but no dependents is an endpoint (advanced). A topic with dependents but no prerequisites is a starting point (prerequisite).

### Step 2: Fix edge relations in curriculum graph

In `curriculum-graph.ts`, change edge creation to use `"leads_to"` for forward edges:

Current:
```typescript
edges.push({ from: prereq.id, to: topic.id, relation: "requires" });
```

Fixed:
```typescript
edges.push({ from: prereq.id, to: topic.id, relation: "leads_to" });
```

This allows `PathEngine.getAdvancedFromGraph()` to traverse curriculum-generated edges.

### Step 3: Add subject selector to LearningMapCard

In `learning-map-card.tsx`:
- Add a `<Select>` dropdown showing all enrolled subjects
- Store selected subject in local state
- Re-fetch graph when subject changes
- Default to first enrolled subject (current behavior)
- Style: small select in card header, right-aligned

### Step 4: Add curriculum graph tests

New tests in `src/lib/knowledge-graph/__tests__/curriculum-graph.test.ts`:

- Classifies topic with prereqs only as "advanced"
- Classifies topic with dependents only as "prerequisite"
- Classifies topic with both as "core"
- Classifies topic with neither as "core"
- Creates edges with "leads_to" relation
- Focus topic marked as "core"
- Handles empty curriculum
- Handles single-topic curriculum

### Step 5: Verification

```bash
npx tsc --noEmit
npx biome check src/lib/knowledge-graph/ src/components/dashboard/learning-map-card.tsx
bun run test
```

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0 (no regressions)
- [ ] Topics with prereqs but no dependents show as "advanced" (bottom layer)
- [ ] Curriculum edges use "leads_to" relation
- [ ] LearningMapCard has a subject selector dropdown
- [ ] `plans/README.md` status row updated

## STOP conditions

- `classifyTopic()` logic is more complex than described (check full function)
- Subject selector breaks dashboard layout
- Edge relation change breaks PathEngine traversal
