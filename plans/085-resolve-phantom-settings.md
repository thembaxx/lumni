# Plan 085: Resolve phantom settings — Beta toggles + Session Timer

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/components/settings/tabs/beta-tab.tsx src/components/settings/tabs/study-tab.tsx src/lib/utils/storage.ts src/lib/db/settings-migrator.ts`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

Lumni has 4 UI settings that do nothing: 3 Beta toggles (AI Study Tutor, Voice Practice, Exam Paper Analysis) and a Session Timer (toggle + duration input). They're persisted to Dexie but zero code paths check them. Users who toggle these features see no change in behavior — the UI lies to them. This erodes trust (especially for stressed students who may think they've enabled a feature) and wastes developer attention on dead code that must be maintained through schema migrations.

The Beta tab is particularly misleading: "AI Study Tutor" and "Voice Practice" are full features that already exist in the app (AI tutor in chat/quiz, voice practice in pronunciation). The tab implies they're experimental or gated, which they aren't — they're just always on.

## Current state

- `src/components/settings/tabs/beta-tab.tsx:10-37` — 3 `LabelledSwitch` components for `aiTutor`, `voicePractice`, `examPaperAnalysis`. Persisted via `betaFeatures` prop → `DexieStorage` (v31 schema `srDailyBudget` table).
- `src/components/settings/tabs/study-tab.tsx:85-110` — Session Timer `LabelledSwitch` + conditional `NumberInput` for minutes. Persisted via `studyPrefs.timerEnabled` + `timerDuration`.
- `src/lib/utils/storage.ts:29-44` — `timerEnabled: boolean`, `timerDuration: number` in `StudyPreferences` type. Defaults: `true`, `30`.
- `src/lib/db/settings-migrator.ts:68` — migration from onboarding data: `stored.timerDuration = onboarding.dailyStudyMinutes * 60`.
- Zero consumers of any of these 4 values outside settings — confirmed by grep.

## STOP conditions

- Removing a setting that has a real consumer (verify with `grep -r "betaFeatures\."` and `grep -r "timerEnabled\|timerDuration"` excluding settings files)
- The `DexieStorage` or settings-migrator schema needs updating (S effort — handled in scope)

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test`                 | all pass            |
| Lint      | `pnpm exec biome check --write` | exit 0              |

## Scope

**Approach**: Remove the 4 phantom settings and their backing schema fields. Do not replace with real functionality.

**In scope**:

- `src/components/settings/tabs/beta-tab.tsx` — delete the file entirely. Remove its import and `case "beta"` from `settings-client.tsx`.
- `src/components/settings/tabs/study-tab.tsx` — remove the Session Timer section (lines 82-110) and the `timerEnabled`/`timerDuration` import/type usage.
- `src/lib/utils/storage.ts` — remove `timerEnabled: boolean` and `timerDuration: number` from `StudyPreferences` type and defaults.
- `src/lib/db/settings-migrator.ts` — remove the timer migration line.
- `src/lib/db/schema.ts` — no schema change needed (settings are in a JSON blob, not indexed columns; stale fields are harmless).

**Out of scope**:

- Adding real implementations for any of the 3 Beta features (AI Tutor, Voice Practice, Exam Paper Analysis already work; they were never gated)
- Adding a replacement UI element or section

## Steps

### Step 1: Delete beta-tab.tsx

Remove `src/components/settings/tabs/beta-tab.tsx`. Remove its import from wherever it's registered (grep for `BetaTab` and `beta-tab`).

### Step 2: Remove Beta tab from settings-client.tsx

Read `src/app/[locale]/settings/settings-client.tsx`. Find the `"beta"` case in the tab switch and the `betaFeatures` prop threading. Remove both.

### Step 3: Remove Session Timer from study-tab.tsx

Open `src/components/settings/tabs/study-tab.tsx`. Remove the `timerEnabled` `LabelledSwitch` block and the conditional `NumberInput` (lines ~82-110). Leave all other study preferences intact.

### Step 4: Remove timer fields from storage types

Open `src/lib/utils/storage.ts`. Remove `timerEnabled: boolean` and `timerDuration: number` from the `StudyPreferences` interface and the defaults object.

### Step 5: Remove timer migration

Open `src/lib/db/settings-migrator.ts`. Remove the line that sets `stored.timerDuration = ...`.

### Step 6: Typecheck + tests

Run `pnpm run typecheck` — 0 errors. Run `pnpm run test` — all pass. Run `pnpm exec biome check --write` — 0 errors on changed files.

## Verification

1. Settings page renders without "Beta" tab
2. Study Settings tab no longer shows Session Timer
3. `betaFeatures` references are gone from the codebase (grep returns 0)
4. `timerEnabled`/`timerDuration` only remain in user's Dexie blob (harmless stale data, not indexed)
