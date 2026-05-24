# Share / Export — Phase 1 Design

## Overview

Add share buttons to quiz/exam/flashcard results pages (branded PNG card via Web Share API) and markdown export for notes. Phase 1 only — share links and social media integration deferred.

## Content Types

| Page | Share Format | Export |
|---|---|---|
| Quiz results | PNG card + text | — |
| Exam results | PNG card + text | — |
| Flashcard results | PNG card + text | — |
| Notes | — | Markdown (.md) download |

## Card Generator

**File:** `src/lib/share/card-generator.ts`

Uses HTML Canvas (no Konva dependency) to render a 600×315px share card. Pure function, synchronous rendering, returns `Blob`.

```typescript
interface ShareCardParams {
  score: number
  total: number
  percentage: number        // 0–100
  title: string              // e.g. "Mathematics Quiz"
  subtitle: string           // e.g. "17 / 20 Correct" or "Grade 12 · 720 APS"
  type: "quiz" | "exam" | "flashcard"
}

generateShareCard(params: ShareCardParams): Blob   // image/png
```

**Card template (top to bottom):**
1. "LUMNI" header watermark (letter-spaced, 0.65rem, opacity 0.7)
2. Percentage score (2.5rem, bold, white)
3. Detail line (0.8rem, opacity 0.8) — "17 / 20 Correct"
4. Thin divider (1px, rgba white 0.2)
5. Title (0.85rem, semibold)
6. Subtitle footer (0.65rem, opacity 0.6)

**Background gradient by type:**
- quiz: `#4f46e5 → #7c3aed` (indigo/purple)
- exam: `#059669 → #10b981` (green)
- flashcard: `#d97706 → #f59e0b` (amber)

## Share Button

**File:** `src/lib/share/share-button.tsx`

Props:
```typescript
interface ShareButtonProps {
  text: string               // "I scored 85% on my Mathematics quiz on Lumni!"
  cardBlob?: Blob            // from generateShareCard
  onShare?: () => void       // analytics hook
  label?: string             // defaults to "Share Result"
}
```

Behavior:
1. Try `navigator.share({ text, files: [cardBlob] })` if Web Share + files supported
2. Fallback: download PNG as `result-{type}-{date}.png`, copy text to clipboard with toast
3. Shows loading spinner while canvas renders

## Notes Export

**File:** No new file — add button directly in `note-creator.tsx`

- "Export as Markdown" button
- Converts note title + content to `# Title\n\nContent` format
- Downloads via `data:text/markdown` blob with filename `{slug}.md`

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/lib/share/card-generator.ts` | **New** | ~80 |
| `src/lib/share/share-button.tsx` | **New** | ~60 |
| `src/components/quiz/quiz-results.tsx` | **Modify** | +5 |
| `src/app/exam/[id]/exam-session-client.tsx` | **Modify** | +5 |
| `src/app/flashcards/flashcards-results.tsx` | **Modify** | +5 |
| `src/components/tools/notes/note-creator.tsx` | **Modify** | +10 |

## Error Handling

- Canvas rendering fails → catch error, fall back to text-only `navigator.share({ text })`
- Web Share completely unavailable → download PNG + clipboard copy
- Share rejected by user → no-op (Web Share API handles this)

## Testing

- `src/lib/share/card-generator.test.ts` — verify canvas renders correct text, correct gradient colors per type
- Manual: share button appears on each results page, invokes correct behavior

## Out of Scope (Phase 2)

- Server-side share links (unique result URLs)
- Social media direct sharing (Twitter/X, WhatsApp)
- Image editing before share
- Shared card gallery
