# Production Deployment

> Generated from Plan 096 (design spike). Covers deploying lumni to production
> on Vercel with the custom domain `lumni.ai`.

## Prerequisites

- [ ] Vercel project access (owner/deployment permissions for `lumni`)
- [ ] `lumni.ai` domain registered and DNS accessible
- [ ] All environment variables configured in Vercel (see `.env.example`)
- [ ] Appwrite project active (not paused) at `jnb.cloud.appwrite.io`
- [ ] Sentry project configured for production
- [ ] Github Actions CI passing on `master`

## One-time Setup

### 1. Custom domain

```bash
# Vercel CLI
npx vercel domains add lumni.ai --project lumni
npx vercel domains add www.lumni.ai --project lumni
```

For DNS, use either:

- **Vercel DNS**: Delegate nameservers at the registrar to Vercel
- **External DNS**: Add `CNAME lumni.ai → cname.vercel-dns.com` and `CNAME www → cname.vercel-dns.com`

SSL is auto-provisioned by Vercel (Let's Encrypt). Verify:

```bash
curl -I https://lumni.ai
# Expected: HTTP/2 200, valid SSL certificate
```

### 2. Environment variables

Set in Vercel project → Settings → Environment Variables (Production only):

| Variable                 | Value                        |
| ------------------------ | ---------------------------- |
| `NEXT_PUBLIC_APP_URL`    | `https://lumni.ai`           |
| `NEXT_PUBLIC_SENTRY_DSN` | From Sentry project settings |

Leave Preview/Development environments on `lumni-psi.vercel.app`.

All other env vars are documented in `.env.example` — set each one as appropriate.

### 3. Appwrite

- [ ] Verify Appwrite project is active (not paused) — https://cloud.appwrite.io
- [ ] Run database indexes: `pnpm run db:migrate`
- [ ] Verify Appwrite Functions are deployed for cron jobs (weekly digest, session pruning)
- [ ] Verify collection schemas match codebase expectations

### 4. Sentry

- [ ] Verify release tracking is set up (`.github/workflows/ci.yml` sentry-release job)
- [ ] Verify `SENTRY_AUTH_TOKEN` is set in GitHub Actions secrets
- [ ] Verify `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel

## Pre-deploy Verification

Run the full quality gate:

```bash
pnpm run gate
# Expected: lint 0 warnings, format clean, typecheck 0 errors, tests pass, deadcode clean
```

```bash
pnpm run build
# Expected: build succeeds, no warnings
```

```bash
pnpm run test:e2e
# Expected: all Playwright tests pass
```

## Deploy

### Automatic (recommended)

Push to `master` → GitHub CI runs quality gate → on green, Vercel auto-deploys production.

Current Vercel project: `lumni` (linked to `thembaxx/lumni`)

### Manual

```bash
npx vercel --prod
```

## Post-deploy Verification

- [ ] `https://lumni.ai` loads with valid SSL
- [ ] `https://www.lumni.ai` redirects to `https://lumni.ai`
- [ ] Auth flow works (sign-up, sign-in, anonymous session)
- [ ] Quiz generation works (POST `/api/engine/generate`)
- [ ] Referral links produce `https://lumni.ai/?ref=CODE`
- [ ] Sentry dashboard shows new events from production release
- [ ] Vercel deployment dashboard shows green checkmark

## Rollback

```bash
# Via Vercel dashboard: Deployment → ⋯ → Promote to Production
# Or CLI:
npx vercel rollback --yes
```

If a broken deployment is live, the quickest rollback is promoting the previous
successful deployment in the Vercel dashboard.

## Cron Jobs

| Job                | Schedule           | Implementation                                       |
| ------------------ | ------------------ | ---------------------------------------------------- |
| Weekly digest push | Sunday 18:00 SAST  | `POST /api/cron/weekly-digest` (requires admin auth) |
| Session pruning    | Daily              | Handled by Appwrite Functions                        |
| Analytics sync     | On quiz completion | Background job via orchestrator                      |

No external cron service is configured — these require manual or admin-triggered
invocation until a cron service (Vercel Cron Jobs, GitHub Actions schedule, or
external uptime monitor) is set up.

## Monitoring

- **Sentry**: Error tracking at `https://org1128.sentry.io`
- **Vercel Dashboard**: Deployment status, serverless function logs, analytics
- **Appwrite Console**: Database health, usage quotas
- **CSP violations**: Reported to Sentry via `POST /api/csp-violation`

## Known Issues

- Appwrite Cloud project may pause due to inactivity — requires manual restore
  from Appwrite console if it happens
- Gemini API quotas may be exceeded during high-traffic periods — provider chain
  falls back to Nvidia NIM → Groq automatically
- No external cron service is configured for weekly digest or scheduled jobs
