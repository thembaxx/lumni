# Plan 176: Add TTS to Study Guides, Dictionary, Stories, and Review

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/app/[locale]/study-guide/ src/components/dictionary/ src/app/[locale]/stories/ src/app/[locale]/review/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The `TTSButton` component and `VoiceEngine` (ElevenLabs → Google Cloud TTS → FreeTTS, supporting af-ZA, zu-ZA, en-ZA) are only placed on quiz cards and flashcards. Study guides, dictionary definitions, story text, and wrong-answer explanations — all rich text content — have no TTS. Auditory learners can't hear content read aloud in their preferred language. Each placement is a single component import.

## Current state

`TTSButton` at `src/components/shared/tts-button.tsx` is imported in 5 files, all in quiz/flashcard contexts. Zero imports in study-guide, dictionary, stories, or review pages.

The `TTSButton` accepts a `text` prop and optionally a `lang` prop. Usage: `<TTSButton text="Content to read aloud" />`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- Study guide content component — add TTSButton to section headers or content
- Dictionary definition view — add TTSButton to each definition
- Story reader — add TTSButton to story content header
- Review page (wrong-answer explanations) — add TTSButton to explanation blocks

**Out of scope**:

- The TTSButton component itself
- VoiceEngine internals

## Steps

### Step 1: Add TTS to study guide content

Find the component that renders study guide sections (likely `src/app/[locale]/study-guide/study-guide-content.tsx`). Import `TTSButton` from `@/components/shared/tts-button` and place it next to each section's content or at the top of the page.

### Step 2: Add TTS to dictionary definitions

Find the dictionary definition card/view (likely in `src/components/dictionary/`). Import `TTSButton` and place it on each definition card, using the word text as the TTS input.

### Step 3: Add TTS to story reader

In the story reader component, import `TTSButton` and place it in the story content header, with the story text as input.

### Step 4: Add TTS to wrong-answer explanations on review page

In the review page (likely `src/app/[locale]/review/`), find the wrong-answer explanation block. Import `TTSButton` and place it next to each explanation.

### Step 5: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

No new tests needed — the TTSButton is already tested. Visual tests would be ideal but are out of scope.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `TTSButton` is imported and rendered in study guide, dictionary, stories, and review
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the target pages don't have a suitable content component to add TTSButton to
- The TTSButton component doesn't accept the expected props (check its current signature first)
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

Each TTSButton placement is a single import + JSX element. If the VoiceEngine gains streaming support in the future, the TTSButton will automatically benefit — no per-placement changes needed.
