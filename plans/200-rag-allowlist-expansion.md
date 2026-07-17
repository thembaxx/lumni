# Plan 200: Expand RAG allowlist to all subjects

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Issue**: (none)

## Why this matters

TinyFish RAG is currently limited to 24 subjects via the allowlist in `src/lib/tinyfish/allowlist.ts`. Subjects like Engineering Graphics & Design, Music, Tourism, Hospitality Studies, and 14 others are off-grid — they always get `emptyRagContext()` even though the RAG architecture (web search → chunk → embed → retrieve) is completely subject-agnostic. Expanding the allowlist is a configuration change: adding their slug IDs to the set. No code changes needed in the search, cache, or prompt injection layers.

## Current state

- `src/lib/tinyfish/allowlist.ts` — `ALLOWLISTED_SUBJECTS: Set<string>` with 24 subjects
- Off-grid subjects get `emptyRagContext()` — no web grounding, no source citations
- RAG pipeline (`src/lib/tinyfish/rag-pipeline.ts`) is fully subject-agnostic — the allowlist is the only gate
- Subject slugs are defined in `src/lib/subjects/categories.ts` and `src/lib/exam-dates/subject-maps.ts`

## Steps

### Step 1: Identify all missing subjects

Read `src/lib/subjects/categories.ts` or `src/lib/exam-dates/subject-maps.ts` for the full list of subject slugs. Compare against `ALLOWLISTED_SUBJECTS` in `src/lib/tinyfish/allowlist.ts`.

Current off-grid subjects (likely): CAT, IT, EGD, Music, Visual Arts, Design, Dance Studies, Dramatic Arts, Tourism, Hospitality Studies, Consumer Studies, Religion Studies, Agricultural Sciences, Agricultural Tech, Agricultural Management, Maritime Economics, Sport & Exercise Science, Nautical Science, equestrian, aviation.

### Step 2: Add missing subjects to allowlist

In `src/lib/tinyfish/allowlist.ts`, add the missing slugs to the `ALLOWLISTED_SUBJECTS` Set. No other file changes needed.

### Step 3: Verify

```bash
pnpm typecheck
pnpm exec biome check
pnpm test
```

## Test plan

The existing allowlist tests in `src/lib/tinyfish/__tests__/allowlist.test.ts` already cover:

- Allowlisted subject returns search results
- Non-allowlisted subject returns emptyRagContext
- Case-insensitive matching

Update the test to verify a few newly-added subjects return non-empty results (or at minimum pass through the allowlist gate).

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] All 38+ subjects are on the RAG allowlist
- [ ] `plans/README.md` status row updated

## STOP conditions

(Unlikely — configuration change only)

## Maintenance notes

- RAG quality varies by subject: Mathematics and Sciences have rich web content; niche subjects (Equestrian Studies, Maritime Economics) may return thin results. The system already degrades gracefully — `searchWithRAG` returns empty context when search finds nothing, and the prompt falls through to AI-only generation.
- If a subject consistently returns thin results, consider adding curated seed URLs to its search config. For now, web search default is sufficient.
- Per-user daily usage limits apply uniformly across all subjects — expansion doesn't increase abuse surface.
