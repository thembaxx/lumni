# Plan 075: Expand TinyFish RAG Coverage to All 44 Curriculum Subjects

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 53532ff1..HEAD -- src/lib/tinyfish/allowlist.ts src/lib/tinyfish/ src/curriculum/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Category**: direction
- **Depends on**: none
- **Planned at**: commit `53532ff1`, 2026-07-02

## Why this matters

Currently only 17 of 44 CAPS subjects have TinyFish RAG grounding. When a student generates questions for Life Orientation (compulsory for ALL Matric students), Computer Applications Technology (massive enrollment), Civil Technology, Tourism, or any Arts subject, the AI prompt gets zero web-sourced context — no `<reference_material>` block, no citations. This produces lower-quality questions with no sources. The curriculum JSON files for all 44 subjects already exist in `src/curriculum/` and are eagerly loadable. This plan expands the allowlist to cover all 44, adjusts the daily limit, and runs a QA pass on search quality for the newly covered domains.

## Current state

The allowlist in `src/lib/tinyfish/allowlist.ts:3-28` has 28 entries covering 17 subject groupings:

```ts
export const ALLOWED_SUBJECTS: readonly string[] = [
  "mathematics",
  "mathematical-literacy",
  "technical-mathematics",
  "physical-sciences",
  "technical-sciences",
  "life-sciences",
  "agricultural-sciences",
  "agricultural-management-practices",
  "agricultural-technology",
  "geography",
  "history",
  "accounting",
  "economics",
  "business-studies",
  "english-home-language",
  "english-first-additional-language",
  "afrikaans-home-language",
  "afrikaans-first-additional-language",
  "isi-zulu-home-language",
  "isi-zulu-first-additional-language",
  "isi-xhosa-home-language",
  "isi-xhosa-first-additional-language",
  "sepedi-home-language",
  "sesotho-home-language",
];
```

The curriculum registry at `src/curriculum/index.ts` has 44 subjects registered (lines 7-176), including Life Orientation, CAT, IT, Civil/Electrical/Mechanical Technology, Engineering Graphics & Design, Consumer Studies, Hospitality Studies, Tourism, Dance Studies, Dramatic Arts, Music, Visual Arts, Design, Religion Studies, and all remaining African language variants.

The curriculum file `src/curriculum/life-orientation.json` has full topic/subtopic structure with bloom targets.

The per-user daily limit is set at `PER_USER_DAILY_LIMIT = 20` in `allowlist.ts:73`.

**Repo conventions to follow**:
- Array entries are alphabetical in `ALLOWED_SUBJECTS` — insert new entries in correct alphabetical position
- All subject IDs use kebab-case matching the curriculum JSON filenames
- Error handling uses `logError()` from `@/lib/shared/logger` — match existing pattern
- Tests use DI pattern with `__setDepsForTesting()` — see existing test at `src/lib/tinyfish/__tests__/allowlist.test.ts`

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|--------------------------------|---------------------|
| Typecheck | `pnpm run typecheck`           | exit 0, no errors   |
| Tests     | `vitest run src/lib/tinyfish/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`       | exit 0              |

## Scope

**In scope**:
- `src/lib/tinyfish/allowlist.ts` — expand `ALLOWED_SUBJECTS` to all 44 subjects
- `src/lib/tinyfish/__tests__/allowlist.test.ts` — update tests to cover new subjects

**Out of scope**:
- Do NOT change any other TinyFish module (client, cache, wrap, rag-pipeline)
- Do NOT add new search sources or adjust per-domain blocking
- Do NOT modify curriculum JSON files
- Do NOT change Dexie schema or TTL values

## Steps

### Step 1: Expand `ALLOWED_SUBJECTS` to all 44 subjects

Add the following missing subject IDs to `ALLOWED_SUBJECTS` in correct alphabetical position:

- `civil-technology`
- `computer-applications-technology`
- `consumer-studies`
- `dance-studies`
- `design`
- `dramatic-arts`
- `electrical-technology`
- `engineering-graphics-and-design`
- `hospitality-studies`
- `information-technology`
- `isi-ndebele-home-language`
- `life-orientation`
- `mechanical-technology`
- `music`
- `religion-studies`
- `sepedi-first-additional-language`
- `sesotho-first-additional-language`
- `setswana-first-additional-language`
- `setswana-home-language`
- `si-swati-home-language`
- `tourism`
- `tshivenda-home-language`
- `visual-arts`
- `xitsonga-home-language`

**Verify**: Read the file and confirm `ALLOWED_SUBJECTS.length` is now 52 (28 original + 24 new). Run `pnpm run typecheck` → exit 0.

### Step 2: Evaluate the daily limit

The current `PER_USER_DAILY_LIMIT = 20` was set when only 17 subject groups were covered. With 44 subjects, a power user studying 3 subjects could exhaust the limit quickly. If there is budget headroom, increase to 40 or 60. Read `src/lib/tinyfish/allowlist.ts:73` and adjust if appropriate, adding a comment explaining the reasoning.

**Verify**: `rg 'PER_USER_DAILY_LIMIT' src/lib/tinyfish/allowlist.ts` shows your chosen value.

### Step 3: Update allowlist tests

Add test cases for:
1. At least 3 newly added subjects return `true` from `isSubjectAllowed()` (e.g., `life-orientation`, `computer-applications-technology`, `tourism`)
2. A non-existent subject `"nonexistent-subject"` still returns `false`

Follow the existing `describe`/`it` pattern from the test file.

**Verify**: `vitest run src/lib/tinyfish/` → all pass, including new tests.

## Test plan

- Update `src/lib/tinyfish/__tests__/allowlist.test.ts`:
  - 3+ new `it` blocks testing `isSubjectAllowed()` on newly added subjects
  - 1 `it` block testing that unknown subjects return false
- **Verify**: `vitest run src/lib/tinyfish/` → exit 0

## Done criteria

- [ ] `ALLOWED_SUBJECTS.length === 52` (28 original + 24 new)
- [ ] `pnpm run typecheck` exits 0
- [ ] `vitest run src/lib/tinyfish/` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The curriculum registry has fewer or different subjects than described (stop and list actual subject IDs).
- The test file structure is completely different from the expected pattern.
- A newly added subject causes a search quality regression that is immediately apparent.

## Maintenance notes

- When new CAPS subjects are added, update the allowlist in the same PR. Add a comment near `ALLOWED_SUBJECTS`: `// Keep in sync with src/curriculum/index.ts`
- Monitor daily usage counts in `tinyfishUsage` table for the new subjects.
