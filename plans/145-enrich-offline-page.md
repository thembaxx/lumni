# Plan 145: Enrich offline page with cached-content summary

> **Executor instructions**: Follow this plan step by step. Run every verification command.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/app/[locale]/_offline/ src/app/offline/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

The offline page (`src/app/[locale]/_offline/page.tsx`) shows a generic "You're offline" message with links to `/dashboard` and `/quiz`. The app has 35+ Dexie tables with thousands of cached records — flashcards, questions, study guides, past papers — but surfaces none of this. Students don't know what study material is available offline.

## Current state

The offline page is ~53 lines, shows:

- Generic "You're offline" heading
- Brief description
- Two navigation links

No Dexie query, no cache summary, no pending sync status.

## Steps

### Step 1: Add Dexie count queries

Import `dexieDataAccess` (or `useLiveQuery`) and count records in key offline tables:

- `questions` (cached quiz questions)
- `flashcards` (spaced repetition cards)
- `studyGuides` (generated study guides)
- `quizPacks` (offline quiz packs)
- `wrongAnswers` (wrong answer journal)

Create a `useOfflineStats()` hook that returns `{ questions: number, flashcards: number, guides: number, packs: number }`.

### Step 2: Add UI cards showing cached content

Below the "You're offline" message, add a grid of stat cards:

- "X questions available offline"
- "X flashcards to review"
- "X study guides"
- "X offline quiz packs"

Each card shows a count and a link to the relevant page.

### Step 3: Add pending sync indicator

Query the `syncOutbox` table to show "X changes pending sync" when the user comes back online.

**Verify**: `pnpm run typecheck` → 0 errors

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] Offline page shows cached-content summary from Dexie
- [ ] At least 3 content type cards rendered
- [ ] Pending sync count shown when applicable
