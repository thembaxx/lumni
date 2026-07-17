# Plan 206: Lock down CSP — remove unsafe-inline, add missing directives

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: LOW-MED
- **Depends on**: none
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The Content Security Policy (CSP) in `next.config.ts:41-56` currently uses `script-src 'unsafe-inline'`, which weakens XSS protections by allowing any inline script to execute. It also lacks explicit `media-src` and `frame-src` directives, which means they fall back to `default-src` (if set) or are wide open (if not). A strict CSP with nonce-based script loading is the industry standard for preventing XSS, and the missing directives create ambiguity for browser policy enforcement.

## Current state

`next.config.ts:41-56`:

```typescript
headers: [
  {
    key: "Content-Security-Policy",
    value: [
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
      // no media-src
      // no frame-src
    ].join("; "),
  },
],
```

The policy relies on `'unsafe-inline'` for scripts and does not declare `media-src` or `frame-src`.

## Target state

- Production CSP uses nonce-based `script-src` instead of `'unsafe-inline'`
- Dev mode keeps `'unsafe-eval'` (needed for Next.js dev HMR)
- `media-src` is explicitly set to allow UploadThing CDN, `blob:`, and `https:` as needed
- `frame-src` is set to `'none'` (the app does not embed frames)
- Nonce is generated per-request in middleware and propagated to the layout

## Scope

- `next.config.ts` — CSP header string
- `src/middleware.ts` — nonce generation (or a new middleware file if none exists)
- `src/app/[locale]/layout.tsx` — propagate nonce via `Content-Security-Policy-Report-Only` or HTTP header

## Steps

### 1. Read current CSP and middleware setup

Read `next.config.ts` for the full CSP header and `src/middleware.ts` (if it exists) to understand the current middleware chain.

### 2. Add nonce generation in middleware

In `src/middleware.ts`, generate a cryptographically random nonce per request and attach it to the request headers:

```typescript
import crypto from "crypto";

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // ... existing middleware logic
}
```

If no middleware exists, create one. If middleware exists, add the nonce generation to it.

### 3. Wire nonce into layout

In `src/app/[locale]/layout.tsx`, read the `x-nonce` header and pass it to `next.config` CSP via `res.headers.set()`. Or, if using App Router, set the nonce via `generateMetadata` or a layout-level header.

### 4. Update CSP in next.config.ts

Replace the script-src directive:

```typescript
// Development — keep unsafe-eval for HMR
const scriptSrc = dev ? `'self' 'unsafe-eval' 'nonce-${nonce}'` : `'self' 'nonce-${nonce}'`;
```

Add missing directives:

```typescript
[
  `script-src ${scriptSrc}`,
  "media-src 'self' blob: https://uploadthing.com https://utfs.io",
  "frame-src 'none'",
].join("; "),
```

Also verify and add:

- `base-uri 'self'`
- `form-action 'self'`
- `object-src 'none'`

### 5. Verify in production build

```bash
pnpm run build
```

Check that the CSP header is present in the response with a valid nonce and no `unsafe-inline`.

### 6. Run existing tests

```bash
pnpm run test
```

## Stop conditions

- If Next.js does not support nonce-based CSP in the App Router without a custom server — stop and report. Alternative: keep `'unsafe-inline'` but tighten other directives, and add `'strict-dynamic'` as a compromise.
- If `media-src` needs to include user-uploaded content domains not yet known — stop and collect the full list of media origins.

## Estimated time

2–3 hours (includes testing nonce propagation across the full stack)
