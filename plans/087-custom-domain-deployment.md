# Plan 087: Custom domain deployment — lumni.ai DNS + SSL + env config

> **Superseded by Plan 096** (2026-07-05). The deployment checklist is now at `docs/deployment.md`.

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/app.config.ts .env.example vercel.json next.config.ts`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (most time is DNS propagation, not code)
- **Risk**: LOW
- **Depends on**: Vercel project access (team owner or deployment permissions)
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

Lumni runs on `lumni-psi.vercel.app` — a preview domain. Every share link, referral link, email, bookmark, and URL bar shows this subdomain. For a product targeting stressed Matric students and their parents (who evaluate trust signals carefully), a `vercel.app` domain signals "unfinished project" rather than "legitimate study tool." The app's email domain is `hello@lumni.ai` — but the app itself isn't served from `lumni.ai`. This asymmetry is the #1 trust gap.

Custom domain deployment is the only medium-term ROADMAP item with zero implementation progress (all others have partial or full work).

## Current state

- `app.config.ts:5` — `APP_URL` hardcoded to `"https://lumni-psi.vercel.app"`
- `NEXT_PUBLIC_APP_URL` — env var exists but is not set in any Vercel environment
- No DNS records exist for `lumni.ai` pointing to Vercel
- Vercel project dashboard allows custom domain configuration under "Domains" settings
- The `lumni.ai` domain is registered (used for email `hello@lumni.ai`) — verify who manages DNS

## STOP conditions

- You do not have Vercel project deployment access
- The `lumni.ai` domain DNS is not accessible (must add CNAME + verify)
- The existing Vercel deployment has critical pending changes that would be disrupted

## Commands you will need

| Purpose          | Command                                           | Expected on success |
| ---------------- | ------------------------------------------------- | ------------------- |
| Vercel CLI login | `npx vercel login`                                | logged in           |
| List domains     | `npx vercel domains ls`                           | shows current       |
| Add domain       | `npx vercel domains add lumni.ai --project lumni` | DNS instructions    |
| Typecheck        | `pnpm run typecheck`                              | exit 0              |

## Scope

**In scope**:

- Add `lumni.ai` as a custom domain in Vercel project settings
- Add `CNAME lumni.ai -> cname.vercel-dns.com` DNS record (or use Vercel's nameservers)
- Verify SSL certificate provisioning (Vercel auto-provisions via Let's Encrypt)
- Update `NEXT_PUBLIC_APP_URL` in Vercel production environment to `https://lumni.ai`
- Update `app.config.ts` to derive `APP_URL` from `NEXT_PUBLIC_APP_URL` with fallback to Vercel preview domain
- Set up `www.lumni.ai` redirect → `lumni.ai` (optional but recommended)
- Test the `referral` share links produce `https://lumni.ai/?ref=CODE` instead of `https://lumni-psi.vercel.app/?ref=CODE`

**Out of scope**:

- `hello@lumni.ai` email configuration (already works)
- Stripe/Payfast webhook domain updates (premium removed)
- SEO migration / 301 redirect strategy from old domain
- Analytics domain change tracking

## Steps

### Step 1: Verify domain ownership

Check who manages the `lumni.ai` DNS. Options: (a) Vercel DNS (fastest — just add nameservers), (b) external DNS provider (add CNAME record manually), (c) Vercel DNS import. Access the DNS provider's console.

### Step 2: Add domain in Vercel

```bash
npx vercel domains add lumni.ai --project lumni
```

Follow the DNS configuration instructions printed by the CLI. If using Vercel DNS, delegate nameservers at the registrar. If using external DNS, add a `CNAME` record for `lumni.ai` → `cname.vercel-dns.com`.

Add `www.lumni.ai` as an alias (CNAME `www` → `lumni-psi.vercel.app`) with a 301 redirect.

### Step 3: Wait for DNS propagation + SSL

Vercel auto-provisions an SSL certificate via Let's Encrypt once DNS resolves. This takes 1-30 minutes. Verify with `curl -I https://lumni.ai`.

### Step 4: Update environment variables

In Vercel project settings → Environment Variables, set:

- `NEXT_PUBLIC_APP_URL` → `https://lumni.ai` (Production only)
- Leave Preview/Development on the Vercel subdomain

### Step 5: Update app.config.ts fallback

Open `src/app.config.ts`. Change the hardcoded fallback to derive from env:

```ts
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://lumni-psi.vercel.app";
```

### Step 6: Verify share links

Trigger a referral share link. Confirm it produces `https://lumni.ai/?ref=CODE`. Spot-check: referral tab, question share, bookmark URL.

### Step 7: Typecheck

Run `pnpm run typecheck` — 0 errors.

## Verification

1. `https://lumni.ai` loads the app with valid SSL
2. `https://www.lumni.ai` redirects to `lumni.ai`
3. Referral codes produce `https://lumni.ai/?ref=XXX` links
4. `NEXT_PUBLIC_APP_URL` is not used anywhere else that would break on the new domain
5. The old `lumni-psi.vercel.app` still works (no production disruption during transition)
