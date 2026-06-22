# Plan 022: i18n — Fill 64 missing keys for 8 SA languages

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none

## Why this matters

8 of 11 SA languages (xh, st, tn, nso, ts, ss, ve, nd) are each missing 64 translation keys — 512 total missing translations. These are keys added to en/af/zu after the AI generation script was run. The UI falls through to English for these keys on those locales.

## Scope

**In scope**: `messages/{xh,st,tn,nso,ts,ss,ve,nd}.json` — add missing 64 keys per file
**Out of scope**: Translation quality audit, hardcoded server content, subject name audit

## The 64 missing keys per language

- `nav.dashboard`, `nav.quiz`, `nav.flashcards`, `nav.settings`, `nav.studyGroups`, `nav.studyPlanner`
- `home.navTryQuiz`, `home.skipToContent`, `home.ctaHeading`, `home.ctaDescription`, `home.opensInNewTab`
- `quiz.pastPaperMode`
- `flashcards.reviewVocabulary`
- `premium.gatedTitle`, `premium.gatedDescription`, `premium.freeQuizzesLeft`
- `dashboard.boltCompleteTitle`, `dashboard.boltCompleteDescription`
- All ~40 consent.\* keys (cookieBanner, cookieSettings, tosBanner, privacyTab, cookiePolicy)

## Steps

1. Read each locale file, find the last key for each namespace
2. Append the missing keys using AI-generated translations
3. Use English source with target language context
4. Verify: `npx tsc --noEmit`, `npx biome check`, visual spot-check in browser

## Done criteria

- All 8 locale files have 782 keys matching en.json
- TypeScript + Biome clean
- No regressions in tests
