# Plan 037: Go to market — SEO, landing page, onboarding

## Scope

- SEO: Add structured data (JSON-LD) for educational app, meta descriptions across all pages, canonical URLs, sitemap update
- Landing page: Polish hero section, add social proof (stats counters), improve CTA, add testimonial carousel
- Onboarding: Polish onboarding flow (step 1 → step 4), improve subject selection UI, add skip option, add progress indicators
- Referral system: Share buttons with unique referral links, track signups via URL params

## Approach

- Use existing `next-seo` or Next.js metadata API
- Landing page is at `src/app/page.tsx` / home sections
- Onboarding is at `src/components/onboarding/onboarding-wizard.tsx`
- Referral tracking via URL search params + Dexie

## Done criteria

- Meta descriptions on all major pages
- JSON-LD structured data on landing page
- Onboarding flow has progress indicators and skip option
- Referral links work and track signups
