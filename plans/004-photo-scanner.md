# Plan 004: Photo math scanner

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c91fa0d4..HEAD -- src/app/[locale]/tools/math/ src/components/tools/math/ src/lib/solver/ src/components/tools/core/snap-dialog.tsx src/lib/ai/ src/components/shared/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c91fa0d4`, 2026-07-10
- **Issue**: (none)

## Why this matters

All the infrastructure for a photo math scanner already exists: camera capture (`snap-fab.tsx`), OCR extraction (`ocr-service.ts`), Gemini vision (the AI client supports image inputs), the math solver (wired into question engine), and KaTeX rendering (in markdown renderer). The design doc at `docs/superpowers/specs/2026-05-15-photo-math-scanner-design.md` describes exactly how to wire them together. This is pure plumbing — no new infrastructure, just connecting existing pieces. It's a high-visibility differentiator for STEM students.

## Current state

- `docs/superpowers/specs/2026-05-15-photo-math-scanner-design.md` — full design: camera open → crop → Gemini Vision → solver → KaTeX result
- `src/components/tools/core/snap-dialog.tsx` — reusable `SnapDialog` component with camera/file capture, `SnapPhase` state machine (idle → capturing → processing → result), `extractFromImage()` helper that OCRs via Gemini Vision
- `src/lib/ai/client.ts` — AIClient supports `generateWithSystem()` with image content — check if `GeminiProvider` handles base64 images
- Question engine solver — `POST /api/engine/solve` accepts question text, returns solution with steps
- `MarkdownRenderer` — renders KaTeX math via `$...$` / `$$...$$` — see AGENTS.md for delimiter conventions
- The SnapDialog flow currently OCRs → extracts text → user copies the result. It doesn't send to the solver.

Follow existing component patterns: `"use client"`, `useTranslations()` for i18n, framer-motion for animations, Tailwind CSS tokens (no arbitrary values), `<PageContainer>` for layout.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm run typecheck`      | exit 0              |
| Tests     | `pnpm run test -- --run`  | all pass            |
| Lint      | `pnpm exec oxlint --fix`  | exit 0              |
| Format    | `pnpm exec oxfmt --check` | clean               |

## Scope

**In scope**:

- `src/app/[locale]/tools/math/` — new page route `/tools/math`
- `src/components/tools/math/photo-scanner.tsx` — main scanner component
- `src/components/tools/math/scan-result.tsx` — result display with KaTeX
- `src/components/tools/core/snap-dialog.tsx` — add a `mode` prop: `"ocr"` (existing) or `"math"` (new, sends to solver after OCR)
- Translations in `messages/en.json` — add math-scanner section

**Out of scope**:

- Do NOT modify the AI client or solver API — they already work
- Do NOT build a step-by-step equation editor — photo scan only
- Do NOT touch the existing OCR pipeline — snap-dialog's `extractFromImage()` is reused
- Do NOT add history/persistence of scanned problems

## Git workflow

- Branch: `advisor/004-photo-scanner`
- Commit per step
- Message style: conventional commits — `feat(tools): add photo math scanner`

## Steps

### Step 1: Add `mode` prop to SnapDialog

Current `SnapDialog` has a fixed OCR flow. Add an optional `mode` prop: `"ocr"` (default) or `"math"`.

In `src/components/tools/core/snap-dialog.tsx`, after OCR extraction succeeds:

- If `mode === "math"`, call `POST /api/engine/solve` with the extracted text and subject `"mathematics"` instead of just showing the extracted text
- Show a solving spinner while waiting
- On success, show the solution rendered with `MarkdownRenderer` (which handles KaTeX)

The SnapDialog's existing `SnapPhase` types and state machine should be extended with a `"solving"` phase between `"processing"` and `"result"`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Create the photo scanner component

Create `src/components/tools/math/photo-scanner.tsx`:

- A simple page wrapper that renders a SnapDialog with `mode="math"`
- Shows a heading: "Photo Math Scanner"
- Shows a subtitle: "Take a photo of a math problem and get a step-by-step solution"
- Uses the existing `SnapDialog` with the new mode

Follow the component structure of `src/components/tools/science/electron-shell-visual.tsx` for layout patterns.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Create the scan result component

Create `src/components/tools/math/scan-result.tsx`:

```tsx
"use client";

import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import type { GradingResult } from "@/lib/question-engine/types";
import { Card, CardContent } from "@/components/ui/card";

interface ScanResultProps {
  solution: string;
  steps?: GradingResult["steps"];
  onRetry: () => void;
}

export function ScanResult({ solution, steps, onRetry }: ScanResultProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="p-4">
          <MarkdownRenderer content={solution} subject="mathematics" />
        </CardContent>
      </Card>
      {steps && steps.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm">Step-by-step</h3>
          {steps.map((step, i) => (
            <Card key={i}>
              <CardContent className="p-3 text-sm">
                <MarkdownRenderer content={step} subject="mathematics" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Create the page route

Create `src/app/[locale]/tools/math/page.tsx`:

```tsx
import { MathPhotoScanner } from "@/components/tools/math/photo-scanner";
import { PageContainer } from "@/components/shared/page-container";

export default function MathScannerPage() {
  return (
    <PageContainer>
      <MathPhotoScanner />
    </PageContainer>
  );
}
```

**Verify**: Navigate to `/tools/math` — scanner renders.

### Step 5: Add translations

Add to `messages/en.json` under a `"mathScanner"` key:

```json
"mathScanner": {
  "title": "Photo Math Scanner",
  "subtitle": "Take a photo of a math problem and get a step-by-step solution",
  "solving": "Solving...",
  "retry": "Scan another problem",
  "steps": "Step-by-step"
}
```

Also add in `af.json` and `zu.json` entry — can use English as placeholder if actual translations aren't available.

**Verify**: The page renders with correct heading text.

## Test plan

- Create `src/components/tools/math/__tests__/photo-scanner.test.tsx` — render test confirming the SnapDialog renders with math mode. Follow patterns from `src/components/quiz/__tests__/quiz-result.test.tsx`.
- Create `src/components/tools/math/__tests__/scan-result.test.tsx` — render test confirming MarkdownRenderer is called with the solution prop.

**Verify**: `pnpm run test -- --run` → all tests pass, including new ones.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run` exits 0; new tests exist
- [ ] `/tools/math` page renders with camera/frame capture button
- [ ] Captured image is OCR'd and sent to `POST /api/engine/solve`
- [ ] Solution renders with KaTeX math formatting
- [ ] "Retry" button clears result and shows capture UI again
- [ ] Translations exist in `messages/en.json`
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `POST /api/engine/solve` doesn't accept extracted text (read the route to verify its body shape)
- `SnapDialog` is too tightly coupled to OCR-only mode to add the prop cleanly (if so, create a new `MathSnapDialog` component instead)
- The Gemini Vision AI provider doesn't handle images the way `extractFromImage()` expects

## Maintenance notes

- The `/tools/math` route should be registered in the sidebar navigation config at `src/lib/navigation/config.ts` if it should appear in the nav.
- If the solver response format changes, the `ScanResult` component may need updating — the `GradingResult` type at `src/lib/question-engine/types.ts` is the contract.
- The design doc at `docs/superpowers/specs/2026-05-15-photo-math-scanner-design.md` has additional ideas (history, graphing) that are explicitly deferred.
