# Full End-to-End Monetization

**Date:** 2026-05-27
**Status:** Approved

## Overview

Complete the payment integration for Lumni by adding the missing Stripe webhook, fixing premium sync, fixing the cancel flow, and adding a monthly pricing option. This makes Stripe and Payfast payments work end-to-end.

## What Exists

- Stripe checkout route (raw fetch, no SDK)
- Stripe cancel route (no subscriptionId passed)
- Stripe verify route (checks Stripe + Appwrite)
- Payfast checkout route (MD5 signed form data)
- Payfast IPN webhook (signature validate + Appwrite write)
- PremiumProvider (localStorage-based, no server sync on load)
- PremiumGate component
- Feature gating in 4 components
- Pricing comparison on homepage

## What Needs Building

### 1. Stripe Webhook `POST /api/stripe/webhook`

**Dependencies:** Install `stripe` npm package for webhook signature verification.

**Endpoint:** `src/app/api/stripe/webhook/route.ts`

**Events to handle:**

- `checkout.session.completed` — Extract `client_reference_id` (userId), write Appwrite `premium_subscriptions` doc with status `active`, provider `stripe`, subscriptionId, expiresAt (1 year from now)
- `customer.subscription.deleted` — Update Appwrite doc status to `cancelled`

**Flow:**

1. Read `stripe-signature` header
2. Verify using `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
3. Parse event type
4. Handle relevant events
5. Return 200

**Auth:** Public (Stripe sends it)

### 2. Premium Sync on Load

**File:** `src/lib/premium/premium-context.tsx`

**Changes:**

- On mount (inside `useEffect` in the provider), call `POST /api/premium/verify`
- If server returns `isPremium: true`, update local state with the server's `expiresAt`
- If server returns `isPremium: false` but local state says premium, downgrade locally
- This ensures premium persists across devices and survives localStorage clears

**Also:** Add rate-limiting to the verify endpoint (`withRateLimit`, 10/min).

### 3. Cancel Subscription Fix

**Problem:** The cancel route requires `subscriptionId` in the body, but the premium context doesn't store or send it.

**Changes:**

- Extend `PremiumState` to include `subscriptionId?: string`
- Store `subscriptionId` when it comes from Stripe (from verify endpoint response) or Payfast
- PremiumContext `cancelSubscription()` reads `subscriptionId` from state and sends it
- On webhook `subscription.deleted`, clear `subscriptionId` from local state

### 4. Monthly Pricing Option

**Changes:**

- **Stripe:** Add `PRICE_PREMIUM_MONTHLY` env var with a monthly Stripe price ID
- **Payfast:** Pass `billingFrequency: "monthly" | "yearly"` to the checkout route
- **Premium page:** Add a billing toggle (monthly/yearly) before the checkout buttons
- **Hardcoded amounts:** R99/mo (existing), R999/yr (new yearly, ~R83/mo effective)
- **Expiry calculation:** 30 days for monthly, 365 days for yearly

### 5. Install Stripe Package

```bash
bun add stripe
```

## Files Changed

| File                                    | Change                                                            |
| --------------------------------------- | ----------------------------------------------------------------- |
| `package.json`                          | Add `stripe` dependency                                           |
| `src/app/api/stripe/webhook/route.ts`   | **New** — webhook handler                                         |
| `src/lib/premium/premium-context.tsx`   | Add `syncPremium` on mount, `subscriptionId` in state, cancel fix |
| `src/app/api/premium/verify/route.ts`   | Add rate limiting                                                 |
| `src/app/[locale]/premium/page.tsx`     | Add billing toggle (monthly/yearly), pass billing frequency       |
| `src/app/api/premium/checkout/route.ts` | Accept `billing` param for monthly/yearly                         |
| `src/app/api/payfast/checkout/route.ts` | Accept `billing` param                                            |
| `.env.example`                          | Add `PRICE_PREMIUM_MONTHLY`, `PAYFAST_MERCHANT_ID` etc.           |

## Testing

- Stripe webhook: Test with Stripe CLI (`stripe trigger checkout.session.completed`)
- Premium sync: Clear localStorage, reload app, verify premium persists from server
- Cancel: Click cancel, verify subscription cancelled + webhook updates status
- Billing toggle: Switch monthly/yearly, verify correct price/amount sent
