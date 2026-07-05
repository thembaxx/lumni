# Plan 096: Design spike — Production deployment to custom domain

> **Executor instructions**: This is a _design spike_ — not an implementation
> plan. The output is a deployment checklist and recommendation, not code
> changes. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check**: No code is changed by this plan. Skip drift check.

## Status

- **Priority**: P4
- **Effort**: M (research + document)
- **Risk**: LOW (no code changes)
- **Depends on**: none
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

The app is fully production-ready: Sentry monitoring, CSP/security headers, PWA offline support, full error boundaries, Skeleton loading states, centralized logging, rate limiting, CI pipeline. But it's not deployed to a custom domain — `docs/roadmap.md:8.2` lists custom domain as pending, and plan 087 (Custom domain deployment) is status PARTIAL.

Production deployment is the single biggest gap between the app's current state and its maturity level. The app could go live today — the deployment plan just needs to be finished.

## Current state

- `docs/roadmap.md:8.2` — "Custom domain + production deployment" listed in Next Up
- `plans/087-custom-domain-deployment.md` — status PARTIAL, covers Vercel domain setup
- Vercel project exists (inferred from Vercel-specific config)
- Sentry configured with production `dsn`
- Security headers: CSP, X-Frame-Options, HSTS, CORP, Permissions-Policy all set
- PWA: manifest, service worker, offline page, install tracking
- Environment variables: documented in `.env.example` (30+ vars)
- CI: quality gate → unit tests → build → e2e + a11y + bundle-size + sentry-release

## STOP conditions

- Plan 087 is already COMPLETE and deployment is live — check the actual deployment URL first
- The project owner is not ready to deploy (funding, legal, etc.) — in that case document what's needed for when they are

## Commands you will need

| Purpose          | Command                                                          | Expected on success      |
| ---------------- | ---------------------------------------------------------------- | ------------------------ |
| Check deployment | `gh api repos/{owner}/{repo}/deployments 2>/dev/null \| head -5` | Shows deployment history |
| Check Vercel     | `pnpm vercel list 2>/dev/null \| head -10`                       | Shows Vercel projects    |
| Read plan 087    | `cat plans/087-custom-domain-deployment.md`                      | Shows current state      |

## Steps

### Step 1: Read plan 087

Understand what's already been planned and what's PARTIAL. Identify the remaining steps.

### Step 2: Inventory env vars

Read `.env.example`. Group vars by runtime requirement (build-time vs server-side vs client-side). For each group, determine how they'd be set in the target deployment environment.

### Step 3: Appwrite production checklist

Appwrite is the primary backend. Check:

- Is Appwrite hosted (Cloud) or self-hosted? If self-hosted, what's the production endpoint?
- Are database indexes created for production collections?
- Are Appwrite Functions deployed (used for cron jobs like weekly digest)?
- Is the Appwrite project in production mode?

### Step 4: Write the deployment checklist

Produce a runbook document at `docs/deployment.md` covering:

1. **Prerequisites**: Vercel project, custom domain DNS, env vars, secrets
2. **One-time setup**: Domain verification, SSL provisioning, Appwrite admin setup
3. **Pre-deploy verification**: Build passes, tests pass, e2e passes, a11y passes
4. **Deploy**: Vercel production deploy command or GitHub-based auto-deploy
5. **Post-deploy verification**: Health check, Sentry check, first login flow
6. **Rollback**: How to revert to the previous version
7. **Cron jobs**: Weekly digest, session pruning — how they're configured
8. **Monitoring**: Sentry alerts, uptime monitoring, error budgets

### Step 5: Update plan 087

Mark plan 087 as COMPLETE and note that the deployment checklist is now in `docs/deployment.md`.

## Verification

1. `docs/deployment.md` exists and is comprehensive
2. Plan 087 marked as COMPLETE (or SUPERSEDED)
3. Any remaining blockers are documented as known issues
