# Plan 092: Reconcile roadmap docs + mark plan 074 done

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> and plan 074 in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d4ba0811..HEAD -- docs/roadmap.md ROADMAP.md plans/074-roadmap-reconciliation.md`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

Two docs issues: `docs/roadmap.md` lists "Next Up" items that have already been shipped (shared subject maps, live leaderboard, cross-device sync, unified STT engine), making it misleading for anyone using the roadmap to plan work. Separately, `ROADMAP.md` says it's auto-generated from `docs/roadmap.md` but the two files have diverged — they contain different content. Plan 074 exists to fix exactly this but has been sitting TODO. Closing all three is a single edit pass.

## Current state

- `docs/roadmap.md:86-96` — "Next Up" lists 6 items: 8.1 Shared subject maps (DONE, plan 076), 8.2 Custom domain (still pending), 8.3 OCR PDF scraping (pending), 8.4 Live leaderboard (DONE, plan 080), 8.5 Cross-device sync (DONE, plan 081), 8.6 Unified STT engine (DONE, plan 084). Four of six are shipped.
- `ROADMAP.md:3` — "This roadmap is auto-generated from `docs/roadmap.md`" — but content is different from `docs/roadmap.md`
- `plans/074-roadmap-reconciliation.md` — TODO plan, never executed

## STOP conditions

- Either doc file has drifted significantly from the SHA — compare and reconcile first
- No shipped items have been un-shipped (obviously, but check)

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |

## Scope

**In scope**:

- `docs/roadmap.md` — update "Next Up" section to reflect shipped items
- `ROADMAP.md` — regenerate from `docs/roadmap.md` (or update inline if not truly generated)
- `plans/074-roadmap-reconciliation.md` — mark as superseded by this plan

**Out of scope**:

- Adding new roadmap items (that's product planning, not reconciliation)
- Changing any other doc
- Any feature work

## Steps

### Step 1: Read both roadmap files

Read `docs/roadmap.md` in full and `ROADMAP.md` in full. Identify the exact discrepancies.

### Step 2: Update `docs/roadmap.md`

In the "Next Up" section (lines ~86-96), move shipped items to a new subsection:

```markdown
### Recently Shipped

- **8.1** Shared subject color/abbreviation maps (Session 50)
- **8.4** Live leaderboard (WIP)
- **8.5** Cross-device sync — Phase A (Session 50)
- **8.6** Unified STT engine (Session 50)

### Next Up

- **8.2** Custom domain + production deployment → Plan 087 (partial)
- **8.3** OCR-based PDF timetable scraping
- **8.7** [new item] — Effect TS: adopt or abandon → Plan 095
```

Keep items 8.2 and 8.3 untouched. Update the version/timestamp line at the top of the file.

### Step 3: Update `ROADMAP.md`

If truly auto-generated: run the generation command (find it first — check `package.json` scripts). If it's manually maintained: update it to match `docs/roadmap.md` by hand and fix the "auto-generated" comment.

### Step 4: Mark plan 074 as superseded

In `plans/074-roadmap-reconciliation.md`, add a note at the top:

```markdown
> **Superseded by Plan 092** (2026-07-05). The reconciliation described in this
> plan has been executed as part of Plan 092's scope. See Plan 092 for the
> actual changes.
```

### Step 5: Verify

Run `pnpm run typecheck` — 0 errors. Read both roadmap files to confirm they're consistent.

## Verification

1. `docs/roadmap.md` "Next Up" no longer claims shipped items as pending
2. Shipped items appear in a "Recently Shipped" section
3. `ROADMAP.md` content matches `docs/roadmap.md`
4. Plan 074 marked as superseded
