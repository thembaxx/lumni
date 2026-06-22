# Plan 018: Stories TTS + Reading Progress Tracking

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: feature
- **Planned at**: commit after `016-stories-content`, 2026-06-21

## Why this matters

Stories have a complete content pipeline (11 languages, reader, comprehension questions, vocabulary) but zero audio support and zero reading progress tracking. Students cannot listen to stories or resume where they left off. TTS is the highest-impact missing feature — the infrastructure already exists (`ListenToLesson` component, `ttsService` singleton, `POST /api/tts` endpoint) but is not wired into stories.

## Scope

**In scope**:

- `src/app/[locale]/stories/[storyId]/story-reader-client.tsx` — add TTS listen button + reading progress indicator
- `src/components/stories/` — new `StoryProgressBar.tsx` component
- `src/lib/stories/types.ts` — no changes needed (`audioUrl` field exists)
- Dexie v37 — new `storyProgress` table for tracking read position + completion

**Out of scope**:

- Story content changes (already done in plan 016)
- Comprehension question improvements
- Vocabulary quiz mode

## Steps

### Step 1: Add reading progress Dexie table

Add `storyProgress` table to Dexie schema in `src/lib/db/schema.ts`:

```typescript
storyProgress: {
  id?: number;
  userId: string;
  storyId: string;
  scrollPercent: number;    // 0-100
  completed: boolean;
  lastReadAt: number;       // timestamp
  timeSpentSeconds: number;
}
```

Add compound index on `userId+storyId` for fast lookups.

### Step 2: Create StoryProgressBar component

New file: `src/components/stories/story-progress-bar.tsx`

- Thin progress bar at top of story reader (below nav)
- Shows scroll percentage (0-100%)
- Auto-saves scroll position to Dexie on scroll (debounced 2s)
- Shows "Completed ✓" badge when scrollPercent > 90%
- Uses `useAuth()` for userId
- Color: accent green when < 50%, blue when 50-90%, emerald when completed

### Step 3: Wire TTS into story reader

In `story-reader-client.tsx`:

- Import `ListenToLesson` from `@/components/listen-to-lesson`
- Add "Listen to Story" button in the story card header (next to badges)
- Pass full story content as text, language as lang code
- Show play/pause state

### Step 4: Wire reading progress into story reader

In `story-reader-client.tsx`:

- Import `StoryProgressBar`
- On mount: load existing progress from Dexie, scroll to saved position
- On scroll: debounced save to Dexie (2s)
- On unmount: save final position
- Track time spent via `useEffect` interval (every 30s)
- Mark completed when scrollPercent > 90%

### Step 5: Add progress to story listing

In `stories-client.tsx`:

- Fetch user's story progress for displayed stories
- Show completion badge (✓) on completed stories
- Show "Continue" button on partially-read stories
- Show nothing on unread stories

### Step 6: Verification

```bash
npx tsc --noEmit
npx biome check src/components/stories/ src/app/\[locale\]/stories/ src/lib/stories/ src/lib/db/schema.ts
bun run test
```

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `bun run test` exits 0 (no regressions)
- [ ] Story reader shows TTS listen button that plays story audio
- [ ] Story reader shows scroll progress bar
- [ ] Reading position persists across page reloads
- [ ] Story listing shows completion badges
- [ ] `plans/README.md` status row updated

## STOP conditions

- `ListenToLesson` component cannot accept arbitrary text (check its props)
- Dexie schema migration conflicts with existing tables
- TTS API rate limit too low for story-length content
