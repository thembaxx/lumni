# Batch 1 — Four Independent Features

**Date:** 2026-05-23

This spec covers four independent features that will be implemented in parallel.

---

## 1. Per-Exam APS Badge

### Problem
Students complete practice exams/quizzes but see only accuracy percentages. The APS (Admission Point Score) is how South African universities evaluate matric results — showing an APS-equivalent score makes practice results more meaningful and motivates improvement.

### Design

**1a. Extract shared APS utility**
```
src/lib/shared/aps.ts
```
Move the APS conversion logic from `src/components/tools/aps-calculator.tsx` into a shared utility:
- `getAPSForSubject(percentage: number): number` — maps 0-100% to 1-7 points
- `getGrade(percentage: number): string` — returns grade text ("Outstanding", "Meritorious", etc.)
- `calculateAPS(scores: { percentage: number; isLO?: boolean }[]): number` — top-6 aggregation (not used by badge but useful for future)

Update the standalone APS calculator to import from this utility instead of defining inline.

**1b. Exam results badge**
In `src/app/exam/[id]/exam-session-client.tsx`, after the accuracy percentage in the inner `ExamResults` component, display:
```
APS: {points}/7 ({grade})
```
Color-coded: green (7-6), amber (5-4), red (3-1).

**1c. Quiz results badge**
In `src/components/quiz/quiz-results.tsx`, same display after accuracy.

### Files changed
- `src/lib/shared/aps.ts` — new
- `src/app/exam/[id]/exam-session-client.tsx` — add badge
- `src/components/quiz/quiz-results.tsx` — add badge
- `src/components/tools/aps-calculator.tsx` — import from shared util

---

## 2. Audio Learning (TTS Expansion)

### Problem
TTS exists on question headers and flashcards but is missing from notes, answer options, and feedback text. Students who want auditory learning or have accessibility needs cannot listen to these surfaces.

### Design

**2a. Fix TTSButton callback bug**
`TTSButton` calls `ttsService.onEnd()` and `ttsService.onError()` directly on the singleton, which overwrites any callbacks set by `useTTS()`. Replace the single-callback pattern with an event-emitter or multi-subscriber list in `TTSService`.

**2b. Add TTS to note surfaces**
- `note-list.tsx` — `TTSButton` on each note card, reads note content
- `note-editor.tsx` — `TTSButton` beside the content area, reads current content

**2c. Add TTS to older flashcard component**
- `quiz/flashcard.tsx` — `TTSButton` on front and back (mirrors existing pattern in `flashcards-active.tsx`)

**2d. Add TTS to question options and feedback**
- `QuestionCardInput.tsx` — `TTSButton` per option (only for options >80 characters, to avoid clutter on short answer choices)
- `QuestionCardFeedback.tsx` — `TTSButton` on explanation/feedback text

### UI Pattern
Reuse existing `TTSButton` — `size-8 rounded-full` icon button with `VolumeUpIcon`/`VolumeMute01Icon`.

### Files changed
- `src/lib/utils/tts-service.ts` — fix callback overwrite bug
- `src/components/molecules/note-list.tsx` — add TTSButton
- `src/components/molecules/note-editor.tsx` — add TTSButton
- `src/components/quiz/flashcard.tsx` — add TTSButton
- `src/components/quiz/parts/QuestionCardInput.tsx` — add TTSButton per option
- `src/components/quiz/parts/QuestionCardFeedback.tsx` — add TTSButton

---

## 3. Photo Math Scanner — Snap FAB

### Problem
The photo math scanner backend (camera capture, AI extraction, editable confirm, step-by-step solving) is fully implemented in `AiSolver`. The spec requires a visible camera FAB on math-subject quiz/exam screens, but the `onToolClick` prop is destructured in `QuestionCardHeader` but never rendered.

### Design
In `QuestionCardHeader`, render a small camera FAB when `isMathSubject && onToolClick`:
- Icon: camera icon from HugeIcons
- Position: beside the existing tools button
- Visibility: only for math-adjacent subjects (mathematics, technical-mathematics, mathematical-literacy, physical-sciences)
- On click: calls `openTools("solver", true)` which is already wired through the store

### Files changed
- `src/components/quiz/parts/QuestionCardHeader.tsx` — render the FAB (the `isMathSubject`/`onToolClick` props are already destructured here, just not rendered)

---

## 4. Marketing/Home Page Decomposition

### Problem
`home-content.tsx` is 540 lines doing too much: inline nav, hero, features grid, how-it-works, CTA, footer — all in one file. The page needs decomposition for maintainability plus two missing sections (testimonials, pricing comparison) to improve conversion.

### Design

**4a. Decompose into section components:**
- `HeroSection` — animated hero with parallax, auth-aware CTA, trust badges. Extracted from lines 150-274.
- `FeaturesGrid` — 6-feature masonry grid. No repeated card shapes (DESIGN.md rule). Extracted from lines 276-341.
- `HowItWorksSection` — 3-step numbered flow. Extracted from lines 343-386.
- `TestimonialsSection` — NEW. 3-4 static student testimonial cards with quote, name, achievement. Warm paper background.
- `PricingComparisonSection` — NEW. Free vs Premium table. Links to `/premium`. Three features per tier.
- `SiteFooter` — brand, links, social, copyright. Extracted from lines 430-538.

**4b. Thin orchestrator:**
`home-content.tsx` becomes:
```tsx
export function HomeContent() {
  return (
    <>
      <HeroSection />
      <FeaturesGrid />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingComparisonSection />
      <SiteFooter />
    </>
  );
}
```

**4c. Design constraints:**
- Use `PageContainer` for max-width/padding (not inline `mx-auto max-w-6xl px-4`)
- Reuse existing `Button`, `Card`, `Badge` from UI library
- No gradient text, no hero metrics
- Study Green on 10% or less of any surface
- Warm paper backgrounds

### Files created
- `src/components/home/hero-section.tsx`
- `src/components/home/features-grid.tsx`
- `src/components/home/how-it-works-section.tsx`
- `src/components/home/testimonials-section.tsx`
- `src/components/home/pricing-comparison-section.tsx`
- `src/components/home/site-footer.tsx`

### Files changed
- `src/components/home/home-content.tsx` — thin orchestrator
- `src/components/home/index.ts` — barrel exports

---

## Implementation Order

All four features are independent. Implementation order:
1. **APS badge** — smallest, 4 files
2. **TTS expansion** — 6 files, straightforward component changes
3. **Snap FAB** — 1 file, mostly done
4. **Home page** — largest, ~8 files

Run in parallel where possible (e.g., APS and Snap FAB can be done immediately; TTS and Home Page can run alongside or after).

## Testing

- APS utility: unit test for `getAPSForSubject()`, `getGrade()`, edge cases (boundaries, negative, >100)
- TTS: no new tests (UI-only changes to existing components)
- Snap FAB: no new tests (component already tested)
- Home page: no new tests (layout decomposition)
