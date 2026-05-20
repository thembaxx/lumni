# TODO

## Remaining

### P2 — Anonymous User Migration (complete on sign-up)
- [ ] **Sync competency history** — Migrate offline Bloom competency records to Appwrite on sign-up.
- [ ] **Sync spaced repetition cards** — Sync offline SM-2 flashcard profiles to Appwrite on sign-up.
- [ ] **Sync wrong answer journal** — Synchronize wrong answers and content ratings to Appwrite on sign-up.
- [ ] **Sync chat history** — Migrate AI tutor chat messages to Appwrite on sign-up.

### P3 — System Unifications
- [ ] **Consolidate spaced repetition** — Merge overlapping SM-2 logic between `spaced-rep-service.ts` and `spaced-repetition.ts`.
- [ ] **Standardize difficulty types** — Unify capitalized and lowercase difficulty types into shared normalized enum.
- [ ] **Shared rate-limit provider** — Combine RateLimiter cores for token-tracker, APIs, and auth routes.

### P3 — AI Personalization & Retention
- [ ] **Bloom's Taxonomy recommendations** — Dashboard widget recommending learning formats based on topic Bloom competency.
- [ ] **Spaced repetition due notifications** — Push reminders when SM-2 cards become due for review.

### P3 — Custom Domain
- [ ] **Replace Vercel domain** — Change `https://lumni-psi.vercel.app` to custom domain in referral links.

### Test Coverage
- [ ] `src/lib/db/` (15 files) — persistence layer
- [ ] `src/lib/sync/` — offline/online sync handler
- [ ] `src/lib/exams/` — marker client, exam paper sync
- [ ] `src/lib/referral/` — client, service, types
- [ ] `src/lib/server/` (7 files) — server actions
- [ ] `src/lib/ai/` — index.ts, types.ts, with-budget.ts, providers
- [ ] `src/lib/visual-engine/` — prompts, resolvers, renderers
- [ ] Integration tests (orchestrator ↔ engine pipelines)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Component tests (`src/components/`)
