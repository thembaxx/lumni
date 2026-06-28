# ADR-0016: Dialog-to-Page Expansion — Auth + Multi-Phase Flows

**Status:** Accepted  
**Date:** 2026-06-28  
**Supersedes:** ADR-0014 rule #4 ("auth overlays stay as dialogs")

## Context

ADR-0014 established a rule of thumb for which dialogs become routes: page-content dialogs (multi-step, full-screen, bookmarkable) were extracted; tool/utility dialogs (confirmations, auth flows, quick-action forms, celebrations) stayed as inline overlays.

Experience with the extracted routes confirmed the pattern works. But two problems remained with tool/utility dialogs:

1. **Dialog composition is messy.** Components like `login-form.tsx` manage multiple dialog state pairs (`magicOpen`/`setMagicOpen`, `otpOpen`/`setOtpOpen`) plus separate `onSuccess` callbacks — adding interactions (resend, countdown, error recovery) compounds the prop-drilling and state management burden. See `src/components/admin/login-form.tsx:19-31` and `src/components/auth/otp-dialog.tsx:30-265`.

2. **Auth dialogs have meaningful internal state machines.** OTP has 3 phases (email → verify → success), magic link has 2 (send → wait), both have countdown timers, error recovery, and resend flows. This is not a "quick-action form" — it's a multi-phase flow that benefits from being a real route with a URL and history.

### User goals

- Convert every dialog to a real route (shareable URL, browser history, View Transitions)
- Start with auth dialogs (OTP, magic link) — the most painful composited dialogs
- Move to multi-phase flows next (snap dialog, tools dialog, celebrations)
- Delete old dialog components entirely after migration

## Decision

Supersede ADR-0014's "auth stays as dialog" rule. Auth dialogs become routes. The revised rule of thumb is:

### A dialog becomes a route when it has ANY of:

1. Multi-step internal state (phases, wizards, sequential forms)
2. Data fetching or loading states that benefit from suspense boundaries
3. State that users want to preserve across navigation (back/forward)
4. Multiple trigger points across the app that currently duplicate state management

### A dialog stays as a dialog only when it is:

1. A generic confirmation prompt ("Are you sure?")
2. A simple picker (select an item from a list)
3. A toast/banner/notification (ephemeral by nature)

Auth flows, multi-phase tools, celebrations, and study-group creation all graduate to routes.

## Route design

### Auth routes

| Route           | Purpose                                 |
| --------------- | --------------------------------------- |
| `/auth/sign-in` | Landing page — choose sign-in method    |
| `/auth/verify`  | Single verify page — `?method` dispatch |

**`/auth/verify` query params:**

- `method`: `"otp"` | `"magic-link"`
- `redirect`: post-auth destination (defaults to `/dashboard`)

**Navigation:**

- Triggers: simple `<Link href="/auth/sign-in">` from login banners, admin pages
- On success: `router.push(redirect || "/dashboard")`
- Admin users: `redirect` defaults to `/admin` when coming from admin context
- Old components deleted: `OTPDialog`, `MagicLinkDialog`, `login-dialogs.tsx`
- Sub-form components (`OtpEmailForm`, `OtpVerificationForm`, etc.) reused in page components

### Auth verify page flow

```
/auth/verify?method=otp&redirect=/admin
  ├─ [method=otp]
  │   ├─ EmailEntryStep (email input + "Send Code")
  │   ├─ VerificationStep (6-digit input + "Verify" + countdown + resend)
  │   └─ ConfirmedStep (brief success view → auto-redirect)
  └─ [method=magic-link]
      ├─ EmailEntryStep (email input + "Send Link")
      └─ SentStep (check inbox + countdown + resend)
```

The page maintains its own step state via `useReducer` (same pattern as current dialogs), but owns its own lifecycle — no `open`/`onOpenChange`/`onSuccess` props incoming.

### Auth route ownership

`/auth/sign-in` and `/auth/verify` are publicly accessible, no auth guard, full page layout (not inside app shell). This ensures the route works before authentication state is available — solving the "before the app shell is ready" concern from ADR-0014.

### Auth page layout

The `/auth/verify` page should follow the standard `PageContainer` with `max-w-md` centered content — same visual proportions as the current dialog, but as a proper page. This avoids the jarring transition from a floating dialog to a full-page layout.

### Migration pattern (reusable for all future conversions)

```
1. Create route page at src/app/[locale]/auth/sign-in/page.tsx
2. Copy state logic from dialog into page component
3. Replace Dialog wrapper with PageContainer + inline layout
4. Replace open/onOpenChange/onSuccess with router.push/router.back + searchParams
5. Wire old trigger points (links) to use next/link instead of useState toggle
6. Delete old dialog component
7. Verify: typecheck, lint, test
```

## Consequences

**Positive:**

- Auth flows are navigable by URL — shareable, bookmarkable
- Back/forward navigation works naturally for multi-step auth
- No more `open`/`onOpenChange`/`onSuccess` prop threading in auth consumers
- Admin `login-form.tsx` simplifies from 140 lines with 2 dialog states to a simple redirect page
- View Transitions animate auth flow entry/exit
- Consistent pattern: all multi-phase flows are routes, not dialogs

**Negative:**

- Auth routes must work before the main app shell loads (no auth guard, no sidebar)
- `/auth/sign-in` adds a route to the public surface (~+1 page)
- Old dialog-based integrations (if any) need to update trigger points to use `<Link>`

**Neutral:**

- `/auth/verify` accepts `?method=` for dispatch — could also be two separate routes if `?method=` proves awkward
- Countdown timers survive page navigations only if stored in search params or sessionStorage (currently in-memory `useReducer` — same as dialog behaviour)

## Glossary

| Term               | Definition                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog composition | The pattern of embedding one dialog inside another or managing multiple dialog states in a single parent component. The pain point driving this ADR.                                                |
| Page-dialog        | A component that behaves like a dialog (centered, dismissable, focused interaction) but exists as a real route with a URL. Contrasts with inline dialog (no URL, no history).                       |
| Auth verify page   | The route `/auth/verify` that handles both OTP and magic-link sign-in flows via `?method=` query param dispatch.                                                                                    |
| Phase              | A distinct step in a multi-step flow (e.g., Email Entry → OTP Verification → Confirmed). Each phase maps to a state in the page's `useReducer`.                                                     |
| Redirect param     | The `?redirect=` query parameter that controls where the user lands after a successful auth flow. Defaults to `/dashboard`, overridable per trigger point.                                          |
| Method dispatch    | The pattern of using a single route with a query parameter (`?method=otp` vs `?method=magic-link`) to decide which sub-flow to render. Keeps routing simple while supporting multiple auth methods. |
| Trigger point      | Any component that initiates a dialog/page-dialog (e.g., login banner, admin login form, "Sign In" button). With pages, trigger points use `<Link>` instead of `useState` + `onOpenChange`.         |
