# Batch 3 — Network / Public Design

## 3.3 Public RAG Questions

### Problem

Public share pages (`/q/[id]`) currently lack the RAG-grounded source citations that the quiz flow has.

### Solution

- When sharing a question via `POST /api/q/share`, run `getSourceForQuestion()` from TinyFish to fetch RAG sources
- Attach the sources to the `SharedQuestionRecord` as `sources: { url, title }[]`
- On the public page (`/q/[id]`), render `<VerifiedByPill>` when sources are available
- API wire shape stays the same: `{ url, title }[]` only

### Edge cases

- RAG fetch is fire-and-forget — if it fails or times out (3s), share proceeds without sources
- Sources are persisted in the shared question data (not live-fetched on view)

### Files

- Modify: `src/app/api/q/share/route.ts` — call `getSourceForQuestion` after creating share record
- Modify: `src/lib/share/share-service.ts` — accept optional sources on `shareQuestion()`
- Modify: `src/lib/db/schema.ts` — add `sources?` to `SharedQuestionRecord`
- Modify: `src/app/q/[id]/page.tsx` — render `<VerifiedByPill sources={...} />`

---

## 3.4 Search-in-Chunks

### Problem

The existing `searchAll()` function (`src/lib/search/`) loads all Dexie data into memory for full-text search. For large data sets this is slow.

### Solution

Implement chunked search: break search into independent Dexie table queries run in parallel, each limited to the top N results.

### Design

- Create `src/lib/search/chunked-search.ts`
- Query all searchable Dexie tables in parallel:
  - `questions` — search subject + topic + question text
  - `notes` — search title + content
  - `flashcards` — search front + back
  - `wrongAnswers` — search question text
- Each query: `table.filter(item => item.field.toLowerCase().includes(query.toLowerCase())).limit(10).toArray()`
- Merge results sorted by relevance (exact matches first, then prefix, then substring)
- Return `SearchResult[]` with `{ id, type, title, snippet, source }`
- Preserve the existing `SearchWidget` and `SearchResults` UI — just swap the backend

### Chunk sizes

- Per-table limit: 10 results
- Total max: 50 results
- Timeout per table: 500ms (skip if slow)

### Files

- New: `src/lib/search/chunked-search.ts`
- Modify: `src/lib/search/index.ts` — re-export chunked search, deprecate old `searchAll`
- Modify: `src/hooks/use-search.ts` — use chunked search
- Tests: verify parallel execution, timeout handling, result merging

---

## 3.7 B2B2C Ghost Dashboard

### Scope

A lightweight read-only dashboard for school administrators. No login required — accessed via a secret shareable link with a token.

### Design

- School admin generates a "ghost link" from their teacher dashboard: `POST /api/teacher/ghost-link`
- Returns a token with 30-day expiry
- Public page at `/ghost/[token]` shows aggregate read-only stats:
  - Total students linked
  - Per-subject enrollment counts
  - Average competency scores per subject
  - Overall quiz completion rate
- No interactive features — purely informational
- Data sourced from the teacher's existing Dexie/Appwrite data via a server-side aggregation route

### Security

- Token is a random UUID, stored in Appwrite `ghost_links` collection
- Token grants read-only access to aggregate stats only (no student names or PII)
- Admin can revoke tokens from teacher dashboard

### Files

- New: `src/app/api/teacher/ghost-link/route.ts` — create/revoke tokens
- New: `src/app/api/ghost/[token]/route.ts` — serve aggregate stats
- New: `src/app/ghost/[token]/page.tsx` — public ghost dashboard
- Modify: `src/components/teacher/class-shell.tsx` — add "Ghost Link" button
- Modify: `src/lib/db/client.ts` — add `GHOST_LINKS` collection
- Modify: `src/lib/db/ensure-schema.ts` — add collection schema

## Verification

- `npx tsc --noEmit` — zero errors
- `npx biome check` — zero errors
