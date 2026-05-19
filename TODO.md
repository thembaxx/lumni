# TODO

## Done (May 2026)

### P0 Critical
- [x] SW registration + PWA components
- [x] AI budget bypass: `/api/chat/image`
- [x] Admin routes auth — `requireAdmin()` on all 8 admin routes
- [x] User-scoped data auth — exam-sessions, analytics, referral
- [x] Error-swallowing routes — proper 500 instead of 200 fallback
- [x] `engine/budget` error handling
- [x] Search01Icon text leak fix
- [x] `tsconfig.json` int-test exclusion

### PWA & Offline
- [x] Remove unused SVGs, add `worker-src 'self'`, icon sizes, apple-touch-icon

### P2 — API Security & Rate Limiting
- [x] 16 routes secured with auth + per-route rate limits
- [x] `withRateLimit` config parameter for custom limits

### Flashcards
- [x] Legacy localStorage → SM-2 Dexie migration
- [x] `/flashcards/browse` page with search/filter/pagination
- [x] CSV import/export

### Study Planner
- [x] Plan-aware reminders, iCal export, recurring sessions
- [x] Appwrite sync (STUDY_PLANS collection, job queue handler)
- [x] Constraint-based scheduling algorithm

### Content Moderation
- [x] Question flagging API (`POST /api/questions/flag`)
- [x] Admin review queue (`/admin/content`)
- [x] Auto-regen for low-rated questions

### Social
- [x] Real leaderboard from Appwrite aggregation
- [x] Activity feed service

### Admin Panels
- [x] User management (`/admin/users`)
- [x] Content moderation (`/admin/content`)
- [x] Notification broadcast (`/admin/notifications`)
- [x] Analytics dashboard (`/admin/analytics`)

### P3 Code Quality
- [x] Menu component deleted, list-cell dead code removed
- [x] 16 unused vars + 6 unused imports removed
- [x] "use client" fixes (10 removed, 6 added)
- [x] Empty event handlers fixed

### P3 Accessibility
- [x] bottom-nav, progress-dots, animated-tabs, segmented-control, profile-tab, study-planner

### P3 Performance
- [x] Namespace → named imports (THREE, RechartsPrimitive)
- [x] `sizes` on `<Image>`, restricted `remotePatterns`
- [x] Suspense skeletons instead of `fallback={null}`
- [x] Memory leak fixes (use-tts.ts, exam-session.ts)

### P3 Architecture
- [x] Merged 3 empty-state systems into 1
- [x] Split study-set-creator (802→181 lines)
- [x] Split quiz-view (558→327 lines)
- [x] Merged animated-tabs + segmented-control → TabSwitcher
- [x] AppErrorBoundary on 9 pages
- [x] Lazy-loaded nav via next/dynamic
- [x] Streaming SSR for dashboard + admin pages
- [x] API error standardization (`apiError`/`apiSuccess`)
- [x] Constraint-based study planner algorithm

---

## Remaining

### Test coverage
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

### Other
- [ ] Replace `https://lumni-psi.vercel.app` with custom domain in referral links
