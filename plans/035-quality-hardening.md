# Plan 035: Quality — Lighthouse audit + edge case hardening

## Scope

- Run Lighthouse on key pages (dashboard, quiz, flashcards, stories, search)
- Fix performance issues: lazy loading, image optimization, bundle splitting
- Fix accessibility issues found by automated scan
- Fix SEO gaps (meta descriptions, heading structure, semantic HTML)
- Add error boundaries for all route groups
- Ensure all API routes have proper error responses

## Done criteria

- Lighthouse scores: Performance ≥90, Accessibility ≥95, SEO ≥95
- All route groups wrapped in error boundaries
- No unhandled promise rejections
