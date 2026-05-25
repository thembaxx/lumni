# i18n Expansion — All 11 Official South African Languages

**Status:** Approved for implementation

## Scope

Expand Lumni's internationalisation from 2 languages (English, Afrikaans) to all 11 official South African languages, with full locale-based routing, server-side i18n support, and SEO metadata.

## Phases

### Phase 1 — Routing Infrastructure

**Goal:** Locale-prefixed routes (`/en/quiz`, `/af/quiz`) powered by `next-intl`, with middleware for detection and auth.

| # | Task |
|---|------|
| 1.1 | Add `createNextIntlPlugin()` wrapper to `next.config.ts` |
| 1.2 | Create `src/middleware.ts` — `createMiddleware()` from `next-intl/middleware` with `["en", "af"]` locales, chain in `proxy()` from `./proxy` for auth |
| 1.3 | Update `proxy.ts` — add locale-prefixed paths to `PROTECTED_PAGES` matcher |
| 1.4 | Move all `src/app/*` page routes under `src/app/[locale]/` (except `api/`, `fonts.ts`, `globals.css`) |
| 1.5 | Create `src/app/[locale]/layout.tsx` — takes over current layout body (Providers, nav, etc.) |
| 1.6 | Update `src/app/layout.tsx` — reads locale from params, passes to child layout, sets `<html lang>` |
| 1.7 | Update `I18nProvider` — URL locale is source of truth; keep context for `useI18nContext()` consumer |
| 1.8 | Update `LocaleSwitcher` — navigates between locale variants of current path |
| 1.9 | Replace all `next/link`/`useRouter`/`usePathname` with `createNavigation()` from `next-intl` |
| 1.10 | Verify `src/i18n/request.ts` works with `[locale]` params (should work as-is) |

### Phase 2 — Translation Generation

**Goal:** AI-generated message files for 9 new languages + fill `af.json` gaps.

**New locales:**

| Code | Language |
|------|----------|
| `zu` | isiZulu |
| `xh` | isiXhosa |
| `st` | Sesotho |
| `tn` | Setswana |
| `nso` | Sepedi |
| `ts` | Xitsonga |
| `ss` | SiSwati |
| `ve` | Tshivenda |
| `nd` | isiNdebele |

| # | Task |
|---|------|
| 2.1 | Write translation generation script — reads `en.json`, calls Gemini 2.0 Flash Lite with ICU-aware prompt, writes `{locale}.json` |
| 2.2 | Generate all 9 language files via script |
| 2.3 | Fill ~40 missing `af.json` keys (translate only gaps, not full file) |
| 2.4 | Update `src/i18n/locales.ts` — add all 11 locales + native endonym labels |
| 2.5 | Validation script: verify all 11 locale files have identical key sets to `en.json` |
| 2.6 | Validation script: verify all interpolation variables are preserved across all locales |
| 2.7 | Spot-check 5-10 translations per language |

### Phase 3 — Progressive Rollout

**Goal:** Enable new languages in middleware and UI incrementally as they're validated.

| # | Task |
|---|------|
| 3.1 | Rollout batch 1: `zu`, `xh`, `st` — add to middleware locale list |
| 3.2 | Rollout batch 2: `tn`, `nso`, `ts` |
| 3.3 | Rollout batch 3: `ss`, `ve`, `nd` |
| 3.4 | Update `LocaleSwitcher` to handle 11 items (scrollable list or grouped by family) |
| 3.5 | Update browser locale detection in middleware to match all 11 |

### Phase 4 — SEO Metadata

**Goal:** Dynamic locale-aware metadata for search engines.

| # | Task |
|---|------|
| 4.1 | Dynamic `<html lang>` from current locale |
| 4.2 | Dynamic OG `locale` field (e.g., `en_ZA`, `af_ZA`, `zu_ZA`) |
| 4.3 | Generate `alternateLanguages` hreflang link tags for all active locales |
| 4.4 | Per-locale sitemap entries or `hreflang` x-default coverage |
| 4.5 | Update JSON-LD structured data with locale info where applicable |

## Key Decisions

- **Locale codes:** ISO 639-1 2-letter codes except Sepedi (`nso`, ISO 639-2). Suffixed with `_ZA` for OG locale where appropriate.
- **Routing:** `[locale]` path prefix, not subdomain or TLD. Shared cookies across all locale paths.
- **Translation method:** AI-generated (Gemini 2.0 Flash Lite), not manually translated. Spot-checked for quality.
- **Auth middleware chaining:** Locale middleware runs first (redirects `/quiz` → `/en/quiz`), then auth proxy checks the resolved path.

## Files Changed

**New files:**
- `src/middleware.ts`
- `src/app/[locale]/layout.tsx`
- `messages/zu.json`, `messages/xh.json`, `messages/st.json`, `messages/tn.json`, `messages/nso.json`, `messages/ts.json`, `messages/ss.json`, `messages/ve.json`, `messages/nd.json`

**Modified files:**
- `next.config.ts`
- `src/proxy.ts`
- `src/app/layout.tsx`
- `src/i18n/locales.ts`
- `src/i18n/request.ts`
- `src/components/i18n/i18n-provider.tsx`
- `src/components/i18n/locale-switcher.tsx`
- All files using `next/link` or `next/navigation` navigation APIs

## Out of Scope

- Server-side `getTranslations()` adoption (out of scope for now — all 130+ existing sites use `useTranslations()` client-side)
- Locale-specific number/date formatting customisation beyond next-intl defaults
- Right-to-left language support (all SA languages are LTR)
- In-app translation of user-generated content (flashcards, notes, posts)
