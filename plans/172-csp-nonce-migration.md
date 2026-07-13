---
status: TODO
priority: P2
effort: M
risk: MED
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 172 — CSP allows `'unsafe-inline'` script/style (weak XSS backstop)

## Context

The CSP in `next.config.ts` sets `script-src 'self' 'unsafe-inline' ...` and `style-src 'self' 'unsafe-inline' ...`. `base-uri 'self'` and `frame-ancestors 'none'` are good, but inline script execution is unrestricted. If any SafeHTML sink regresses or a stored-XSS appears, inline scripts run with no backstop. React's default escaping mitigates today, but the CSP provides no defense-in-depth.

## Current state (verified)

`next.config.ts:22-44`

```ts
const scriptSrc = ["'self'", "'unsafe-inline'", __unsafeEvalDev, __impeccableLiveDev].filter(Boolean);
...
`script-src ${scriptSrc.join(" ")}`,
"style-src 'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net",
```

## Goal

Remove `'unsafe-inline'` where feasible by inventorying app-owned inline scripts/styles and either externalizing them or adding per-request nonces. Lower-risk first: `style-src` (no nonce needed for styles in React; move inline styles to classes/CSS or accept `style-src-attr` scoping).

## Steps

1. Inventory inline scripts/styles the app controls:
   - `grep -rn "<script" src` and `grep -rn "dangerouslySetInnerHTML" src` (note: `safe-html.tsx`/`mermaid-diagram.tsx` sanitize via DOMPurify — fine, but inline `<style>` they inject should be reviewed).
   - Check `src/app/[locale]/layout.tsx` and any theme-color / initialization inline scripts.
2. Phase A (low risk): remove `'unsafe-inline'` from `style-src` only after confirming no app-owned inline `<style>`/style attributes are required. If some are required, use `'unsafe-inline'` **only** in `style-src-attr 'unsafe-inline'` (style _attributes_, not blocks) which is far lower risk, keeping `style-src` without it.
3. Phase B (higher risk): for any app-owned inline `<script>`, add a per-request `nonce`:
   - Generate `nonce` in `headers()` (same place CSP is built) and inject into `script-src 'nonce-...'`.
   - Pass the nonce to the React `script` tags via a provider/context.
   - Keep `'unsafe-inline'` ONLY if a required third-party inline script cannot take a nonce (document which one).
4. Run `pnpm exec oxfmt --check`.
5. **Verification must include the a11y/visual E2E** (`pnpm test:e2e`) — a too-strict CSP can break the app silently.

## Scope

- In scope: `next.config.ts` (`buildCsp`), `layout.tsx` inline scripts, any inline `<style>` the app injects.
- Out of scope: third-party CDN scripts outside our control (those need their own hashes or remain allowed by host), Sentry/analytics (already on allowed hosts).

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm run build` → succeeds.
- `pnpm test:e2e` (at least the home + dashboard smoke specs) → pass.

## Test plan

- No unit test; verification is build + E2E + a manual CSP check (DevTools → the `Content-Security-Policy` response header no longer lists `'unsafe-inline'` in `script-src`/`style-src` where removed).

## Maintenance

- Any new inline `<script>`/`<style>` added later must use the nonce or a class — CI a11y/visual specs catch regressions.

## Escape hatches

- If removing `'unsafe-inline'` from `script-src` breaks a required vendor inline script that cannot take a nonce, keep `'unsafe-inline'` for `script-src` ONLY and document the exception in the PR + `next.config.ts` comment. Do NOT remove it silently. Prefer removing `style-src 'unsafe-inline'` first as the safer win.
