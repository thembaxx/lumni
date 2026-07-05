# Deployment Runbook — Lumni to `lumni.ai`

**Last updated:** 2026-07-05  
**Plan:** 096 (supersedes 087)  
**Status:** Not yet deployed — design spike complete

## 1. Overview

| Item           | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| Production URL | `https://lumni-psi.vercel.app` (current) → `https://lumni.ai` (target) |
| Vercel project | `org1989/lumni`                                                        |
| Git branch     | `master` (auto-deploy via GitHub integration)                          |
| Appwrite       | Cloud, Johannesburg region (`jnb.cloud.appwrite.io`)                   |
| Domain         | `lumni.ai` (registered, used for `hello@lumni.ai` email)               |
| Sentry         | `org1128/lumni` (DSN configured)                                       |

## 2. Prerequisites

### 2.1 Access checklist

- [ ] Vercel team `org1989` — deployment or owner role
- [ ] `lumni.ai` domain DNS console — who manages it? (registrar, DNS provider)
- [ ] Appwrite console access for `jnb.cloud.appwrite.io`
- [ ] Sentry `org1128` access
- [ ] All API keys listed in §4 populated

### 2.2 Vercel project status

The project exists at `org1989/lumni` with GitHub auto-deploy from `master`. No custom domain is currently configured. Deployments are automatic on push to `master`. Verify:

```bash
npx vercel list           # shows recent production deploys
npx vercel domains ls     # must NOT show lumni.ai (confirms not done)
```

## 3. One-time setup

### 3.1 Domain ownership

Determine who manages the `lumni.ai` DNS. Three options:

| Option                | How                                         | Pros                        | Cons                      |
| --------------------- | ------------------------------------------- | --------------------------- | ------------------------- |
| **Vercel DNS**        | Change nameservers at registrar to Vercel's | Fastest, Vercel manages SSL | Requires registrar access |
| **External DNS**      | Add CNAME record manually                   | No registrar change         | Slower, manual            |
| **Vercel DNS import** | Import existing DNS zone                    | Preserves existing records  | Requires Vercel DNS first |

The domain is used for outbound email (`hello@lumni.ai`) — if the DNS is managed by Google Workspace or similar, use Option 2 (external DNS) to avoid disrupting email.

### 3.2 Add domain in Vercel

```bash
npx vercel domains add lumni.ai --project lumni
```

Follow the DNS instructions printed. For external DNS, the required record is:

```
CNAME  lumni.ai  →  cname.vercel-dns.com
```

Also add `www` subdomain as a redirect alias:

```bash
npx vercel domains add www.lumni.ai --project lumni
```

Configure `www.lumni.ai` as a 301 redirect to `lumni.ai` in Vercel project settings → Domains.

### 3.3 SSL certificate

Vercel auto-provisions a Let's Encrypt certificate once DNS resolves (1–30 minutes). Verify:

```bash
curl -sI https://lumni.ai | findstr "HTTP/"
# Expected: HTTP/1.1 200 OK

openssl s_client -connect lumni.ai:443 -servername lumni.ai 2>&1 | findstr "subject="
# Expected: subject=CN = lumni.ai
```

### 3.4 Appwrite production setup

Appwrite is **Cloud-hosted** (not self-hosted) at `https://jnb.cloud.appwrite.io/v1`. The Johannesburg region is already configured in code and env.

- [ ] Verify `NEXT_PUBLIC_APPWRITE_PROJECT_ID` is set in Vercel production env
- [ ] Verify `APPWRITE_API_KEY` has full API scope (collections, documents, users, functions)
- [ ] Run `pnpm run db:ensure` against production Appwrite to create collections and indexes

```bash
pnpm run db:ensure
```

This calls `scripts/ensure-appwrite.ts` which creates all collections and indexes defined in `src/lib/db/ensure-config.ts`.

- [ ] Confirm Appwrite project is in **Production mode** (not Admin-only auth) in console → Settings → General → Auth mode

### 3.5 Update environment variables in Vercel

#### Production environment only (in Vercel dashboard → lumni → Settings → Environment Variables):

| Variable                          | Value                              | Type   |
| --------------------------------- | ---------------------------------- | ------ |
| `NEXT_PUBLIC_SITE_URL`            | `https://lumni.ai`                 | Client |
| `NEXT_PUBLIC_APP_URL`             | `https://lumni.ai`                 | Client |
| `NEXT_PUBLIC_APPWRITE_ENDPOINT`   | `https://jnb.cloud.appwrite.io/v1` | Client |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | _(from Appwrite console)_          | Client |
| `NEXT_PUBLIC_SENTRY_DSN`          | _(from Sentry)_                    | Client |
| `APPWRITE_API_KEY`                | _(from Appwrite console)_          | Server |
| `GEMINI_API_KEY`                  | _(from Google AI Studio)_          | Server |
| `NVIDIA_NIM_API_KEY`              | _(from Nvidia)_                    | Server |
| `GROQ_API_KEY`                    | _(from Groq)_                      | Server |
| `FIRECRAWL_API_KEY`               | _(from Firecrawl)_                 | Server |
| `EXA_API_KEY`                     | _(from Exa)_                       | Server |
| `ABLY_API_KEY`                    | _(from Ably)_                      | Server |
| `DEEPGRAM_API_KEY`                | _(from Deepgram)_                  | Server |
| `SENTRY_AUTH_TOKEN`               | _(from Sentry)_                    | Server |
| `ADMIN_SECRET`                    | _(generate strong random value)_   | Server |

Leave Preview and Development environments on the Vercel subdomain (`NEXT_PUBLIC_SITE_URL` = `https://lumni-psi.vercel.app` or auto-detected).

#### Build-time vars (set at deployment, NOT in Vercel env):

Set in `.env.production` or in Vercel's build settings:

- `NEXT_PUBLIC_BUILD_VERSION` — git tag or `1.0.0`
- `NEXT_PUBLIC_COMMIT_HASH` — injected by CI
- `NEXT_PUBLIC_BUILD_TIMESTAMP` — injected by CI

### 3.6 Update hardcoded URL fallbacks

The following files hardcode a fallback URL. Each reads `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL` first — after setting the env var, no code change is required. But if the env var is not set, they fall back to the old domain:

| File                                             | Line | Fallback               |
| ------------------------------------------------ | ---- | ---------------------- |
| `src/app.config.ts`                              | 5    | `lumni-psi.vercel.app` |
| `src/app/[locale]/dashboard/page.tsx`            | 10   | `localhost:3000`       |
| `src/lib/referral/constants.ts`                  | 7    | `lumni-psi.vercel.app` |
| `src/lib/question-engine/enrichment-pipeline.ts` | 200  | `localhost:3000`       |
| `src/app/api/q/share/route.ts`                   | 50   | `lumni-psi.vercel.app` |
| `src/app/api/admin/auth/resend/route.ts`         | 26   | `localhost:3000`       |
| `src/app/api/admin/auth/magic-link/route.ts`     | 26   | `localhost:3000`       |

After setting `NEXT_PUBLIC_APP_URL=https://lumni.ai` in production, these all resolve correctly. The fallbacks only matter if the env var is absent.

## 4. Pre-deploy verification

Run these against the current `master` before triggering a production deploy:

```bash
pnpm run typecheck          # 0 errors
pnpm run lint               # 0 warnings on changed files
pnpm run test               # all pass (baseline: 1712+)
pnpm run build              # succeeds (no Sentry errors)
pnpm exec playwright test   # e2e + a11y pass
pnpm run deadcode           # no new dead code
```

The CI pipeline (`.github/workflows/ci.yml`) already gates on quality → tests → build before merging PRs to `master`. If CI is green on `master`, the build is deployable.

## 5. Deploy

### 5.1 Via Vercel GitHub integration (automatic)

Push to `master` → Vercel auto-deploys to production. No manual command needed.

### 5.2 Via Vercel CLI (manual)

```bash
npx vercel --prod
```

Use this if you need to deploy a specific commit without pushing to `master`.

### 5.3 Trigger Sentry release

The `sentry-release` job in CI creates a release automatically on push to `master`. If deploying manually:

```bash
npx sentry-cli releases new "$(git rev-parse HEAD)"
npx sentry-cli releases set-commits "$(git rev-parse HEAD)" --auto
npx sentry-cli releases finalize "$(git rev-parse HEAD)"
```

## 6. Post-deploy verification

### 6.1 Health checks

```bash
# Primary domain
curl -sI https://lumni.ai
# Expected: HTTP/1.1 200 OK, Server: Vercel

# www redirect
curl -sI https://www.lumni.ai
# Expected: HTTP/1.1 301 (or 308) → location: https://lumni.ai/

# Legacy domain still works (during transition)
curl -sI https://lumni-psi.vercel.app
# Expected: HTTP/1.1 200 OK

# CSP headers
curl -sI https://lumni.ai | findstr "Content-Security-Policy"
# Expected: present with all directives

# SSL
curl -sI https://lumni.ai | findstr "Strict-Transport-Security"
# Expected: max-age=63072000; includeSubDomains; preload
```

### 6.2 Sentry check

- [ ] Log into [sentry.io](https://sentry.io) → `org1128/lumni`
- [ ] Verify the new release appears in Releases
- [ ] Verify no new errors spike after deployment
- [ ] Check `Performance` tab for page load times on the new domain

### 6.3 Login flow

- [ ] Navigate to `https://lumni.ai`
- [ ] Complete sign-in (email/password or magic link)
- [ ] Verify redirect URLs contain `lumni.ai`, not `lumni-psi.vercel.app`
- [ ] Verify referral links: share a question → confirm URL is `https://lumni.ai/q/...`

### 6.4 PWA check

- [ ] Open Chrome DevTools → Application → Manifest
- [ ] Verify `start_url`, `scope`, and `icons` reference the new domain
- [ ] Service worker registration succeeds (Console → no errors)
- [ ] Offline page loads when disconnected

## 7. Rollback

If the production deploy has issues:

### 7.1 Revert DNS (fastest)

Point `lumni.ai` CNAME back to the previous deployment or remove it:

```bash
npx vercel domains rm lumni.ai --project lumni
```

### 7.2 Revert Vercel deployment

Vercel keeps all previous production deployments. In the Vercel dashboard:

1. Go to **Deployments**
2. Find the last known-good deployment (the one before the broken deploy)
3. Click the `···` menu → **Promote to Production**

Or via CLI:

```bash
npx vercel rollback
```

### 7.3 Revert env vars

If the issue is env-var-related, change `NEXT_PUBLIC_SITE_URL` back to `https://lumni-psi.vercel.app` in Vercel production env and redeploy.

### 7.4 What to monitor during rollback

- Sentry error rate should return to baseline within 5 minutes
- CSP violation reports should stop spiking
- All share/auth links generated during the broken period will point to the new domain — they redirect to `lumni.ai` which now points back to the old deployment. This is self-healing once DNS propagates.

## 8. Cron jobs

The app has two background job patterns:

### 8.1 Weekly digest push

| Item         | Detail                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Endpoint     | `POST /api/cron/weekly-digest`                                         |
| Protected by | Admin auth (`requireAdmin()`)                                          |
| What it does | Computes weekly quiz stats, sends web push to subscribers              |
| Trigger      | External cron service (Vercel Cron Jobs, cron-job.org, GitHub Actions) |

**To configure with Vercel Cron Jobs (recommended):**

Add to `next.config.ts`:

```ts
async rewrites() {
  return [
    // ... existing rewrites
  ];
}
```

Then configure in Vercel dashboard → lumni → Cron Jobs:

- **Path:** `/api/cron/weekly-digest`
- **Schedule:** `0 18 * * 0` (every Sunday at 18:00 SAST)
- **Method:** POST

Alternatively, use GitHub Actions with a scheduled workflow:

```yaml
name: Weekly digest
on:
  schedule:
    - cron: "0 16 * * 0"  # 18:00 SAST in winter
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: curl -X POST https://lumni.ai/api/cron/weekly-digest \
               -H "Authorization: Bearer ${{ secrets.ADMIN_SECRET }}"
```

### 8.2 Prune stale questions

| Item    | Detail                                                             |
| ------- | ------------------------------------------------------------------ |
| Handler | `pruneStaleQuestions` in `src/lib/orchestrator/handlers/domain.ts` |
| Trigger | Enqueued from `POST /api/engine/generate`                          |
| Runtime | Dexie-only (client-side), no server-side cron needed               |

This is a local Dexie operation triggered by the question engine — it does not need a server-side cron.

### 8.3 Daily digest (local notification)

| Item    | Detail                                             |
| ------- | -------------------------------------------------- |
| Source  | `scheduleDailyDigest()` in notification-service    |
| Trigger | Browser-side `setInterval` when user has consented |
| Scope   | Client-side only                                   |

No server-side configuration needed. The browser-service-worker handles scheduling.

## 9. Monitoring

### 9.1 Sentry alerts

Configured in Sentry.io → Alerts:

| Alert            | Threshold            | Action                        |
| ---------------- | -------------------- | ----------------------------- |
| Error rate spike | >5% increase over 1h | Email + Slack (if configured) |
| HTTP 5xx rate    | >1% of requests      | Email                         |
| Crash-free rate  | <99.5% of sessions   | Email                         |
| Performance p95  | >3s LCP              | Email                         |

### 9.2 Uptime monitoring

Recommendations (not yet configured):

- **BetterStack** or **Pingdom** — free tier checks every 5 minutes
- **Check**: `https://lumni.ai` returns 200, TLS valid, response < 5s
- **Alert**: Email + optional SMS

### 9.3 CSP violation monitoring

CSP violation reports are sent to `POST /api/csp-violation` which logs via Sentry with `csp-violation` tag. Monitor in Sentry:

- Filter: `tag:type:csp-violation`
- Expected: near-zero after initial deployment

### 9.4 Error budgets

| Metric       | Target              | Alert at       |
| ------------ | ------------------- | -------------- |
| Error rate   | <0.1% of page views | >0.5%          |
| API 5xx      | <0.5% of requests   | >1%            |
| LCP (mobile) | <2.5s p75           | >4s            |
| Uptime       | 99.9%               | <99.5% monthly |

## 10. Known issues and blockers

### 10.1 Domain ownership unknown

The `lumni.ai` domain is registered (used for `hello@lumni.ai` email) but the DNS provider/registrar is not documented. **This is the primary blocker.** Before any deployment steps can proceed, someone with DNS access must be identified.

### 10.2 Email delivery dependency

The domain serves email (`hello@lumni.ai`, `support@lumni.ai`). Changing DNS (especially nameserver delegation to Vercel) could disrupt email. If the email provider is not Vercel DNS, use the external CNAME option to avoid touching existing MX records.

### 10.3 Mixed-content issues on existing CSP

The CSP allows `https://*.cloud.appwrite.io` and `wss://*.cloud.appwrite.io`. After migration, all connect-src entries still match because they use wildcard patterns — no CSP update needed for the domain change itself.

### 10.4 Appwrite collection indexes

`pnpm run db:ensure` must be run against the production Appwrite project to create all database collections and indexes. This requires `APPWRITE_API_KEY` with appropriate scopes.

## 11. Step-by-step execution order

When ready to deploy:

1. **Pre-check** — confirm DNS access, Vercel access, Appwrite access, all API keys available
2. **DNS** — add CNAME `lumni.ai → cname.vercel-dns.com` (or delegate nameservers)
3. **Vercel domain** — add `lumni.ai` in Vercel dashboard → Domains
4. **Wait for SSL** — verify via curl (1–30 min)
5. **Env vars** — set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` to `https://lumni.ai` in Vercel production env
6. **Appwrite** — run `pnpm run db:ensure` against production
7. **Deploy** — push to `master` (or `npx vercel --prod`)
8. **Verify** — run health checks from §6
9. **Cron** — configure weekly digest cron trigger
10. **Monitor** — watch Sentry for 24h after deploy
