> **Superseded by Plan 092** (2026-07-05). The reconciliation described in this
> plan has been executed as part of Plan 092's scope. See Plan 092 for the
> actual changes.

# Plan 074: Reconcile ROADMAP.md + docs/roadmap.md with shipped features

> **Executor instructions**: This is a **documentation reconciliation plan** — you are reading source code and comparing it to documentation to find gaps. Do not change source code. The output is corrected README files.

## Status

- **Priority**: P2 (Direction)
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction / documentation
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

Two roadmap files exist: `ROADMAP.md` at the repo root and `docs/roadmap.md`. Both claim to be the "single source of truth" for the product roadmap, but they have drifted:

1. Features shipped in Sessions 1–50 (AGENTS.md) are still listed as "upcoming" or "planned"
2. The two files may contradict each other on priorities
3. Some features described as "planned" were actually shipped months ago

## Current state

Two roadmap files:

- `ROADMAP.md` at root
- `docs/roadmap.md` in docs/

AGENTS.md has extensive session-by-session history of what's been shipped.

## Steps

### Step 1: Read both roadmap files

Read both `ROADMAP.md` and `docs/roadmap.md` completely. Take note of:

- Every feature/project listed as "planned", "upcoming", "todo", or in-progress
- Any priority/phase labels
- Dates if present

### Step 2: Cross-reference with AGENTS.md

For each item marked as "planned" in the roadmaps, search AGENTS.md (and the codebase with grep if needed) to determine if it was shipped. Items shipped include:

- Swipeable flashcard deck (Session 13)
- Full-screen quiz mode (Session 14)
- TinyFish RAG (Sessions 19-21)
- Daily Bolt simplification (Session 32)
- Knowledge graph (Session 25)
- Study guide generator (Session 28)
- Live study sessions with Ably (Sessions 28, 45)
- Calendar view (Session 29)
- i18n round 2 (Session 30)
- Storybook + visual tests (Sessions 30, 34)
- Knip + dead code analysis (Session 30)
- PWA titlebar theming (Session 41)
- WCAG a11y rounds (Sessions 22, 30-32, 44)
- Effect TS adoption (Session 46)
- Polyfill/compat cleanup (Session 47)
- Production hardening (Session 49)
- PDFSlick PDF viewer (Session 50+)
- Uniform AI adapter (Session 28)
- Redis rate limiter + caching strategy (Session 28)
- Search-in-chunks (Session 28)
- Quiz engine library + flashcard deck types (Session 28)
- Cross-engine integration: visual context in TTS (Session 42)

### Step 3: Categorize each roadmap item

For each item, determine one of:

- **SHIPPED** — Move to a "Shipped" or "Completed" section, with the session number
- **CURRENT** — Still relevant and in progress
- **DEFERRED** — Still relevant but lower priority than current focus
- **STALE** — No longer relevant; consider removing
- **DUP** — Duplicate of another item

### Step 4: Reconcile the two files

Pick one as the primary (recommend `docs/roadmap.md`) and deduplicate. Update the primary file to:

1. Add a "Completed" section with shipped items
2. Update remaining "planned" items to "current" or "deferred" with realistic timeframes
3. Remove stale items
4. Add a note at the top: "Last reconciled: 2026-06-29"
5. Have the secondary file (`ROADMAP.md`) reference the primary, or reconcile both

### Step 5: Update AGENTS.md convention note (optional)

If the roadmaps have a standard format (e.g., "Phase N" or "QN 2026"), add a brief convention note to AGENTS.md describing how future sessions should update the roadmap:

> **Roadmap format**: After shipping a feature listed in `docs/roadmap.md`, move it to the "Completed" section with the session number. Do not leave shipped items listed as "planned."

### Step 6: Verify

- Verify that all moved items actually exist in the codebase (grep for related imports, routes, or components).
- Read both files one final time to ensure consistency.

## Done criteria

- [ ] All shipped features are moved to a "Completed" section
- [ ] No shipped feature is still listed as "planned" or "upcoming"
- [ ] Stale items are removed (or clearly marked)
- [ ] `docs/roadmap.md` is the primary roadmap (or both files are consistent)
- [ ] Last-reconciled date is on both files
- [ ] AGENTS.md has a convention note about roadmap updates

## STOP conditions

- If the two roadmap files are already consistent — stop and report. No changes needed.
- If both roadmaps are already up-to-date with AGENTS.md — stop and report. The reconciliation is already done.
