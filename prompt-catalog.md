# Prompt Catalog — Lumni

**Generated:** 2026-05-22  
**Last updated:** June 2026 (Sessions 15-19)  
**Note:** No dedicated `prompts/` directory exists. Prompts are embedded in agent config files, skill definitions, and spec docs. Catalog below consolidates all discoverable prompt contexts.

---

## Agent System Prompts

### ID: `agent-domain-context`

- **Purpose:** Establishes shared domain vocabulary for AI agents working on the codebase.
- **When to use:** Always — prepend to every agent prompt that touches this repo.
- **Inputs:** `CONTEXT.md` (domain glossary with Anonymous User, Authenticated User, Top Nav, Clean Layout, Sync Queue, Magic Link, Profile Fields, QueueCore, RateLimiter, QuestionEngine, LearningOrchestrator, QuizSession).
- **Outputs:** Shared context document; agents speak the same language as the codebase.
- **Token estimate:** ~800 tokens (163 lines)
- **Location:** `CONTEXT.md`
- **Last validated:** 2026-05-22

### ID: `agent-engine-architecture`

- **Purpose:** Details Question Engine and Visual Engine architectures, API endpoints, caching strategy, AI provider chain, and math conventions.
- **When to use:** When generating, grading, or visualizing questions; when working with AI providers.
- **Inputs:** Subject, question type, diagram type, caching layer to use.
- **Outputs:** Correct API call patterns, component imports, and caching behavior.
- **Token estimate:** ~1,200 tokens (212 lines)
- **Location:** `AGENTS.md`
- **Last validated:** 2026-05-22 (session 6)

---

## Design System Prompts

### ID: `design-system-emerald`

- **Purpose:** Enforces "The Emerald Study Room" design language: OKLCH colors, typography, spacing, component anatomy.
- **When to use:** Creating or modifying UI components, adding pages, theming work.
- **Inputs:** Component type, variant, state.
- **Outputs:** Designs consistent with Study Green (`oklch(52% 0.18 146)`), Warm Paper neutrals, Outfit/Geist fonts, 20px card radius, 44px touch targets.
- **Token estimate:** ~1,500 tokens (300 lines)
- **Location:** `DESIGN.md`
- **Last validated:** 2026-05-22

### ID: `impeccable-ui-audit`

- **Purpose:** Full UI/UX audit workflow: preflight gates, context gathering, heuristic scoring, critique and fix.
- **When to use:** Redesigns, polish passes, accessibility audits, UX reviews.
- **Inputs:** Component/page to audit, product context from PRODUCT.md, design system from DESIGN.md.
- **Outputs:** Audit report with heuristic scores, prioritized fixes, edited code.
- **Token estimate:** ~900 lines across 34 reference files
- **Location:** `.agents/skills/impeccable/SKILL.md` + `reference/*.md`
- **Last validated:** 2026-05-22

---

## Feature Spec Prompts (docs/superpowers/specs/)

### ID: `spec-question-engine`

- **Purpose:** Design document for 11-type question engine with processor architecture, OpenAI function calling, and validation pipeline.
- **When to use:** Modifying QuestionEngine, adding new question types, changing validation.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~1,500 tokens
- **File:** `docs/superpowers/specs/2026-05-11-question-engine-design.md`
- **Last validated:** 2026-05-22

### ID: `spec-exam-smart-view`

- **Purpose:** Full-screen markdown exam dialog with PDF conversion via `markdown.new`.
- **When to use:** Working on exam paper viewer or PDF conversion.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~800 tokens
- **File:** `docs/superpowers/specs/2026-05-11-exam-smart-view-design.md`
- **Last validated:** 2026-05-20

### ID: `spec-lottie-expansion`

- **Purpose:** Lottie animation integration plan for dashboard stats, quiz polish, micro-interactions.
- **When to use:** Adding or modifying Lottie animations.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~1,000 tokens
- **File:** `docs/superpowers/specs/2026-05-12-lottie-expansion-design.md`
- **Last validated:** 2026-05-20

### ID: `spec-apple-design-system`

- **Purpose:** Apple HIG-inspired design system with OKLCH colors, frosted glass, type scale.
- **When to use:** Advanced UI polish, glassmorphism, Apple-style components.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~1,200 tokens
- **File:** `docs/superpowers/specs/2026-05-13-apple-design-system.md`
- **Last validated:** 2026-05-22

### ID: `spec-competency-sync-fix`

- **Purpose:** Fix for API routes crashing on server, dead client hooks, incomplete Appwrite sync.
- **When to use:** Debugging competency sync issues.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~600 tokens
- **File:** `docs/superpowers/specs/2026-05-13-competency-sync-hooks-fix-design.md`
- **Last validated:** 2026-05-22

### ID: `spec-learning-experience`

- **Purpose:** Phase 2 architecture: Curriculum Engine, Competency System, PathEngine with Bloom's taxonomy.
- **When to use:** Extending competency engine, adding curriculum features.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~1,500 tokens
- **File:** `docs/superpowers/specs/2026-05-13-learning-experience-design.md`
- **Last validated:** 2026-05-22

### ID: `spec-orchestrator-job-queue`

- **Purpose:** Phase 1 architecture: LearningOrchestrator + JobQueue with retry/priority/monitoring.
- **When to use:** Modifying orchestrator or job queue.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~1,200 tokens
- **File:** `docs/superpowers/specs/2026-05-13-orchestrator-job-queue-design.md`
- **Last validated:** 2026-05-22

### ID: `spec-inline-overlays`

- **Purpose:** Kill PracticeSheet; replace with inline overlays on dashboard.
- **When to use:** Modifying quiz practice flow or dashboard overlays.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~600 tokens
- **File:** `docs/superpowers/specs/2026-05-14-inline-overlays-design.md`
- **Last validated:** 2026-05-20

### ID: `spec-photo-math-scanner`

- **Purpose:** Camera capture -> AI solver pipeline for photo math scanning.
- **When to use:** Building or modifying photo math feature.
- **Inputs:** N/A (reference spec)
- **Outputs:** Shared design understanding.
- **Token estimate:** ~800 tokens
- **File:** `docs/superpowers/specs/2026-05-15-photo-math-scanner-design.md`
- **Last validated:** 2026-05-20

---

## Implementation Plan Prompts (.kilo/plans/)

### ID: `plan-markdown-renderer`

- **Purpose:** Add Markdown/KaTeX support to StudyTopicCard (replace plain text with MarkdownRenderer).
- **When to use:** Implementing the study topic card enhancement.
- **Inputs:** Component to modify, rendering approach.
- **Outputs:** Implementation steps.
- **Token estimate:** ~300 tokens
- **File:** `.kilo/plans/1778596134481-stellar-sailor.md`
- **Last validated:** 2026-05-22

### ID: `plan-bottom-nav-fix`

- **Purpose:** Fix bottom nav transparent background — wrong CSS variable and misplaced border.
- **When to use:** Fixing navigation styling issues.
- **Inputs:** CSS variables, component structure.
- **Outputs:** Fix steps.
- **Token estimate:** ~300 tokens
- **File:** `.kilo/plans/1778603375543-eager-panda.md`
- **Last validated:** 2026-05-22

### ID: `plan-lottie-to-phosphor`

- **Purpose:** Replace all Lottie animations with Phosphor React icons (15 animations mapped, 30+ files).
- **When to use:** Migration from Lottie to Phosphor icons.
- **Inputs:** Animation-to-icon mapping table.
- **Outputs:** Migration implementation steps.
- **Token estimate:** ~500 tokens
- **File:** `.kilo/plans/1778788104993-silent-nebula.md`
- **Last validated:** 2026-05-22

---

## Domain Context Prompts

### ID: `product-context`

- **Purpose:** Establishes brand identity: Matric students in South Africa, playful & energetic, Study Green accent.
- **When to use:** Any feature design or UI decision.
- **Inputs:** Target user, brand traits.
- **Outputs:** Design principles alignment.
- **Token estimate:** ~100 tokens (20 lines)
- **Location:** `PRODUCT.md`
- **Last validated:** 2026-05-22

### ID: `exam-dates-spec`

- **Purpose:** National Exam Dates Tracker specification: tiered cache, session detection, widget styles, future work.
- **When to use:** Working on exam dates feature.
- **Inputs:** Calendar data, session logic.
- **Outputs:** Implementation guidance.
- **Token estimate:** ~800 tokens (152 lines)
- **Location:** `SPEC.md`
- **Last validated:** 2026-05-22

---

## Deprecated

| ID                       | Reason                                                         | Replaced By                                                  |
| ------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `spec-deepseek-provider` | DeepSeek removed as AI provider (too expensive)                | `src/lib/ai/client.ts` now uses Gemini -> Nvidia NIM -> Groq |
| `plan-practice-sheet`    | PracticeSheet killed in favor of inline overlays               | `spec-inline-overlays`                                       |
| `lottie-react-imports`   | Migrated from `lottie-react` to `@lottiefiles/dotlottie-react` | See `docs/issues/lottie-web-unpin.md`                        |
