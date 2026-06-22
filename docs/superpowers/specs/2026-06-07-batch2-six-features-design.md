# Batch 2 — Six Features Design

**Date:** 2026-06-07

## Overview

Six independent features building on existing infrastructure. Each is a self-contained vertical slice.

---

## 1. Redis-backed RateLimiter (`src/lib/rate-limiter/redis-store.ts`)

### Current State

In-memory `Map<string, { count, resetAt }>` — process-local, lost on restart, not shared across serverless instances. The `RateLimitStore` interface already exists at `src/lib/rate-limiter/core.ts` and is designed for pluggable backends.

### Change

Add `@upstash/redis` dependency. Implement `RedisStore` implementing `RateLimitStore`:

```typescript
class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) {}
  get(key: string): RateLimitStoreEntry | undefined {
    /* GET key */
  }
  set(key: string, entry: RateLimitStoreEntry): void {
    /* SETEX key ttl entry */
  }
  delete(key: string): void {
    /* DEL key */
  }
  entries(): Map<string, RateLimitStoreEntry> {
    /* SCAN + MGET — best-effort */
  }
  size(): number {
    /* DBSIZE */
  }
}
```

### Wiring

In `src/lib/shared/rate-limit.ts`:

- On import, if `process.env.REDIS_URL` exists → `new RateLimiter(new RedisStore(new Redis({ url })))`
- Otherwise → `new RateLimiter(new MapStore())` (current behavior, fallback)
- No changes to any route handler or `createRouteHandler`

### Env

```
REDIS_URL=rediss://...  (optional — falls back to in-memory)
```

### Files

- New: `src/lib/rate-limiter/redis-store.ts`
- Modify: `src/lib/shared/rate-limit.ts` (conditional Redis init)
- Dependencies: `@upstash/redis` in `package.json`

---

## 2. Achievement Push Notifications

### Current State

- `use-gamification.ts` `addAchievement()` fires a toast + `setPendingAchievement` for dialog — but NO `sendLocalNotification`
- `checkForNewAchievements()` in `notification-service.ts` polls on mount — misses real-time unlocks, uses generic message

### Change

Wire real-time push into `addAchievement()`:

**In `use-gamification.ts`:**

1. Import `sendLocalNotification` from `@/lib/services/notification-service`
2. In `addAchievement`, after setting pending achievement + toast, call:
   ```typescript
   sendLocalNotification(`🏆 ${achievement.name}`, achievement.description, "/dashboard");
   ```

**In `notification-service.ts`:**

1. Remove `checkForNewAchievements()` — no longer needed (replaced by real-time push)
2. Remove `ACHIEVEMENT_CHECK_KEY` constant

### Guard

Only send if `notificationSettings.enabled && notificationSettings.achievementNotifications`.

### Acceptance

- User unlocks an achievement during quiz/exam/flashcard → push notification fires immediately
- Notification shows the actual achievement name + description
- Clicking navigates to `/dashboard`

### Files

- Modify: `src/hooks/use-gamification.ts` (add push call)
- Modify: `src/lib/services/notification-service.ts` (remove polling function)

---

## 3. Flashcard Deck Sharing

### Current State

Share-service shares questions only. No flashcard deck concept exists. Study groups have no flashcard bridge.

### Data Model: `FlashcardDeck`

```typescript
interface FlashcardDeck {
  id: string;
  subject: string;
  topic?: string;
  title: string;
  description?: string;
  cards: { front: string; back: string }[];
  cardCount: number;
  createdBy: string;
  createdAt: number;
}
```

### Flow

1. **Export deck**: In `flashcards-client.tsx`, add "Share Deck" button that collects all cards for current subject/topic, creates `FlashcardDeck`
2. **Share**: POST to `/api/q/share` (reuses existing share-service) with `type: "flashcard-deck"` — stores in Dexie `sharedQuestions` table + enqueues Appwrite sync
3. **Post to group**: After sharing, create a `GroupPost` with content `"Shared flashcard deck: {title}"` + the share URL. Reuses existing `useCreatePost()` mutation.
4. **Import deck**: On the shared page (`/q/{id}`), render "Import Deck" button that calls `flashcardEngine.bulkCreate(cards)` to import all cards into the user's local collection

### UI

- "Share Deck" button in flashcard session (next to existing share results button)
- Shared page renders card count + first 3 cards as preview + "Import Deck" CTA
- Group post shows deck title + "View Deck" link

### Files

- New: `src/lib/flashcard-engine/deck-types.ts` (FlashcardDeck type)
- Modify: `src/lib/share/share-service.ts` (handle flashcard-deck type)
- Modify: `src/app/[locale]/flashcards/flashcards-client.tsx` (Share Deck button)
- Modify: `src/app/[locale]/study-groups/[groupId]/group-detail.tsx` or discussion feed (deck post rendering)

---

## 4. Weekly Group Challenge Auto-Gen

### Current State

Weekly challenges exist as leaderboards (XP + accuracy tracking). No dedicated question set. Members study independently.

### Change

Add a "Challenge Quiz" feature to the weekly challenge banner:

1. **Challenge Banner** gets a "Start Challenge Quiz" button
2. Clicking generates `{ count: 10 }` questions via `QuestionEngine.generate()` using the group's `subjectId` if set. Questions are stored in a new Dexie table `challengeQuestions` with the challenge's `weekStart` as the key.
3. **All group members** get the same questions — the generation only happens once per week per group. Subsequent members reuse the cached set.
4. **Scoring**: Each correct answer adds to `combinedScore` at 10 points per correct (vs the usual XP-based scoring). Results are submitted via the existing `updateChallengeEntry()` path.

### Guard

Questions are generated at most once per week per group. `getOrCreateChallenge()` already tracks week boundaries.

### UI

- `ChallengeBanner` gets a "Challenge Quiz" button (visible only when `group.subjectId` is set)
- Quiz session shows a "Challenge" badge in the header
- Results feed into challenge score

### Files

- Modify: `src/lib/study-groups/challenge-service.ts` (add `generateChallengeQuestions()`, `getChallengeQuestions()`)
- Modify: `src/components/study-groups/challenge/challenge-banner.tsx` (add button + quiz link)
- New: Dexie table `challengeQuestions` (not strictly needed — can use sessionStorage per week)

---

## 5. AI Study Guide Generator

### API

```
POST /api/engine/study-guide
Body: { subject: string; topic: string; depth?: "summary" | "detailed" }
Response: { content: string; format: "markdown"; generatedAt: number }
```

### Flow

1. Fetch RAG context via `searchWithRAG(subject, topic)` — grounds the guide in live web sources
2. Fetch KnowledgeGraph via `fetchGraph(subject, topic)` — provides topic structure
3. Call AI provider chain with system prompt:
   ```
   You are an expert study guide writer for the South African CAPS curriculum.
   Generate a structured study guide covering the topic below. Use:
   - Clear headings (##)
   - Bullet points for key concepts
   - Worked examples in code blocks
   - Summary table at the end
   ```
   and user prompt containing the RAG XML + knowledge graph JSON + subject/topic
4. Return markdown content

### UI

New route `/study-guide?subject=X&topic=Y`:

- Server component that renders the guide via `<MarkdownRenderer>`
- "Listen" TTS button via existing `<TTSButton>`
- "Export" dropdown (print-to-PDF via existing `printWindow.print()` pattern)
- Loading skeleton while generating

### Caching

Dexie table `studyGuides: &key` (subject:topic), 7-day TTL — same pattern as `knowledgeGraph`.

### Files

- New: `src/lib/study-guide/types.ts`
- New: `src/lib/study-guide/service.ts` — `generateGuide()`, `getCachedGuide()`, `storeGuide()`
- New: `src/app/api/engine/study-guide/route.ts`
- New: `src/app/[locale]/study-guide/page.tsx` — guide display page
- New: Dexie v30 migration in `src/lib/db/schema.ts` — `studyGuides` table
- Modify: `src/lib/db/data-access.ts` — add `studyGuides` accessor
- Modify: `src/lib/db/dexie-data-access.ts` / `in-memory-data-access.ts` — wire accessor

---

## 6. Live Study Session

### New Collection: `live_sessions`

Appwrite collection `live_sessions`:

```
{ $id, groupId, hostUserId, subject, status: "waiting"|"active"|"finished",
  currentQuestion: number, totalQuestions: number, startedAt, createdAt }
```

### Flow

1. **Host** clicks "Start Live Session" on group detail page
2. Generates `{ count: 10 }` questions via `QuestionEngine.generate()` with group's subjectId
3. Creates `live_sessions` doc in Appwrite (status: "waiting")
4. Group members see a "Live Session in progress" banner (via Realtime subscription on `live_sessions` where `groupId = X`)
5. **Host** clicks "Start" → status becomes "active", first question distributed
6. **Realtime events** on a custom channel:
   - `session:next_question` — host pushes `{ questionIndex, question }`
   - `session:progress` — each member broadcasts `{ userId, answered }`
   - `session:results` — host ends session, broadcasts final leaderboard
7. Each member answers independently; progress bar shows who's answered
8. On completion, results feed into challenge entries

### Implementation Scope

Since Realtime `client.subscribe()` is Appwrite's WebSocket-based mechanism (already used for the leaderboard LIVE dot), live sessions use the same pattern:

- **Host client**: `client.subscribe(database.${dbId}.collections.live_sessions.documents)` — listens for member join events
- **Member clients**: `client.subscribe(database.${dbId}.collections.live_sessions.documents)` — listens for session state changes
- **Question distribution**: Poll-based via `live_sessions.currentQuestion` field (simpler than custom events — just increment the counter; clients detect change via subscription)

### UI

- "Start Live Session" button on group detail page (admin/member with permission)
- "Live Session" banner component with countdown/progress
- In-session view: shared question display + member progress bar + personal answer submission
- Results view: leaderboard within the session

### Files

- New: `src/lib/study-groups/live-session-service.ts` — create, join, submit answer, get results
- New: `src/hooks/use-live-session.ts` — Realtime subscription + state management
- New: `src/components/study-groups/live-session/live-session-banner.tsx` — join banner
- New: `src/components/study-groups/live-session/live-session-player.tsx` — in-session view
- New: `src/app/api/study-groups/live-session/route.ts` — create session
- New: `src/app/api/study-groups/live-session/[sessionId]/route.ts` — join, submit, finish
- Modify: `src/components/study-groups/group-detail.tsx` — add session button + banner

---

## Verification

- `npx tsc --noEmit` — zero errors
- `npx biome check` — zero errors
- `npx next build` — clean build
- `bun test` — no regressions

## Implementation Order

1. Redis-backed RateLimiter (foundation, 1 new file)
2. Achievement push notifications (simplest, 2 file edits)
3. Flashcard deck sharing (new types + share wiring)
4. Weekly group challenge auto-gen (challenge-service + banner button)
5. AI study guide generator (new table + route + service + UI page)
6. Live study session (most complex, 5+ new files)
