<!-- LAST_SYNC: 2026-05-24 -->
# Prompt Index — Lumni

| ID | Category | Prompt Name | File Path | Purpose | Key Variables | When to Use | Status |
|----|----------|-------------|-----------|---------|---------------|-------------|--------|
| P001 | Domain | `agent-domain-context` | `CONTEXT.md` | Establishes domain vocabulary for agents | N/A | Always prepend to agent prompts | [active][system] |
| P002 | Engine | `agent-engine-architecture` | `AGENTS.md` | Details Question/Visual Engine architecture | subject, type | Working on gen/grade/visual | [active][system] |
| P003 | Design | `design-system-emerald` | `DESIGN.md` | Enforces "Emerald Study Room" design | component | Creating/modifying UI | [active][system] |
| P004 | Design | `impeccable-ui-audit` | `.agents/skills/impeccable/` | Full UI/UX audit workflow | page/component | During UI polish passes | [active][task] |
| P005 | Spec | `spec-question-engine` | `docs/superpowers/specs/2026-05-11-question-engine-design.md` | Design for 11-type question engine | N/A | Modifying QuestionEngine | [active][spec] |
| P006 | Spec | `spec-exam-smart-view` | `docs/superpowers/specs/2026-05-11-exam-smart-view-design.md` | Full-screen markdown exam dialog | N/A | Working on exam viewer | [active][spec] |
| P007 | Spec | `spec-lottie-expansion` | `docs/superpowers/specs/2026-05-12-lottie-expansion-design.md` | Lottie animation integration plan | N/A | Adding animations | [active][spec] |
| P008 | Spec | `spec-apple-design-system` | `docs/superpowers/specs/2026-05-13-apple-design-system.md` | Apple HIG-inspired design system | N/A | Advanced UI polish | [active][spec] |
| P009 | Spec | `spec-learning-experience` | `docs/superpowers/specs/2026-05-13-learning-experience-design.md` | Curriculum/Competency Engine design | N/A | Extending competency engine | [active][spec] |
| P010 | Spec | `spec-orchestrator-job-queue` | `docs/superpowers/specs/2026-05-13-orchestrator-job-queue-design.md` | Orchestrator and JobQueue design | N/A | Modifying orchestrator | [active][spec] |
| P011 | Spec | `spec-photo-math-scanner` | `docs/superpowers/specs/2026-05-15-photo-math-scanner-design.md` | AI solver for photo math scanning | N/A | Working on photo math | [active][spec] |
| P012 | Plan | `plan-markdown-renderer` | `.kilo/plans/1778596134481-stellar-sailor.md` | Markdown/KaTeX support implementation | N/A | Implementing study card fix | [active][plan] |

## Key Variable Descriptions
- `subject`: The educational subject (e.g., mathematics, physical-sciences).
- `questionType`: One of the 11 supported question types.
- `component`: The React component being audited or designed.
