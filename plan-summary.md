# Plan 057 — Mock Exam Mode

**Status**: ✅ Complete  
**Date**: 2026-06-28  

## Summary

Implemented dedicated mock-exam mode for the quiz surface: locked navigation, countdown timer with prominent display, auto-submit on time expiry, MCQ client-side grading, and APS projection results overlay.

## Files Changed

| File | Action |
|------|--------|
| `src/lib/exam/mock-exam-config.ts` | Created — mock exam constants (duration, count, messages, badges) |
| `src/components/exam/exam-mock-session.tsx` | Created — full-screen wrapper, countdown overlay, forward-only nav, MCQ grading, auto-submit, results overlay with APS projection |
| `src/app/[locale]/quiz/quiz-client.tsx` | Modified — added `mode=mock` branch that renders `ExamMockSession` |
| `src/components/tools/communication/exam-detail-dialog.tsx` | Modified — Mock Exam button now includes `&mode=mock` |
| `src/components/exam/__tests__/exam-mock-session.test.tsx` | Created — 4 tests (generating message, countdown overlay, default params, mock badge) |

## Key Decisions

- Used `getAPSForSubject` from `@/lib/shared/aps` instead of deleted `calculateAPS()`; maps percentage to APS 1–7 correctly
- Used `MarkdownRenderer` component instead of raw `dangerouslySetInnerHTML` to follow existing question-text rendering patterns
- `ExamMockSession` accepts `duration` in seconds (matches `time` search-param parsing in `quiz-client.tsx`)
- Mutable module-level test variables used to avoid `vi.mock` hoisting limitations

## Verification

| Check | Result |
|-------|--------|
| `pnpm run typecheck` | ✅ exit 0 (pre-existing TS47 diagnostic only) |
| `pnpm exec oxlint` | ✅ 0 warnings, 0 errors |
| `pnpm run test -- mock-exam` | ✅ 1 file, 4 tests pass |
| `pnpm run build` | ✅ Compiled successfully, 171/171 pages generated |
