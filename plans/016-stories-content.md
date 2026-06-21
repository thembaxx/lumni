# Plan 016: Populate stories content library for all 11 SA languages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/curriculum/stories/ src/lib/stories/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The stories feature has a complete pipeline (reader, comprehension questions, vocabulary extraction, TTS, story caching, AI question generation) but only 4 stories total: 1 English (28K-word anthology), 1 Afrikaans, 1 isiZulu, 1 isiXhosa — all marked "ai-generated". Seven of 11 official SA languages have zero content. Students landing on `/stories` see "No stories yet. Check back soon!" for most languages. This is the single largest content gap in the codebase.

## Current state

**`src/curriculum/stories/`**: Contains story JSON files and language-specific index files. Only 4 languages have content.

**`src/lib/stories/story-data.ts:5-21`**: Import maps for 4 languages only:
```typescript
const STORY_IMPORTS: Record<string, () => Promise<{ default: StoryMeta[] }>> = {
  english: () => import("@/curriculum/stories/english/index.json"),
  afrikaans: () => import("@/curriculum/stories/afrikaans/index.json"),
  "isi-zulu": () => import("@/curriculum/stories/isi-zulu/index.json"),
  "isi-xhosa": () => import("@/curriculum/stories/isi-xhosa/index.json"),
};
```

Missing: Sepedi, Setswana, Sesotho, Xitsonga, siSwati, Tshivenda.

**`ROADMAP.md:19-23`**: Promises "CC-BY stories from African Storybook across all 11 SA languages" and "AI-generate stories for curriculum topics not covered by existing sources" — undelivered.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check` on changed files | 0 errors |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/curriculum/stories/` — add story content for 7 missing languages
- `src/lib/stories/story-data.ts` — add import maps for new languages

**Out of scope**:
- `src/app/[locale]/stories/` — story reader already works
- Story comprehension question generation — already handled by AI

## Git workflow

- Branch: `advisor/016-stories-content`
- Commit: `feat: add story content for all 11 SA languages`

## Steps

### Step 1: Source CC-BY stories

Source stories from African Storybook (https://africanstorybook.org/) or similar CC-BY repositories for:
- Sepedi (Northern Sotho)
- Setswana
- Sesotho (Southern Sotho)
- Xitsonga
- siSwati
- Tshivenda

Each language needs 2-5 age-appropriate stories with:
- Title
- Content (200-2000 words)
- Language code
- Difficulty level (beginner/intermediate/advanced)

### Step 2: Create story JSON files

For each new language, create:
- `src/curriculum/stories/{language}/index.json` — `StoryMeta[]` array
- `src/curriculum/stories/{language}/{story-id}.json` — individual story content

Follow the exact format of existing stories (e.g., `src/curriculum/stories/afrikaans/`).

### Step 3: Add import maps

In `src/lib/stories/story-data.ts`, add entries for each new language:

```typescript
const STORY_IMPORTS: Record<string, () => Promise<{ default: StoryMeta[] }>> = {
  // ... existing entries ...
  sepedi: () => import("@/curriculum/stories/sepedi/index.json"),
  setswana: () => import("@/curriculum/stories/setswana/index.json"),
  sesotho: () => import("@/curriculum/stories/sesotho/index.json"),
  xitsonga: () => import("@/curriculum/stories/xitsonga/index.json"),
  siSwati: () => import("@/curriculum/stories/siSwati/index.json"),
  tshivenda: () => import("@/curriculum/stories/tshivenda/index.json"),
};
```

### Step 4: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/stories/story-data.ts
bun run test
```

## Test plan

- No code tests needed — this is content. Verify the import maps resolve correctly by checking the story reader loads stories for each new language.

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0
- [ ] `ls src/curriculum/stories/` shows directories for all 11 languages
- [ ] `grep -c "import" src/lib/stories/story-data.ts` returns 11 (or more)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- You cannot find CC-BY stories for a language (report which languages are missing).
- The story format doesn't match the existing JSON schema.
- The story reader crashes on new content (report the error).

## Maintenance notes

- This is primarily a content task, not a code task. The code infrastructure is complete.
- AI-generated stories are an acceptable fallback when CC-BY content is unavailable.
- Future: consider a story submission tool for native speakers.
