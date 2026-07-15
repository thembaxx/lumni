# Legal & Compliance Checklist — 7 Information Gaps

*Source: PRODUCT_STRATEGY_ASSESSMENT.md §8 | Date: 2026-07-15*

---

## Gap 1: Teacher Beta School Commitments

**Question**: Do we have 10+ schools signed up for teacher features beta (assignments, observations, ghost links, reports)?

| Item | Status | Owner | Due | Evidence |
|------|--------|-------|-----|----------|
| Signed MOUs / LOIs from schools | ⬜ Not started | Partnerships | Sprint 1 | PDF/email archive |
| Contact list: principal + IT lead + 2 teacher champions per school | ⬜ Not started | Partnerships | Sprint 1 | CRM export |
| Data Processing Agreement (DPA) template reviewed by legal | ⬜ Not started | Legal | Sprint 1 | Signed DPA |
| Pilot scope document: features, duration, success metrics, exit criteria | ⬜ Not started | Product | Sprint 1 | Confluence page |
| Onboarding timeline per school (IT setup, teacher training, student roster) | ⬜ Not started | CS/Ops | Sprint 2 | Project plan |

**Decision Gate**: Sprint 1 Planning — if < 5 schools committed, defer Teacher Tools to P2.

---

## Gap 2: DBE Past Paper License (Copyright)

**Question**: Legal confirmation on ingestion rights for DBE NSC/SC past papers (2018-2024)?

| Item | Status | Owner | Due | Evidence |
|------|--------|-------|-----|----------|
| DBE copyright policy document obtained | ⬜ Not started | Legal | Sprint 1 | PDF from DBE website |
| Legal opinion: educational use exception (SA Copyright Act §12-13) | ⬜ Not started | Legal | Sprint 1 | Memo |
| Confirmation: papers published on education.gov.za = public domain? | ⬜ Not started | Legal | Sprint 1 | Email/letter |
| Alternative: license from DBE / provincial depts / Umalusi | ⬜ Not started | Partnerships | Sprint 2 | License agreement |
| Fallback: only ingest papers with explicit CC-BY / open license | ⬜ Not started | Content | Sprint 2 | Source list |

**Decision Gate**: Sprint 1 Review — if no clear license, restrict to open-license papers only (limits corpus ~40%).

---

## Gap 3: ElevenLabs Custom Voice Budget

**Question**: Approved budget for 3 SA language custom voices (~$300/mo each = $900/mo = $10.8k/yr)?

| Item | Status | Owner | Due | Evidence |
|------|--------|-------|-----|----------|
| Quote from ElevenLabs for af-ZA, zu-ZA, xh-ZA custom voices | ⬜ Not started | Voice Team | Sprint 1 | Quote PDF |
| Cost-benefit: custom vs. existing Google Cloud TTS (af-ZA, zu-ZA, en-ZA free tier) | ⬜ Not started | Voice Team | Sprint 1 | Analysis doc |
| Budget approval from Finance (capex vs opex) | ⬜ Not started | Engineering Lead | Sprint 1 | Email approval |
| Timeline: voice training (2-4 weeks) + integration (1 sprint) | ⬜ Not started | Voice Team | Sprint 2 | Project plan |
| Fallback: use Google Cloud TTS for 3 langs, defer custom voices to Q1 2027 | ⬜ Not started | Voice Team | Sprint 2 | Decision log |

**Decision Gate**: Sprint 1 Planning — if budget not approved, use Google TTS for P0 launch.

---

## Gap 4: Whisper SA Accent Dataset

**Question**: Access to SA accent audio corpus for Whisper fine-tuning (NCH/CSIR/SABC/University datasets)?

| Item | Status | Owner | Due | Evidence |
|------|--------|-------|-----|----------|
| NCH (National Corpus of SA English) access request | ⬜ Not started | ML Team | Sprint 1 | Application |
| CSIR / Meraka Institute collaboration discussion | ⬜ Not started | Partnerships | Sprint 2 | Meeting notes |
| SABC archive licensing for broadcast audio | ⬜ Not started | Legal | Sprint 2 | License terms |
| University linguistics depts (UCT, UP, Wits, Stellenbosch) data sharing | ⬜ Not started | ML Team | Sprint 2 | DSA/MOU |
| Synthetic augmentation: TTS-generated SA accent data (ElevenLabs/Google) | ⬜ Not started | ML Team | Sprint 1 | Experiment results |
| Baseline: current Whisper WASM (ggml-tiny) WER on SA accents | ⬜ Not started | ML Team | Sprint 1 | Benchmark report |

**Decision Gate**: Sprint 2 — if no dataset access, use synthetic + few-shot prompting only (limits STT accuracy to ~75%).

---

## Gap 5: POPIA DPA Status with Subprocessors

**Question**: Are Data Processing Agreements (DPAs) signed with all subprocessors per POPIA §20-21?

| Subprocessor | Purpose | DPA Signed? | POPIA Compliant? | Owner | Due |
|--------------|---------|-------------|------------------|-------|-----|
| **Appwrite Cloud** | Auth, DB, Storage, Functions | ⬜ | ✅ (EU/SA regions) | Eng Lead | Sprint 1 |
| **Ably** | Real-time presence, chat | ⬜ | ❓ (UK/US) | Eng Lead | Sprint 1 |
| **Upstash (Redis)** | Rate limiting, caching | ⬜ | ❓ (US) | Eng Lead | Sprint 1 |
| **Deepgram** | STT (planned) | ⬜ | ❓ (US) | Voice Team | Sprint 2 |
| **ElevenLabs** | TTS | ⬜ | ❓ (US) | Voice Team | Sprint 2 |
| **Google Cloud** | TTS fallback, Vision API | ⬜ | ✅ (SA region avail) | Voice Team | Sprint 1 |
| **Nvidia NIM** | AI fallback (Llama-3.3-70B) | ⬜ | ❓ (US) | AI Team | Sprint 1 |
| **Groq** | AI fallback (Llama-3.3-70B) | ⬜ | ❓ (US) | AI Team | Sprint 1 |
| **Vercel** | Hosting, Edge Functions | ⬜ | ✅ (EU regions) | Eng Lead | Sprint 1 |
| **Sentry** | Error tracking, perf | ⬜ | ✅ (EU region) | Eng Lead | Sprint 1 |

**Action Required**: 
- [ ] Inventory all subprocessors (above + any new)
- [ ] Request DPA from each (standard template)
- [ ] Map data flows: what PII goes where (userId, email, quiz answers, voice recordings)
- [ ] Update Privacy Policy with subprocessor list
- [ ] Implement "Right to be Forgotten" cascade delete across all subprocessors

**Decision Gate**: Sprint 1 — zero tolerance for unsigned DPAs with PII processors.

---

## Gap 6: Team Capacity Confirmation

**Question**: 4 engineers confirmed for 6 sprints? Any hiring planned?

| Role | Current | Needed | Gap | Hiring Status | Owner |
|------|---------|--------|-----|---------------|-------|
| Frontend (React/Next.js) | 2 | 2 | 0 | — | Eng Lead |
| Backend (Node/TS, Appwrite, QueueCore) | 1 | 1 | 0 | — | Eng Lead |
| ML/AI (Prompt eng, RAG, fine-tune, eval) | 1 | 1.5 | 0.5 | 🔍 Searching | Eng Lead |
| DevOps/Infra (Vercel, Sentry, CI/CD, Redis) | 0.5 (shared) | 0.5 | 0 | — | Eng Lead |
| QA/Automation (Playwright, Vitest, Contract testing) | 0 | 0.5 | 0.5 | 🔍 Searching | Eng Lead |
| Designer (UI/UX, design system, a11y) | 0 | 0.5 | 0.5 | 🔍 Searching | Eng Lead |

**Sprint Capacity Model** (per 2-week sprint):
- 4 engineers × 80h = 320h gross
- -20% meetings/ops = 256h net
- -15% bug fix/maintenance = 218h feature
- **Target**: 2 P0 + 1 P1 per sprint = ~180h (feasible with 10% buffer)

**Decision Gate**: Sprint 0 — confirm headcount; if ML hire not started, defer Multilingual (P1) to Sprint 4+.

---

## Gap 7: Baseline Analytics Export

**Question**: Current WAL/DAU/MAU, quiz completion, flashcard review rates exported for baseline?

| Metric | Current Value | Source | Export Status | Owner |
|--------|---------------|--------|---------------|-------|
| WAL (Weekly Active Learners) | ~8,000 | `analyticsEvents` (Dexie) | ⬜ Not exported | Analytics |
| DAU / MAU | — | `analyticsEvents` | ⬜ Not exported | Analytics |
| DAU/MAU Ratio | — | calculated | ⬜ Not exported | Analytics |
| Avg Sessions/User/Week | — | `analyticsEvents` | ⬜ Not exported | Analytics |
| Avg Session Duration | — | `analyticsEvents` | ⬜ Not exported | Analytics |
| Quiz Start → Complete Rate | — | `quizAttempts` + `analyticsEvents` | ⬜ Not exported | Analytics |
| Flashcard Review Rate (due→done) | — | `flashcards` (SM-2) | ⬜ Not exported | Analytics |
| Past Paper Practice Rate | — | `examSessions` | ⬜ Not exported | Analytics |
| AI Calls/User/Day (by type) | — | `dailyCallTracker` + Appwrite | ⬜ Not exported | Analytics |
| Sync Success Rate | — | `syncOutbox` | ⬜ Not exported | Sync Team |
| PWA Install Rate | — | `pwa_install` event | ⬜ Not exported | Analytics |
| Offline Usage % | — | `offline_visit` event | ⬜ Not exported | Analytics |

**Export Script Needed**: `scripts/export-baseline-metrics.ts`
- Queries Dexie `analyticsEvents`, `quizAttempts`, `flashcards`, `examSessions`, `syncOutbox`
- Outputs CSV + JSON to `output/baseline-metrics-YYYY-MM-DD/`
- Run before Sprint 1 kickoff

**Decision Gate**: Sprint 0 — baseline must exist before measuring Sprint 1 impact.

---

## Summary Dashboard

| Gap | Priority | Blocker? | Sprint 0 Action | Owner |
|-----|----------|----------|-----------------|-------|
| 1. Teacher Beta Schools | P0 | Yes (Teacher Tools) | Secure 5+ LOIs | Partnerships |
| 2. DBE Past Paper License | P0 | Yes (Past Paper Pipeline) | Legal opinion | Legal |
| 3. ElevenLabs Custom Voices | P1 | No (Google fallback) | Get quote + budget approval | Voice Team |
| 4. Whisper SA Accent Data | P1 | No (synthetic fallback) | Benchmark current WER | ML Team |
| 5. POPIA DPA Subprocessors | P0 | Yes (Compliance) | Inventory + request DPAs | Eng Lead |
| 6. Team Capacity | P0 | Yes (All sprints) | Confirm headcount + hiring | Eng Lead |
| 7. Baseline Metrics Export | P0 | Yes (Validation) | Run export script | Analytics |

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | | | |
| Legal Counsel | | | |
| Product Lead | | | |
| Data Protection Officer | | | |
| Finance | | | |

---

*This checklist must be completed before Sprint 1 Planning. Escalate any ⬜ items to weekly leadership sync.*