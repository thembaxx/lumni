# KaTeX / Math Conventions

## Delimiter Standard
- **Inline math**: `$...$` (e.g., `$F = ma$`)
- **Display math**: `$$...$$` (e.g., `$$\int x^2 \, dx$$`)
- Do NOT use `\(...\)` or `\[...\]` — `remark-math` defaults to dollar-sign delimiters

## Rendering Components

### MarkdownRenderer
For math inside markdown content. Automatically enabled for all STEM subjects.

```tsx
<MarkdownRenderer content="$E = mc^2$" subject="physical-sciences" />
```

### Equation (standalone)
For rendering individual equations outside of markdown.

```tsx
import { Equation } from "@/components/ui/equation"
<Equation math="E = mc^2" />
<Equation math="\int x^2 \, dx" block />
```

## Question Engine Architecture

The `QuestionEngine` is the single source of truth for all question operations. Located at `src/lib/question-engine/`.

### API

```
POST /api/engine/generate   { subject, topic?, count, questionType?, difficulty? }
POST /api/engine/grade      { question, answer }
POST /api/engine/hint       { question }
GET  /api/engine/test       End-to-end health check
```

### Client Hook

```tsx
import { useQuestionEngine } from "@/hooks/use-question-engine"

const { questions, isLoading, generate, grade, hint } = useQuestionEngine(
  { subject: "mathematics", count: 5, questionType: "any" },
  { enabled: true }
)
```

### Question Types (11)
- **Selected Response**: `multiple-choice`, `matching`
- **Constructed Response**: `short-answer`, `long-answer`, `essay`
- **STEM / Technical**: `calculation`, `diagram`, `programming`
- **Context / Mixed**: `source-based`, `data-response`, `mixed`

### Validation
Questions are validated against per-type validators (score 0-100). Low-scoring questions are regenerated. Validators check: schema (required fields), quality (gibberish, placeholders), consistency (points vs difficulty).

### Caching + Persistence
1. Dexie IndexedDB (24h expiry) — fastest
2. Appwrite questions collection — cross-session
3. AI generation — on-demand fallback

### TypeScript Types

```typescript
// Import directly from engine
import type { Question, QuestionType, GradingResult, Option } from "@/lib/question-engine/types"
import type { Difficulty } from "@/lib/question-engine/types"   // "Easy" | "Medium" | "Hard"
```

> **Note:** The question engine `Difficulty` uses capitalized values (`"Easy"`/`"Medium"`/`"Hard"`). Color utilities (`@/lib/utils/colors`) define a separate lowercase `Difficulty` (`"easy"`/`"medium"`/`"hard"`). Both are in use; the `DifficultyBadge` component normalises with `toLowerCase()`.

## Visual Engine Architecture

The `VisualEngine` sits alongside `QuestionEngine` and generates diagrams/images for questions. Located at `src/lib/visual-engine/`.

### Subject Classification
- **STEM subjects** (30 subjects including sciences, tech, business, geography, design, agriculture) → AI-generated diagrams via Konva renderers
- **Non-STEM subjects** (languages, humanities, arts, services, compulsory) → Wikimedia Commons image search
- Cross-fallback: if primary method fails, tries the alternative

### API

```
POST /api/engine/visual     { questionId, questionText, subject, topic? }
GET  /api/engine/visual/test End-to-end health check
```

### Client Hook

```tsx
import { useVisualEngine } from "@/hooks/use-visual-engine"

const { data: visual, isLoading } = useVisualEngine(question)
```

### Rendering Components

```tsx
import { VisualContent } from "@/components/visual/visual-content"
import { DiagramRenderer } from "@/components/visual/diagram-renderer"

<VisualContent visual={visual} isLoading={loading} />
```

### Diagram Types (11)
- **Physics**: `force-vector`, `circuit`, `wave`, `motion`
- **Math**: `geometry`, `graph`
- **Data**: `chart` (bar/line/pie)
- **Science**: `chemistry`
- **General**: `node-flow`, `node`, `custom-svg`
- **Fallback**: `mermaid-diagram` (Mermaid.js)

### New Konva Renderers (in `src/components/quiz/diagrams/`)
- `geometry.tsx` — circles, lines, polygons, arcs, angle marks, right-angle marks
- `chart.tsx` — bar/line/pie charts with legends and gridlines
- `chemistry.tsx` — atoms (colored circles), bonds (single/double/triple/dashed), reaction arrows
- `graph.tsx` — coordinate planes, function curves, tick marks, asymptotes, labeled intercepts

### Caching + Persistence
1. Dexie IndexedDB (7-day expiry) — fastest
2. Appwrite visuals collection — cross-session (optional, fails silently)
3. AI generation / Wikimedia search — on-demand fallback

### Pre-caching
When `POST /api/engine/generate` creates questions, the engine fires background visual generation for each question so visuals are cached and ready when the question card renders.

### AI Provider Order
1. Gemini 2.0 Flash Lite (primary, first attempted)
2. Nvidia NIM — meta/llama-3.3-70b-instruct (fallback)
3. Groq — llama-3.3-70b-versatile (last resort)

> **Note:** DeepSeek was removed as too expensive for free-tier credits. Nvidia NIM was added as the second fallback. The chain is defined in `src/lib/ai/client.ts`.

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

For agents: **TODO.md is the single source of truth for planned work.** Never create issues directly on GitHub without updating TODO.md.

### Triage labels

Five canonical labels with default naming. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Workflow

TODO.md ↔ Linear ↔ GitHub ↔ Sentry are integrated. See `docs/agents/workflow.md`.

**Key commands for agents:**
- `npm run todo:sync` — Push TODO.md → Linear (creates/updates issues)
- New task? Add to TODO.md under "Next Up" or "Bug Fixes", then run sync
- For bugs from Sentry: check Linear Backlog first (Sentry auto-creates LUM-xxx once integrated)
- Labels: `Bug`, `Feature`, `Improvement` — applied in Linear, synced to GitHub

## Design System Enforcement

Established 2026-05-23 after a codebase-wide audit. All decisions below are non-negotiable and are tracked in `docs/adr/0005-theming-strategy.md`.

### No Arbitrary Values
- **No pixel hacks**: `w-[200px]`, `text-[13px]`, `min-h-[250px]` are prohibited. Use `--space-*` and `--fs-*` tokens.
- **No magic z-index**: `z-50`, `z-[100]` are prohibited. Use `--z-content` → `--z-skip-link` scale.
- **No hardcoded shadows**: `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]` is prohibited. Use `shadow-level-1/2/3`.
- **No arbitrary radii**: `rounded-[2.5rem]` is prohibited. Use `rounded-card-lg` (40px), `rounded-lg` (20px), etc.

### Spacing Standard
- Use `gap-*` on parent containers for all sibling spacing. `space-y-*` and manual `mt-* mb-*` pairs are deprecated.
- Wrap block containers in `flex flex-col` when `gap` is needed.

### Page Layout
- Every page must use `<PageContainer>` (except home feed and admin dashboards).
- `PageContainer` owns `max-w-*` and `px-*`. Pages must not declare their own.

### Dark Mode
- All page-level components (`dashboard-client`, `exam-session-client`, `study-planner`, `settings-client`) must include `dark:` variants.
- All hardcoded light-mode colors (`bg-[#1e1e1e]`, `bg-black/10`, inline hex styles) must use CSS variables or `dark:` overrides.
- Apple HIG dark mode principles: base layer dimmer, elevated layers brighter, separators lighter, accent lifted.

## Sessions

### Session 1 — Bug fixes (May 2026)

- **Exam scoring**: `Option` type requires `isCorrect: boolean`; exam parser fixed
- **Exam sessions**: Now use `exam_sessions` Appwrite collection (not `exam_papers`)
- **Gamification**: Achievements migrated from `string[]` to `StoredAchievement[]` — old format auto-migrates
- **Paper listing type**: Renamed to `PaperListing` in `@/types/exam` 
- **Upload page**: Fixed text leak (`CloudArrowUp` icon exposed in success message)
- **Auth**: Removed `DEFAULT_USER_ID` hardcoding; `stats-row.tsx` wired to `useAuth()`
- **Loading screen**: Fixed `setTimeout` leak (`timeoutRef` cleanup)
- **Rate limiting**: `withRateLimit` wrapper for `POST /api/generate-element-fact`
- **Backoff**: Consolidated into `src/lib/shared/backoff.ts`

### Session 2 — Data flow connections

- **Exam wrong answers**: Captured from `exam-session-client.tsx` and `flashcards-client.tsx`
- **Flashcard auto-generation**: SM-2 cards created for all wrong answers
- **Review Mistakes mode**: Loads wrong-answer journal as flashcard session
- **Exam competency**: Uses `sectionId` as topic instead of hardcoded "exam-practice"

### Session 3 — Features

- **Exam answer review**: Expanded `ExamResults` with per-question expand/collapse, user vs correct answer, Review Mistakes button
- **Wrong answer journal**: Subject/topic filters, error type categorization (6 types)
- **Onboarding restart**: Button in Settings > Data tab

### Session 4 — Architecture consolidation + Phase 5 features

- **Unified competency tracking**: `trackQuestionResult()` across exam/flashcards/dashboard call sites
- **Dashboard orchestration**: `analytics-sync` background job enqueue on quiz completion
- **Flashcard merge**: SM-2 due cards loaded before AI fallback; SM-2 `reviewFlashcard()` used for existing cards
- **7 quality fixes**: Removed unused import, fixed dynamic Tailwind class in `AnimatedIcon`, removed redundant CSS vars, deleted dead barrel file `src/types/questions.ts`, removed recharts `isAnimationActive={true}`, moved import to top of `exam-paper.ts`, re-exported `QuestionType`
- **Content quality feedback**: `QuestionRating` Dexie table (v8), `QuestionRatingService`, `StarRating` component, `QuestionRatingsDashboard` in admin/quality
- **Unified search**: `searchAll()` across Dexie questions + wrong answers + localStorage flashcards + notes; `SearchWidget` + `SearchResults` on dashboard
- **Push notifications**: `notification-service.ts` with permission + subscribe + local notifications; wired into onboarding step 4 Switch toggle and Continue button
- **Social leaderboard**: `leaderboard-service.ts` (local), `LeaderboardCard` component
- **Premium gating**: `PremiumProvider` + `usePremium()` hook; `/premium` upgrade page

### Session 5 — Personalization loop + competency pipe (May 2026)

- **Competency → quiz pipe**: `GenerationParams` extended with `topicCompetencyLevel`, `suggestedBloomLevel`, `suggestedDifficulty` — injected by route handler/orchestrator, read by PromptManager for AI prompt personalization
- **Competency mapper**: `src/lib/question-engine/competency-mapper.ts` maps novice→remember/understand/Easy, developing→understand/apply/Medium, proficient→apply/analyze/evaluate/Medium, mastered→evaluate/create/Hard
- **Difficulty override**: `suggestedDifficulty` overrides `params.difficulty` in prompts when competency data is available
- **Cross-topic awareness**: Quiz auto-selects weakest topic when none specified (uses `resolvedTopic` state)
- **Wrong-answer → targeted quiz**: "Practice these topics" button on review page (`/quiz?subject=X&topic=Y&count=10`)
- **Competency sync field fix**: `job-processor.ts` wrote `proficiency` but API routes read `score` → all competencies showed as 0. Fixed both write paths + added backward-compat fallback in `next-topics/route.ts` and `study-plan/route.ts`

### Session 6 — Study planner activation (May 2026)

- **Algorithmic planner activated**: `useStudyPlanner()` hook extended with `generatePlan()` — calls `StudyPlannerService.generateStudyPlan()` (reads Dexie competencies, runs inverse-competency-weighted round-robin scheduling), converts `TopicPlan[]` to `StudySession[]`, persists to localStorage
- **Dashboard integration**: `StudyPlanOverview` shows "Generate Plan" button + inline form (target APS, daily minutes) when empty instead of returning null
- **Defaults**: 25 APS target, 30 min/day, weekdays-only, 30-day horizon

### Session 7 — Design system enforcement (May 2026)

- **Token expansion**: Added `--z-*` semantic scale, `--radius-card-lg: 2.5rem`, mapped `shadow-level-2` and `radius-4xl` in `@theme inline`
- **Shadow standardization**: Replaced 43+ hardcoded `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]` with `shadow-level-2` (dark-mode aware)
- **Radius standardization**: Replaced 34 `rounded-[2.5rem]` with `rounded-card-lg`
- **Spacing standardization**: Replaced `space-y-*` and manual margins with `gap-*` on parent containers
- **Page layout**: Created `<PageContainer>` component; standardized all page max-width/padding
- **Z-index**: Replaced magic numbers with `--z-content` → `--z-skip-link` semantic scale
- **Dark mode (Critical + High tiers)**: Added `dark:` variants to `dashboard-client`, `exam-session-client`, `study-planner`, `settings-client`, fixed `bg-[#1e1e1e]` in markdown-renderer, `bg-black/10` in today-focus-card, inline hex styles in onboarding-wizard, and HTML export template in progress-export

### Session 8 — Architecture consolidation batch (May 2026)

- **Flashcard engine consolidation**: Created `src/lib/flashcard-engine/` — unified `FlashcardEngine` class wrapping `DexieFlashcardRepository` + SM-2/FSRS algorithms + daily limits + learning steps + ease-hell recovery + leech detection + settings. Old barrels (`spaced-repetition/index.ts`, `flashcard-repository/index.ts`, `utils/spaced-repetition.ts`) re-export from new engine for backward compatibility.
- **Generic route handler factory**: Created `src/lib/api/create-route-handler.ts` — `createRouteHandler()` factory with `AuthMode`, `HttpError` class, automatic auth guard, body parsing, Zod validation, error wrapping, optional rate limiting. Migrated 5 routes (`analytics/comparative`, `analytics/trends`, `admin/exams`, `exam-sessions`, `jobs/process`) — each route now ~10-20 lines of declarative config.
- **Services barrel unification**: `src/lib/services/index.ts` now exports all 10 services plus `ServiceResult<T>` success/failure helpers for consistent error handling across business logic.
- **Tools directory reorganization**: `src/components/tools/` split into domain subdirs (`core/`, `communication/`, `math/`, `science/`, `scheduling/`) — 11 components moved, all import chains updated with backward-compat barrels.

### Session 10 — P1 Implementation Sweep (May 2026)

- **Exam_dates Appwrite write path**: Added `"appwrite-exam-dates-sync"` job type with `upsertDocument` handler; `syncExamDatesToAppwrite()` now enqueues background job; `syncExamDatesDirect()` for server-side immediate writes
- **E2E tests**: Playwright installed (`@playwright/test@1.60.0`), configured (`playwright.config.ts`), smoke tests for homepage, quiz, exam-dates pages
- **Offline AI Quiz Packs**: `src/lib/quiz-packs/` — types, `QuizPackService`, Dexie v18 migration (quizPacks + packQuestions tables), `POST /api/quiz-packs/generate` (rate-limited, uses `QuestionEngine`), `useQuizPacks()` hook, `<OfflinePackManager>` dashboard component with storage progress, subject selector, pack list with status badges
- **Storybook**: `storybook@10.4.1` + `@storybook/nextjs`, config (`main.ts` + `preview.ts`), stories (ShareButton, Badge), build completes successfully
- **Fixed tests**: Updated `schema.test.ts` for Dexie v18 (version 15→18, table count 18→23)
- **Audited P1 items**: Share/Export, SR v2 upgrades, Flashcard pull sync — all already implemented prior to this session

### Session 13 — Swipeable flashcard deck (May 2026)

- **`SwipeableCardDeck`**: `src/components/flashcard/swipeable-card-deck.tsx` — Tinder-style 3-card cascade with drag-to-swipe interaction. Tap to flip, drag with colored overlay feedback, exit animation on swipe. `mode="simple"` (binary) and `mode="sm2"` (full 6-quality SM-2) modes.
- **`SwipeableCard`**: `src/components/flashcard/swipeable-card.tsx` — single card with framer-motion `drag="x"`, reactive gradient overlays via `useTransform`, spring-back below threshold.
- **`QualityPicker`**: `src/components/flashcard/quality-picker.tsx` — post-swipe overlay for SM-2 quality fine-tuning (3 correct/3 incorrect levels), auto-advances after 1.5s timeout, undo support.
- **`useSwipeDeck`**: `src/hooks/use-swipe-deck.ts` — drag state machine (idle→dragging→swiped→quality-pick→advancing), undo stack, pending guard for rapid swipes.
- **Migration**: `flashcards-active.tsx` and `sm2-study-session.tsx` replaced with deck. `flashcards-client.tsx` simplified (removed `currentIndex`, `isFlipped`, `previousCard`, `nextCard` state).
- **TypeScript + Biome**: zero errors.

### Known limitations (won't fix)

- `analytics-service.ts` comparative analytics depends on other users' data in Appwrite; falls back to estimates

### TypeScript & Lint

- `npx tsc --noEmit` must pass with zero errors
- `npx biome check` must pass on all changed files
- Build: `npx next build` (catches runtime issues; `bunx --bun next build` may fail due to Next.js worker git-clone compat, use `npx` instead)
