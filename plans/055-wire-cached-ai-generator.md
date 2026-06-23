# Plan 055: Wire CachedAIGenerator to visual-generation and hint-generation sites

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first:
> `git diff --stat 7525d6ed..HEAD -- src/lib/visual-engine/ src/lib/question-engine/processors/ src/lib/ai/cached-ai-generator.ts src/lib/ai/`

## Status

- **Priority**: P3
- **Effort**: S (per endpoint; this plan covers visual engine)
- **Risk**: LOW (pure add — existing code stays as fallback)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`CachedAIGenerator<T>` is a generic wrapper for Dexie-backed AI caching. Currently used by knowledge-graph, lesson, stories, and study-guide services (4 sites). Three more eligible sites call `getAI()` directly without caching: visual engine (`stem-renderer.ts`), hint factory (`processors/shared.ts`), and AI planner enricher. Adding caching to these means reduced AI costs on repeated prompts, faster responses, and offline capability — all for a 1-file change each.

## Current state

`src/lib/visual-engine/stem-renderer.ts:9-18`:

```typescript
export async function generateDiagram(
  questionText: string,
  subject: string,
  topic: string,
): Promise<VisualContent | null> {
  const prompt = getDiagramPrompt(questionText, subject, topic);
  const result = await getAI().generateWithSystem(prompt.system, prompt.user, {
    temperature: 0.7,
    maxTokens: 4096,
  });
  if ("available" in result && !result.available) return null;
  // ... parse result
}
```

Example of existing CachedAIGenerator usage (from `src/lib/knowledge-graph/service.ts`):

```typescript
const cachedGenerator = new CachedAIGenerator(
  {
    systemPrompt: "You are a curriculum expert...",
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    buildPrompt: (subject, topic) => `...`,
    parseResponse: (content) => JSON.parse(content),
    emptyResult: null,
    isEmpty: (r) => r === null,
    buildCacheKey: (s, t) => `knowledge-graph:${s}:${t}`,
    // ...
  },
  ai,
  db,
);
```

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/visual-engine/stem-renderer.ts` — wrap `generateDiagram` with caching

**Out of scope**:

- Hint factory (`processors/shared.ts`) — same pattern, defer
- AI planner enricher — same pattern, defer
- The `CachedAIGenerator` class itself
- Any test files

## Steps

### Step 1: Create a CachedAIGenerator visual config

In `stem-renderer.ts`, after the existing imports, create a cached generator config:

```typescript
import { CachedAIGenerator } from "@/lib/ai/cached-ai-generator";
import { getAI } from "@/lib/ai";
import { dexieDataAccess } from "@/lib/db";

const visualCache = new CachedAIGenerator<VisualContent | null>(
  {
    systemPrompt: "You are a diagram generation assistant...",
    ttlMs: 7 * 24 * 60 * 60 * 1000, // 7 day TTL (same as KnowledgeGraph)
    buildPrompt: (subject: string, topic: string) => {
      // The existing getDiagramPrompt logic
      return JSON.stringify({ subject, topic });
    },
    parseResponse: (content: string): VisualContent | null => {
      try {
        const raw = JSON.parse(cleanResponse(content));
        const mapping = classifyAndMap(raw);
        if (mapping.confidence === 0 && !mapping.mermaidCode) return null;
        return { diagramType: mapping.type, ...raw } as VisualContent;
      } catch {
        return null;
      }
    },
    emptyResult: null,
    isEmpty: (r) => r === null,
    buildCacheKey: (s: string, t: string) => `visual:${s}:${t}`,
    getTable: (db) => db.visuals,
    buildCacheEntry: (key, data, ttlMs, subject, topic) => ({
      /* ... */
    }),
    extractData: (cached) => cached as VisualContent | null,
    errorLabel: "VisualCache",
  },
  getAI(),
  dexieDataAccess,
);
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Wire it into generateDiagram

Wrap the existing `generateDiagram` to check cache first:

```typescript
export async function generateDiagram(questionText: string, subject: string, topic: string): Promise<VisualContent | null> {
  // Check cache first (cache keyed by subject+topic, not questionText)
  const cacheKey = `visual:${subject}:${topic}`;
  const cached = await visualCache.getCached(subject, topic);
  if (cached) return cached;

  // Existing AI generation (unchanged)
  const prompt = getDiagramPrompt(questionText, subject, topic);
  const result = await getAI().generateWithSystem(prompt.system, prompt.user, {
    temperature: 0.7,
    maxTokens: 4096,
  });
  // ... (existing parse logic)

  // After successful generation, cache the result
  const visual = /* parsed result */;
  await visualCache.store(subject, topic, visual);
  return visual;
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Run tests

```bash
pnpm run test
```

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `generateDiagram()` checks cache before calling AI
- [ ] Successful AI results are cached via `visualCache.store()`
- [ ] `plans/README.md` status row updated

## Maintenance notes

- The cache key uses `subject+topic` rather than `questionText` — this means identical subject+topic pairs share cached visuals. If question-specific visuals are needed, the key can include a question hash.
- TTL matches the KnowledgeGraph pattern (7 days). Tune if visual content changes more frequently.
