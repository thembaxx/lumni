# Plan 144: Update ROADMAP.md to match shipped features

> **Executor instructions**: Read ROADMAP.md, cross-reference with actual code, and update.
>
> **Drift check**: `git diff --stat 6c00cdcd..HEAD -- ROADMAP.md`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

ROADMAP.md lists Stories (D1), Dictionary (C2), Pronunciation (C1), and Vocabulary builder as unshipped. Code evidence shows all are built and shipped: `/stories` route with story library, `/dictionary` route with Wiktionary API, `/pronunciation` route with STT engine, `VocabularyListCard` on dashboard. Stale docs mislead everyone who reads them.

## Steps

### Step 1: Cross-reference ROADMAP items with code

Check each item listed as "not started" or "in progress" against actual code. Mark as "shipped" with session/commit reference for:

- Stories (D1) — shipped
- Dictionary (C2) — shipped
- Pronunciation (C1) — shipped
- Vocabulary builder — shipped

### Step 2: Update ROADMAP.md

Move shipped items to a "Shipped" section with dates. Keep the roadmap focused on what's actually ahead.

## Done criteria

- [ ] ROADMAP.md matches the shipped state of the codebase
- [ ] Shipped items clearly marked with completion context
