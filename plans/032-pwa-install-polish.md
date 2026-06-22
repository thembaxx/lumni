# Plan 032: PWA install prompt polish + offline page

## Status: Done

## Problem

PWA install infrastructure exists (beforeinstallprompt, custom card, settings button) but the install prompt UI is basic and the offline page has minimal content. The manifest also lacks a description.

## Scope

- `public/manifest.json` — add description, improve icons
- `src/components/pwa/pwa-update-toast.tsx` — improve install prompt card
- `src/app/offline/page.tsx` — richer offline content with available offline features
- `src/lib/stories/` — ensure all story JSON files minify well for SW caching

## Steps

1. Update manifest with `description` field, better icon paths
2. Improve PWAInstallPrompt card with: app icon, feature list, cleaner design
3. Enhance offline page with: recently viewed stories list, offline quiz packs, flashcards
4. Add SW caching for story JSON and dictionary seed data
5. Verify: `npx tsc --noEmit`, `npx biome check`, `bun run test`

## Done criteria

- Manifest has description field
- Install prompt shows feature list and app icon
- Offline page shows recent stories, available quiz packs, flashcards
- Stories are SW-cached for offline reading
