# Plan 038: Community — shared flashcards, competitions, study groups

## Scope
- Shared flashcards: Allow users to publish flashcard decks with share links, browse public decks
- Competitions: Weekly quiz competitions with leaderboard, XP rewards for top performers
- Study groups: Enhance existing groups with shared goals, challenge system

## Approach
- Shared flashcards: reuse existing `share-service.ts` pattern (share links, 7-day expiry)
- Competitions: create `src/lib/competitions/` module, Dexie table for competition scores, weekly timer logic
- Study groups: read `src/components/study-groups/` for existing infrastructure, add challenge creation

## Done criteria
- Users can share flashcard decks via link
- Public deck browser shows available shared decks
- Weekly competition results in leaderboard
- Study group challenges can be created and joined
