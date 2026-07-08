# Impeccable Critique → Triage Loop (Whole Codebase → Zero New Findings)

## Context

The user wants a continuous improvement loop: an **Agent 1 (Critique)** runs the
`impeccable` skill over the codebase, and an **Agent 2 (Triage)** reviews every
finding and, if it improves code / UI/UX / contrast / accessibility / performance /
frontend design, appends it to `TODO.md`. This repeats **until a full pass yields
zero new findings**.

Decisions already made with the user:

- **Scope:** Whole codebase (all of `src/`, ~1200+ TS/TSX files).
- **Stop rule:** Terminate when one complete sweep adds **zero new** entries to `TODO.md`.

### Environment constraints (important — read before executing)

1. **No sub-agent/Task tool is exposed** in this harness. The `impeccable` critique
   reference permits a `⚠️ DEGRADED: single-context (no sub-agent tool exposed)` run
   when this is the case. So "two agents" = **two sequential phases inside one agent**,
   not literally two spawned processes. Each critique pass MUST begin with the degraded
   banner per the skill's hard invariants.
2. **No browser automation** is available here, so viewable-target browser overlays
   cannot run. Assessment B falls back to the **deterministic `detect.mjs` CLI scan**
   (contrast + anti-patterns) plus static source review. Declare `browser visibility: fallback`.
3. The **loop only writes `TODO.md`** (and a small progress sidecar). It does **not**
   edit source files. "Clean" means "nothing new worth logging," achieved by
   de-duplication (see Stop Rule).

## The Loop (per iteration)

```
for each batch in BATCH_ORDER:
    PHASE 1 — CRITIQUE (Agent 1 role)
        emit: "⚠️ DEGRADED: single-context (no sub-agent tool exposed)"
        Assessment A (design/code review): read batch files; score the audit
            5 dimensions — Accessibility, Performance, Theming, Responsive, Anti-Patterns
            (use impeccable/reference/audit.md criteria + heuristics from critique.md).
        Assessment B (deterministic): run
            node .agents/skills/impeccable/scripts/detect.mjs --json <batch>
            (exit 0 = clean, 2 = findings; reuse its JSON, don't rerun).
        Synthesize: list of candidate findings with file:line, category, severity (P0-P3).
    PHASE 2 — TRIAGE (Agent 2 role)
        for each finding:
            if it improves code/UI-UX/contrast/a11y/perf/frontend-design
               AND not already present in TODO.md (dedup):
                append a TODO.md entry (format below)
        record batch as done in progress sidecar
if last full sweep added 0 new entries → STOP (clean)
else → next iteration
```

## Batch Order (user-visible impact first; sub-batch large dirs)

1. `src/app` — routes/pages (split by route group if >500 scannable files)
2. `src/components` — UI components (split by subdir: quiz, dashboard, flashcard, tools, visual, navigation, ui)
3. `src/hooks`
4. `src/lib` — question-engine, visual-engine, services, sync, ai, tinyfish, db, shared, subjects, stt-engine, knowledge-graph, study-guide, caching-strategy, ably, rate-limiter
5. `src/types`, `src/context`, `src/store`, `src/app` config/`globals.css`, `next.config.ts`

Per `critique.md`: for trees >500 scannable files, **narrow scope** — process one
subtree at a time rather than the whole `src/` at once (avoids blowing context).

## TODO.md Entry Format

Add a new top-level section at the end of `TODO.md` (before nothing — append):

```
## 🔍 Impeccable Audit — <iteration>/<batch-label>  <!-- audit -->

- [ ] **<P?>: <short title>** <!-- linear-priority: N --> — <file:line> — <category>: <impact> → <recommendation>
```

- `linear-priority`: P0→1, P1→1, P2→2, P3→3 (matching repo convention).
- One line per finding; include `file:line`, `category` (a11y/perf/theming/responsive/anti-pattern/ui-ux), and a concrete fix.
- Group under a `### <batch-label>` sub-header per batch.

Do **not** run `pnpm run todo:sync` automatically inside the loop (would create many
Linear issues); note it as a manual follow-up.

## Progress Sidecar (resumability)

Write `.kilo/impeccable-audit-state.json`:

```json
{ "iteration": 1, "completedBatches": ["app"], "lastSweepNewCount": 42, "stopped": false }
```

Update after each batch. Lets the loop resume across sessions (token budget makes one
session for 1200 files impractical — this is expected and intended).

## Stop Rule (termination — how "zero new findings" is defined)

A finding is **new** only if no semantically-equivalent entry already exists in
`TODO.md` (match on `file:line` + issue). After the **first full sweep** logs all
current findings, every subsequent sweep re-discovers the same issues but they are
already present → `lastSweepNewCount === 0` → loop stops and sets `stopped: true`.
This guarantees termination without editing source.

## Validation Gate

- `detect.mjs` and static review are **read-only**; no source edits, so no regression risk.
- After the loop, optionally run `pnpm run typecheck` + `pnpm exec oxlint` to confirm
  `TODO.md` edits (markdown only) didn't disturb anything (they won't).

## Risks / Caveats

- **Token budget:** A truly "whole codebase in one session" critique is not feasible in
  a single turn. The sidecar makes it resumable; expect multiple sessions.
- **False positives:** `detect.mjs` may flag generated/third-party or intentionally
  themed code. Triage must verify impact before logging (per audit.md "NEVER report
  false positives without verification").
- **Subjectivity:** Assessment A is single-context (degraded) — be specific, cite
  `file:line`, avoid generic "consider exploring" language per the skill.

## Open Questions (none blocking)

- None. Scope and stop rule are confirmed. Execution proceeds as a resumable
  single-agent two-phase loop.
