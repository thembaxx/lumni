# Lumni Product Strategy Assessment

## Executive Summary

Lumni is a mature, offline-capable, mobile-first SA Matric exam preparation platform built on Next.js 16, Appwrite, and a multi-provider AI chain (Gemini → Nvidia → Groq). The codebase has undergone 50+ architectural sessions delivering a comprehensive feature set including AI question generation/grading, visual diagram engine, RAG-grounded content (TinyFish), SM-2/FSRS flashcards with swipeable decks, immersive quiz/exam modes, knowledge graphs, study guides, live study sessions (Ably), cross-device sync, unified STT/TTS voice engine, gamification, teacher/parent tools, and extensive observability.

**Current State**: 2,047 tests passing, zero lint errors, React Doctor score 100/100. All premium gating removed (June 2026) — all features free. Production hardening complete (Sentry, CSP, CI/CD, security headers).

**Primary User Cohort**: South African Grade 12 (Matric) students preparing for NSC exams — mobile-first, high-stress exam periods, 11 official languages, variable connectivity. Secondary: Teachers (assignments, observations, ghost links), Parents (weekly digest, progress tracking).

**Key Constraints**: 2,000 AI calls/day global budget; 50k Appwrite doc limit; offline-first architecture; 11 SA locales; WCAG 2.2 AA target.

---

## 1. Prioritized Feature Improvements (Impact × Effort Matrix)

| #      | Feature Improvement                                             | Impact (1-5) | Effort (1-5) | ICE Score | Dependencies                                                       | Risks                                             | Owner          |
| ------ | --------------------------------------------------------------- | ------------ | ------------ | --------- | ------------------------------------------------------------------ | ------------------------------------------------- | -------------- |
| **P0** | **Offline-first quiz packs with background sync**               | 5            | 3            | 125       | Sync layer (S50), QuizPackService (S28), Service Worker            | Cache invalidation complexity; storage quota      | Sync Team      |
| **P0** | **AI-powered adaptive study planner (competency → schedule)**   | 5            | 4            | 100       | CompetencyEngine (S5/6), StudyPlannerService (S38), DataAccess     | Cold-start for new users; over-scheduling fatigue | Study Team     |
| **P0** | **Real-time collaborative study sessions (whiteboard + voice)** | 4            | 4            | 80        | Ably presence (S45), STT/TTS (S50), VoiceEngine                    | Moderator controls; bandwidth on mobile           | Social Team    |
| **P1** | **Past paper ingestion pipeline (PDF → structured questions)**  | 5            | 5            | 62.5      | ExamPaperIngestion (exists), OCR service, QuestionEngine           | PDF layout variance; copyright; 50k doc limit     | Content Team   |
| **P1** | **Multilingual AI content generation (all 11 SA languages)**    | 5            | 4            | 62.5      | TinyFish RAG (S19-21), AI provider chain, i18n (45 keys added S30) | Low-resource language quality; prompt engineering | AI Team        |
| **P1** | **Parent/teacher dashboard with predictive risk alerts**        | 4            | 3            | 53.3      | AnalyticsService (S37), WeeklyDigest (S34), RetentionService (S26) | Privacy (POPIA); alert fatigue                    | Analytics Team |
| **P1** | **Spaced repetition v2: FSRS-4.5 with per-card parameters**     | 4            | 3            | 53.3      | FlashcardEngine (S8), SM-2 migration done, FSRS types exist        | Parameter tuning; backward compat                 | Flashcard Team |
| **P2** | **AI essay/long-answer grading with rubric feedback**           | 4            | 4            | 40        | Grader (QuestionEngine), PromptManager, RAG context                | Hallucination risk; rubric alignment              | AI Team        |
| **P2** | **Gamified peer challenges (async duels, team battles)**        | 3            | 3            | 30        | GamificationEngine (S40), LiveSessions, Leaderboard                | Toxicity; cheating detection                      | Social Team    |
| **P2** | **AR/VR diagram exploration (Konva → WebXR bridge)**            | 3            | 5            | 18        | VisualEngine (S44), DiagramTheme, 8 Konva renderers                | Device support; motion sickness                   | Visual Team    |
| **P3** | **Offline voice notes (Whisper WASM → indexed audio)**          | 3            | 4            | 18.75     | STTEngine (S50), AudioEngine, Dexie blob storage                   | 74MB model download; storage quota                | Voice Team     |
| **P3** | **Curriculum alignment heatmap (CAPS topic coverage)**          | 3            | 3            | 25        | KnowledgeGraph (S25), CurriculumSource port, TinyFish              | Curriculum data freshness; mapping accuracy       | Content Team   |

---

## 2. Integration Plan

### 2.1 Architectural Implications

**Current Architecture Strengths**:

- DataAccess seam (10 domain sub-interfaces, Dexie + InMemory impls) — enables testability and gradual migration
- CachedAIGenerator<T> pattern — reusable for any AI→cache flow
- Effect TS adoption (hold) — async composition ready when needed
- createRouteHandler factory — 50+ routes standardized
- QueueCore + Sync outbox — reliable background processing foundation

**Required Evolution**:

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTEGRATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Event Bus (Zustand + BroadcastChannel) ← NEW                   │
│  ├── quiz.completed → competency.update, flashcard.create,     │
│  │   retention.schedule, analytics.event, gamification.xp      │
│  ├── study.session.end → planner.sync, streak.update,          │
│  │   digest.schedule, parent.notify                            │
│  ├── live.session.join → presence.sync, recording.start        │
│  └── sync.conflict → resolution.ui, data.merge                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Integration Points

| Source          | Event                                 | Consumers                                                                   | Contract                                  | Back-compat                                                |
| --------------- | ------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| QuizEngine      | `quiz.completed`                      | CompetencyEngine, FlashcardEngine, RetentionEngine, Analytics, Gamification | `QuizResultPayload` (discriminated union) | v1 fields preserved; v2 adds `ragContext`, `visualContext` |
| FlashcardEngine | `card.reviewed`                       | CompetencyEngine, StudyPlanner, StreakService                               | `FlashcardReviewEvent`                    | SM-2/FSRS fields both emitted                              |
| StudyPlanner    | `plan.generated`                      | NotificationService, ParentDigest, CalendarExport                           | `StudyPlanEvent`                          | iCal + JSON dual export                                    |
| SyncEngine      | `sync.conflict`                       | ConflictResolver (UI), DataAccess                                           | `SyncConflict<T>`                         | Three-way merge strategy                                   |
| VoiceEngine     | `tts.synthesized` / `stt.transcribed` | QuizCard, Pronunciation, Lessons                                            | `AudioPayload`                            | Blob URL + base64 fallback                                 |

### 2.3 API Contracts (New/Extended)

```typescript
// POST /api/engine/generate — extended response
interface GenerateResult {
  questions: Question[];
  ragContext?: RagContext; // NEW: structured return (S37)
  visualContext?: VisualAsset[]; // NEW: pre-generated diagrams
  warnings?: string[]; // NEW: consent-denied, rate-limit, etc.
}

// POST /api/sync/push — Phase B
interface SyncPushRequest {
  checkpoint: string; // last known server version
  operations: SyncOperation[]; // upsert/delete with vector clocks
}
interface SyncPushResponse {
  checkpoint: string;
  conflicts: SyncConflict[]; // server-side conflict detection
  accepted: string[]; // operation IDs accepted
}

// GET /api/engine/adaptive-plan
interface AdaptivePlanRequest {
  targetAps: number;
  dailyMinutes: number;
  horizonDays: number;
  weakTopicsOnly?: boolean;
}
interface AdaptivePlanResponse {
  sessions: StudySession[];
  competencyGaps: CompetencyGap[];
  projectedAps: number;
  confidence: number; // 0-1 based on data completeness
}
```

### 2.4 Authentication & Authorization

- **Current**: Anonymous → email/password upgrade; admin magic-link + OTP; no RBAC beyond `isAdmin` flag
- **Needed**: Role-based access (Student, Teacher, Parent, Admin) with scoped permissions
- **Implementation**: Extend `createRouteHandler` with `AuthMode.RoleBased`; add `requireRole()` guard; JWT claims include `roles: string[]`
- **Back-compat**: Anonymous users retain full student access; teacher/parent features gated by role claim

### 2.5 Backward Compatibility Strategy

| Change                           | Strategy                                                              | Timeline  |
| -------------------------------- | --------------------------------------------------------------------- | --------- |
| DataAccess sub-interfaces        | Barrel re-exports from `@/lib/db`; composite `DataAccess` still works | Immediate |
| GenerateResult structured return | `questions` array at top level; `ragContext` optional                 | v1.1      |
| Event bus                        | Opt-in subscribers; existing direct calls preserved                   | v1.2      |
| Role-based auth                  | `isAnonymous` checks unchanged; new `hasRole()` additive              | v1.3      |
| FSRS parameters                  | Dual-write SM-2 + FSRS fields; migration script                       | v1.4      |

### 2.6 UX Integration Considerations

- **Progressive disclosure**: New features behind feature flags (`NEXT_PUBLIC_FEATURE_*`) — default on for beta cohort
- **Onboarding integration**: New user flow includes "collaborative study" and "voice practice" opt-in screens
- **Offline indicators**: Sync status pill in TopNav (green/yellow/red) with tap-to-details
- **Cross-feature entry points**: "Practice weak topics" button on quiz results → adaptive quiz; "Study together" on flashcard deck → live session invite

---

## 3. Synergy Map

| Synergy                                                      | Scenario                                                                                                                      | Expected Value                                                    | Collaboration                                                      | Timeline |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| **Quiz → Flashcards → Competency → Planner**                 | Wrong answer in quiz → auto-create flashcard → updates competency → planner reschedules weak topic                            | 40% reduction in manual review setup friction; 25% retention lift | QuizEngine, FlashcardEngine, CompetencyEngine, StudyPlannerService | Q3 2026  |
| **RAG + Visual Engine + Voice**                              | "Explain this diagram" → RAG fetches CAPS ref → VisualEngine renders → TTS narrates                                           | Multi-modal accessibility; 3× engagement on STEM                  | TinyFish, VisualEngine, VoiceEngine, QuestionEngine                | Q3 2026  |
| **Live Sessions + Gamification + Leaderboard**               | Team battle mode: 3v3 quiz relay → real-time presence → shared XP pool → weekly league                                        | Viral coefficient +0.15; DAU +18%                                 | Ably, GamificationService, LeaderboardService, QuizEngine          | Q4 2026  |
| **Teacher Observations + Parent Digest + Predictive Alerts** | Teacher logs "struggling with calculus" → parent gets weekly digest with specific topic → student gets adaptive planner nudge | Early intervention; parent engagement +35%                        | TeacherTools, DigestService, RetentionEngine, StudyPlanner         | Q4 2026  |
| **Past Papers + Knowledge Graph + Adaptive Quiz**            | Ingested past paper → KG maps prerequisites → adaptive quiz targets gaps → tracks paper-specific competency (P1/P2)           | Exam readiness score; targeted practice                           | ExamPaperIngestion, KnowledgeGraph, QuizEngine, CompetencyEngine   | Q1 2027  |
| **Offline Packs + Sync + Voice**                             | Download quiz pack + TTS audio → study offline on bus → auto-sync results → competency updates                                | True offline-first; 60% users on intermittent connectivity        | QuizPackService, SyncEngine, VoiceEngine, STTEngine                | Q3 2026  |
| **Multilingual Content + RAG + Pronunciation**               | Generate question in isiZulu → RAG grounds in DBE doc → student practices pronunciation → phoneme feedback                    | Inclusion for 9M+ non-English HL learners                         | AI Provider Chain, TinyFish, VoiceEngine, PhonemeService           | Q1 2027  |

---

## 4. Edge Case & Risk Register

### 4.1 Usability & Accessibility

| Risk                                        | Likelihood      | Impact | Mitigation                                                                                            | Test Plan                                | Monitoring                          |
| ------------------------------------------- | --------------- | ------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------- |
| Immersive mode traps keyboard users         | Medium          | High   | Exit pill always focusable; `Esc` closes; focus trap restores to trigger                              | Axe + manual keyboard audit on quiz/exam | `immersive.exit.via.keyboard` event |
| Swipeable deck unusable on motor impairment | Medium          | High   | `mode="simple"` (tap buttons) default; SM-2 picker optional; `prefers-reduced-motion` disables spring | WCAG 2.2 AA audit; switch control test   | `flashcard.mode.simple.usage`       |
| 11-language i18n gaps (new features)        | High            | Medium | CI gate: `pnpm run i18n:check` fails build on missing keys; auto-PR for new strings                   | `next-intl` extract script in CI         | `i18n.missing.keys` counter         |
| Dark mode diagram contrast (Konva)          | Low (fixed S44) | High   | `useDiagramTheme()` palette enforced; CI visual regression on 8 renderers                             | Playwright visual diff on light/dark     | `diagram.contrast.violations`       |

### 4.2 Performance & Scalability

| Risk                                      | Likelihood | Impact   | Mitigation                                                                                        | Test Plan                                   | Monitoring                           |
| ----------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------ |
| Dexie 38+ tables → slow startup           | Medium     | Medium   | Lazy table init; `offlineDB.open()` deferred; `vite-plugin-pwa` precache only critical            | Lighthouse CI: TTI < 3s on 4G               | `dexie.open.latency.p95`             |
| AI budget exhaustion (2k/day)             | High       | High     | Per-user soft caps; Redis rate limiter; graceful degradation to cached questions                  | Load test: 5k concurrent users              | `ai.calls.remaining` gauge; 429 rate |
| Ably connection churn (mobile background) | High       | Medium   | `autoEnterLeave: false`; manual presence on visibilitychange; exponential backoff reconnect       | Network throttling test (Chrome DevTools)   | `ably.connection.state.duration`     |
| Sync conflict explosion (multi-device)    | Medium     | High     | Vector clocks + last-writer-wins for simple types; CRDT for flashcard state; UI conflict resolver | Chaos test: simultaneous edits on 3 devices | `sync.conflicts.per.day`             |
| 50k Appwrite doc limit                    | Low        | Critical | TTL cleanup cron (30d questions, 7d visuals, 30d study guides); archive to cold storage           | Simulated 60k docs; verify cron deletes     | `appwrite.docs.count`                |

### 4.3 Security & Privacy

| Risk                                 | Likelihood | Impact   | Mitigation                                                                                           | Test Plan                                | Monitoring                                     |
| ------------------------------------ | ---------- | -------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| POPIA non-compliance (minors' data)  | Low        | Critical | Consent gate (analytics/marketing/data-sharing); data export/delete; DPA with Appwrite               | Legal audit; automated consent flow test | `consent.grant.rate`; `data.deletion.requests` |
| AI prompt injection via user content | Medium     | High     | TinyFish `buildPromptInstruction()` frames reference material; input sanitization; output validation | Red-team prompts in test suite           | `ai.prompt.injection.blocked`                  |
| Web push VAPID key rotation          | Low        | Medium   | `PushDeliveryService` lazy init; rotation script in `scripts/rotate-vapid.ts`                        | Staging rotation drill quarterly         | `push.delivery.failure.rate`                   |
| CSP violation exfiltration           | Low        | High     | `report-to` + Sentry capture; `Cross-Origin-Resource-Policy: same-origin`                            | CSP evaluator scan                       | `csp.violations` (Sentry)                      |
| Ghost link token enumeration         | Low        | Medium   | 30-day expiry; rate-limited lookup; audit log                                                        | Fuzz token endpoint                      | `ghost.link.404.rate`                          |

### 4.4 Regulatory & Compliance

| Area                              | Requirement                             | Status  | Gap                                                             | Action                                                            |
| --------------------------------- | --------------------------------------- | ------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| POPIA (SA)                        | Lawful basis, consent, access, deletion | Partial | Automated consent logging; retention schedule doc               | Implement consent audit trail; 90-day retention policy            |
| WCAG 2.2 AA                       | Contrast, focus, landmarks, ARIA        | 95%     | Remaining: `text-white` on accent (13 sites), Konva ARIA labels | Sprint to close P2 a11y items (TODO.md)                           |
| COPPA / Children's Online Privacy | Parental consent <13                    | N/A     | Matric learners typically 17-18                                 | Document age gate assumption                                      |
| GDPR (if EU users)                | Art. 15/17/20                           | Partial | Export exists; deletion exists; DPA with subprocessors          | Map subprocessors (Appwrite, Ably, Upstash, Deepgram, ElevenLabs) |

### 4.5 Localization (11 SA Languages)

| Gap                                                                   | Languages Affected | Effort                            | Owner         |
| --------------------------------------------------------------------- | ------------------ | --------------------------------- | ------------- |
| AI-generated content quality (isiXhosa, Siswati, Tshivenda, Xitsonga) | 4 low-resource     | High (prompt engineering + eval)  | AI Team       |
| TTS voice availability (Google supports af-ZA, zu-ZA, en-ZA only)     | 8 languages        | Medium (ElevenLabs custom voices) | Voice Team    |
| STT accuracy (Whisper WASM multilingual)                              | All                | Medium (fine-tune on SA accents)  | STT Team      |
| Date/number formatting (locale-aware)                                 | All                | Low (Intl.DateTimeFormat)         | Frontend Team |
| RTL support (Arabic not in 11)                                        | N/A                | N/A                               | —             |

### 4.6 Fault Tolerance & Incident Response

| Scenario                        | Detection                        | Response                                                           | Runbook                       |
| ------------------------------- | -------------------------------- | ------------------------------------------------------------------ | ----------------------------- |
| AI provider chain total failure | `ai.client.errors` > 50% in 5m   | Fallback to cached questions only; disable generate; alert on-call | `RUNBOOK-ai-chain-failure.md` |
| Appwrite outage                 | Health check `/api/health` fails | Read-only mode (Dexie only); queue writes to sync outbox           | `RUNBOOK-appwrite-down.md`    |
| Ably connection storm           | `ably.connections` > 10k         | Throttle token endpoint; circuit breaker                           | `RUNBOOK-ably-storm.md`       |
| Dexie corruption (IndexedDB)    | `Dexie.DatabaseClosedError`      | `offlineDB.delete()` + re-sync from Appwrite                       | `RUNBOOK-dexie-corrupt.md`    |
| Sentry DSN leak                 | Secret scanning (GitHub)         | Rotate DSN; purge events                                           | `RUNBOOK-sentry-leak.md`      |

---

## 5. Assumptions & Constraints

| Assumption                                            | Validation Needed                   |
| ----------------------------------------------------- | ----------------------------------- |
| Matric students have Android 8+/iOS 14+ devices       | Analytics: device distribution      |
| 60%+ users on intermittent connectivity               | Network quality telemetry           |
| Teachers willing to adopt digital assignment workflow | Teacher beta program (10 schools)   |
| Parents opt-in to push notifications (target 40%)     | Current `dailyDigest` toggle uptake |
| DBE past papers available for ingestion (copyright)   | Legal review                        |
| AI provider free tiers sustain 2k calls/day           | Contract review; budget forecast    |
| Appwrite 50k doc limit sufficient for 12 months       | Growth projection model             |

**Hard Constraints**:

- No new paid dependencies (budget freeze)
- Team capacity: 4 engineers (2 frontend, 1 backend, 1 ML/AI)
- Release cadence: 2-week sprints; 1 major release/month
- Zero-downtime deployments required

---

## 6. Prioritized Backlog (Next 6 Sprints)

| Sprint | Theme                         | Stories                                                                                                                                                                                                                  | Owner                 | Decision Gate                                                |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------ |
| **S1** | Offline Quiz Packs            | 1. Background pack generation (QuizPackService + QueueCore)<br>2. Service Worker precache + update flow<br>3. Storage quota UI + eviction policy<br>4. Offline indicator in TopNav                                       | Sync + Quiz           | ✅ Pack downloads < 30s; ✅ Works offline 24h                |
| **S2** | Adaptive Planner v2           | 1. Competency → schedule algorithm (inverse-weight round-robin)<br>2. `GET /api/engine/adaptive-plan` endpoint<br>3. Dashboard "Generate Plan" → plan picker → calendar view<br>4. Parent digest includes plan adherence | Study + Analytics     | ✅ Plan adherence > 60%; ✅ Competency gap closure > 15%     |
| **S3** | Collaborative Study MVP       | 1. Ably room + presence (reuse S45)<br>2. Shared whiteboard (Konva + Yjs or Automerge)<br>3. Voice chat (WebRTC mesh, max 4)<br>4. "Study Together" entry from flashcard/quiz                                            | Social + Voice        | ✅ 4-user session < 100ms latency; ✅ Rejoin < 3s            |
| **S4** | Past Paper Pipeline           | 1. PDF upload → OCR → question extraction (ExamPaperIngestion)<br>2. Human review queue (admin)<br>3. Structured Question DB insert + competency tag<br>4. "Past Paper Practice" mode (P1/P2 split)                      | Content + AI          | ✅ 10 papers ingested/week; ✅ Extraction accuracy > 85%     |
| **S5** | Multilingual AI + Voice       | 1. Prompt templates per language (11 locales)<br>2. ElevenLabs custom voices for 3 priority langs<br>3. Whisper fine-tune on SA accent dataset<br>4. Language selector in quiz/flashcard/pronunciation                   | AI + Voice            | ✅ isiZulu/afr quality ≥ en-ZA; ✅ TTS latency < 2s          |
| **S6** | Predictive Analytics + Alerts | 1. Risk model (quiz streak, competency trend, session freq)<br>2. Teacher alert dashboard + parent push<br>3. Student "You're slipping" nudge (in-app)<br>4. A/B test nudge copy/timing                                  | Analytics + Retention | ✅ Alert precision > 70%; ✅ No alert fatigue (opt-out < 5%) |

---

## 7. Validation Plan & Metrics

### 7.1 North Star Metric

**Weekly Active Learners (WAL) completing ≥1 quiz/flashcard session** — target: 15,000 by Dec 2026 (from ~8,000)

### 7.2 Leading Indicators per Sprint

| Sprint | Primary Metric                  | Target                                               | Measurement                                      |
| ------ | ------------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| S1     | Offline pack adoption rate      | 30% of active users download ≥1 pack                 | `quiz_pack.downloaded` / `wal`                   |
| S2     | Plan adherence                  | 60% of generated plans have ≥80% session completion  | `study_plan.sessions_completed` / `total`        |
| S3     | Collaborative session join rate | 15% of flashcard/quiz users join ≥1 session/mo       | `live_session.joined` / `wal`                    |
| S4     | Past paper practice sessions    | 25% of exam-page visitors start a past paper session | `exam_paper.session_started` / `exam_page.views` |
| S5     | Non-English quiz generation     | 20% of quizzes generated in non-English locale       | `quiz.generated.locale!=en` / `total`            |
| S6     | Alert-driven re-engagement      | 40% of alerted users complete a session within 48h   | `alert.sent` → `session.completed` within 48h    |

### 7.3 Decision Gates

| Gate            | Criteria                                                                     | Go/No-Go   |
| --------------- | ---------------------------------------------------------------------------- | ---------- |
| **S1 → S2**     | Offline pack success rate > 95%; no data loss on sync                        | ✅ Proceed |
| **S2 → S3**     | Plan adherence > 50% (early signal); no regressions in quiz/flashcard        | ✅ Proceed |
| **S3 → S4**     | Collaborative session crash-free rate > 99.5%; Ably costs < $200/mo          | ✅ Proceed |
| **S4 → S5**     | Paper ingestion pipeline processes 10 papers/week with < 15% manual fix rate | ✅ Proceed |
| **S5 → S6**     | Multilingual quality eval (native speaker) ≥ 4/5 on 3 languages              | ✅ Proceed |
| **S6 → Launch** | North Star WAL +25% vs baseline; churn < 5%/mo; zero P0 bugs                 | 🚀 Release |

### 7.4 Monitoring Dashboard (Grafana/Sentry)

- **Real-time**: AI budget, sync queue depth, Ably connections, error rate
- **Daily**: WAL, DAU/MAU, quiz completion rate, flashcard review rate, plan adherence
- **Weekly**: Competency distribution shift, past paper usage, multilingual adoption, alert precision/recall
- **Monthly**: Retention cohorts (D1/D7/D30), NPS (in-app survey), support ticket themes

---

## 8. Information Gaps & Clarification Requests

1. **Teacher/Parent Beta Access**: Do we have 10+ schools signed up for S3/S4 teacher features? Need list for pilot.
2. **DBE Past Paper License**: Legal confirmation on ingestion rights for NSC papers (2018-2024).
3. **ElevenLabs Custom Voice Budget**: Cost for 3 SA language voices (~$300/mo each?) — need approval.
4. **Whisper Fine-tune Dataset**: Access to SA accent audio corpus (NCH/CSIR?) for STT improvement.
5. **POPIA DPA Status**: Are Data Processing Agreements signed with Appwrite, Ably, Upstash, Deepgram, ElevenLabs?
6. **Team Capacity Confirmation**: 4 engineers confirmed for 6 sprints? Any hiring planned?
7. **Success Metric Baseline**: Current WAL, DAU/MAU, quiz completion rate — need analytics export for baseline.

---

_Document Version: 1.0 | Author: Senior Product Strategist | Date: 2026-07-15_
_Next Review: Sprint 1 Planning (2026-07-22)_
