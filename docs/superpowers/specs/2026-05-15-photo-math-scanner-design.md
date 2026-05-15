# Photo Math Scanner — Design Spec

**Date**: 2026-05-15
**Status**: Approved for implementation

## Problem

South African Matric students study from physical textbooks, handwritten notes, and printed past papers. When they encounter a problem they cannot solve, they need a way to get step-by-step help without manually transcribing the problem into the app. ScanMath's core feature — snap a photo, get step-by-step solutions — is absent from Lumni despite having all the underlying infrastructure (camera access, Gemini vision, AI solver, KaTeX rendering).

## Design

### 1. Camera Capture → AiSolver

Enhance the existing `AiSolver` tool in the Tools Palette with a camera-first flow.

**Camera button**: `<input type="file" accept="image/*" capture="environment">` triggers native camera on mobile. A gallery-style upload button remains alongside for selecting existing photos.

**Unified image preview**: Captured or uploaded photo renders as a thumbnail above the input. Retake/remove button overlay.

**Auto-extract flow**: On image capture, the image is sent to `/api/solve` which extracts the math problem text, displays it in an editable text field for the user to verify/correct, then auto-solves:

```
Snap photo → AI extracts problem text → User edits/corrects → Step-by-step solution
```

### 2. Math-Specific AI Prompt

Update `/api/solve` to add a math-optimized branch for image-based problems:

- **Image provided**: system prompt adds math-extraction instructions ("Extract the math problem from the image. Handle handwritten, printed, digital, and mixed text. Identify the problem type."), temperature drops to `0.3`
- **Text only**: unchanged generic prompt
- Response format stays `{ solution, steps }` — first step becomes detected problem statement

### 3. Math-Screen Context Integration

On quiz (`/quiz`), flashcards (`/flashcards`), and exam session (`/exam/[id]`) screens where current subject is math-adjacent (`mathematics`, `technical-mathematics`, `mathematical-literacy`, `physical-sciences`), a small camera FAB appears above the existing tools FAB. Tapping it opens `ToolsDialog` pre-selected to the Solver tab with camera focus.

- Not shown on non-math screens
- Not shown on home, dashboard, past-papers list, or settings pages

### 4. Files Changed

| File | Change |
|------|--------|
| `src/components/tools/ai-solver.tsx` | Add camera capture button, image preview, auto-extract flow, "solving" states |
| `src/app/api/solve/route.ts` | Add math-specific image-parse prompt, lower temp when image present |
| `src/components/tools/tools-dialog.tsx` | Add `initialTab` prop support for programmatic tab selection |
| `src/components/quiz/question-card.tsx` | Add "Snap" FAB on math-subject quiz/exam screens |

## Constraints

- Camera only on mobile (desktop uses file upload)
- Existing `StepByStep` component handles result display — no new UI needed
- Existing `MarkdownRenderer` handles math in steps via KaTeX — no new rendering
- No new AI providers — Gemini handles vision + solving in one call

## Out of Scope

- Photo scanning library (e.g., ML Kit) for on-device OCR — deferred
- Offline math solving — deferred
- Math symbol handwriting recognition — deferred
