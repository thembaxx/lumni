# Plan 024: Offline stories bundle — cache stories on first sync

## Status
- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none

## Why this matters
Stories are only cached in Dexie when a user reads them. On first visit, no stories are available offline. The roadmap promises "Cache 5 stories per language on first sync". Since we currently have 1 story per language, we should pre-cache all 11 on first visit.

## Scope
**In scope**:
- `src/lib/stories/service.ts` — add `cacheAllStories()` function
- `src/app/[locale]/stories/stories-client.tsx` — trigger caching on first visit
- `src/lib/db/schema.ts` — ensure storyProgress table exists (v38, already done)

**Out of scope**: Pre-caching quiz packs, service worker changes

## Steps
1. Add `cacheAllStories()` to service.ts — iterates all STORY_IMPORTS, loads metadata, loads content, calls cacheStory()
2. Add a `allCached` flag (check via Dexie storyCache.count() ≥ 11)
3. In stories-client.tsx, on mount, if stories not cached, trigger cacheAllStories() in background
4. Verify: `npx tsc --noEmit`, `npx biome check`, `bun run test`

## Done criteria
- First visit to `/stories` pre-caches all stories to Dexie
- Subsequent visits skip caching (count check)
- No blocking UI — caching happens in background
- All verification passes
