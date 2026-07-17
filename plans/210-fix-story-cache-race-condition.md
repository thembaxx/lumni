# Plan 210: Fix story cache race condition — sequence audio URL population before cache write

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: bug

## Why this matters

`cacheStory()` writes the story to Dexie, then _fire-and-forgets_ `populateAudioUrl()` which mutates `story.audioUrl` and does a _second_ write to the same cache key. Because `populateAudioUrl` returns a Promise that is never awaited, the second `.put()` races with concurrent readers: a `getCachedStory()` call that arrives between the first `.put()` and the second `.put()` gets the story _without_ the audio URL. Worse, if two callers call `cacheStory()` concurrently, the shared `story` object is mutated by both, causing data corruption (the second write may contain stale interleaved state).

## Current state

`src/lib/stories/service.ts:139-164`:

```ts
export async function cacheStory(id: string, story: Story): Promise<void> {
  try {
    const key = `story:${id}`;
    if (!story.audioUrl && voiceEngine.hasServerProvider()) {
      populateAudioUrl(story).then((audioUrl) => {
        // fire-and-forget, mutates shared `story`
        if (audioUrl) {
          story.audioUrl = audioUrl;
          const entry = {
            key,
            story,
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          };
          _deps.db.storyCache.put(entry).catch(() => {}); // second write, un-awaited
        }
      });
    }
    const entry = {
      // first write (no audioUrl)
      key,
      story,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    await _deps.db.storyCache.put(entry);
  } catch {
    // IndexedDB unavailable (server-side)
  }
}
```

Also, the second `.put()` has a silent `.catch(() => {})` — this was separately addressed in Plan 209, but should be replaced with `logError` in this fix.

## Target state

Single sequential write: await `populateAudioUrl()`, enrich the story in-place, then write the cache once with the complete enriched story object. No race window, no double write.

```ts
export async function cacheStory(id: string, story: Story): Promise<void> {
  try {
    const key = `story:${id}`;
    if (!story.audioUrl && voiceEngine.hasServerProvider()) {
      try {
        const audioUrl = await populateAudioUrl(story);
        if (audioUrl) {
          story.audioUrl = audioUrl;
        }
      } catch (err) {
        logError("StoryCache.populateAudioUrl", err);
      }
    }
    const entry = {
      key,
      story,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };
    await _deps.db.storyCache.put(entry);
  } catch {
    // IndexedDB unavailable (server-side)
  }
}
```

## Scope

- `src/lib/stories/service.ts` only
- No other files
- `logError` already imported in this file

## Steps

### 1. Verify the current code

Read `src/lib/stories/service.ts:139-164` to confirm it matches the "Current state" above.

### 2. Rewrite `cacheStory` to be sequential

Replace the body of `cacheStory` with the sequential version:

- Remove the `populateAudioUrl(story).then(...)` fire-and-forget chain
- `await populateAudioUrl(story)` inside the guard, wrapped in try/catch with `logError`
- After the await, continue to the single `_deps.db.storyCache.put(entry)` — no second write
- The `.catch(() => {})` on the old second write is no longer needed (it ceases to exist)

### 3. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Expected: all existing story-related tests pass. No new type errors.

### 4. Confirm no stale references

Search for other callers of `cacheStory` to ensure they don't depend on the fire-and-forget timing: `rg "cacheStory" src/`. The only caller should be `cacheAllStories` (line 99) and possibly direct calls from pages/hooks — verify none rely on the old race-window behavior.

## Stop conditions

- Any file outside `src/lib/stories/service.ts` is modified — stop and revert
- `pnpm run typecheck` fails
- More than 2 tests regress

## Estimated time

30-60 minutes
