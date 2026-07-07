# Plan 132: Create Stripe webhook handler to activate school licenses

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/school/ src/app/api/school/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

`createStripeCheckoutSession` creates a Stripe checkout and writes a LICENSES doc with `status: "pending"`. But no webhook route exists to transition `"pending"` → `"active"` after payment succeeds. The B2B2C revenue path is broken at the payment handshake — schools can complete checkout but their license never activates.

## Current state

- `src/lib/school/billing-service.ts:63-133` — creates checkout session, writes `status: "pending"`
- `src/lib/school/billing-service.ts:136-192` — `cancelSubscription` references `stripe.subscriptions.update`
- No `src/app/api/stripe/webhook/route.ts` exists
- Design spec at `docs/superpowers/2026-07-05-licensing-api.md:417-436` documents the webhook events

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`      | exit 0, no errors   |
| Tests     | `pnpm run test -- school` | all pass            |

## Steps

### Step 1: Create webhook route

Create `src/app/api/stripe/webhook/route.ts`:

```ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/constants";
import { logError } from "@/lib/shared/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logError("StripeWebhook", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Activate the license, create invoice doc
      await activateLicense(session);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await deactivateLicense(subscription);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await markPaymentFailed(invoice);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

### Step 2: Implement event handlers

Add `activateLicense`, `deactivateLicense`, `markPaymentFailed` functions to `src/lib/school/billing-service.ts`. Each updates the Appwrite LICENSES document based on the Stripe event data.

### Step 3: Add STRIPE_WEBHOOK_SECRET to .env.example

Add `STRIPE_WEBHOOK_SECRET=` to the Stripe section of `.env.example`.

### Step 4: Add tests

Create `src/app/api/stripe/webhook/__tests__/route.test.ts` with:

- Signature verification (reject invalid)
- checkout.session.completed activates license
- subscription.deleted deactivates
- payment_failed marks invoice

### Step 5: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] `src/app/api/stripe/webhook/route.ts` created
- [ ] Handles `checkout.session.completed`, `subscription.deleted`, `invoice.payment_failed`
- [ ] Signature verification with `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_WEBHOOK_SECRET` in `.env.example`
- [ ] Tests for signature verification and event handling
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `STRIPE_SECRET_KEY` env var is not configured (check `.env.example`)
- The LICENSES Appwrite collection schema doesn't have the fields the webhook needs to update
