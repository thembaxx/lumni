# School Licensing — Onboarding Wizard UX Flow

**Date:** 2026-07-05
**Status:** Design Spike (Plan 098)

## Overview

A 4-step wizard for school administrators to set up their school's Lumni license. The wizard is accessible from: (1) the landing page "For Schools" CTA, (2) the Settings → School License link, or (3) a direct `/school/onboarding` route.

The wizard supports two paths:

- **Self-serve**: Admin completes all 4 steps independently
- **Sales-assisted**: Admin completes steps 1-2, a sales rep handles payment, admin finishes with seat allocation

## Entry Points

```
Landing page "For Schools" → /school/onboarding
Settings → School License → /school/onboarding
Teacher invite link → /school/join?code=XK4M9P
Admin dashboard → /school/admin (after setup)
```

## Step 1: School Information

**Purpose:** Identify the school and discover existing affiliation.

**UI layout:** Single-column form, centered card, max-w-lg.

**Fields:**

| Field               | Type        | Validation              | Notes                                                                                                          |
| ------------------- | ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| School name         | Text input  | Required, 2-200 chars   |                                                                                                                |
| School email domain | Text input  | Optional, domain format | Auto-check: if domain is registered, show "This domain is already registered — join that school instead?" link |
| Contact email       | Email input | Required, valid email   | Billing notifications go here                                                                                  |
| Contact phone       | Tel input   | Optional, SA format     |                                                                                                                |
| Address             | Textarea    | Optional                | Multi-line                                                                                                     |
| Agree to terms      | Checkbox    | Required                | Link to Terms of Service                                                                                       |

**Auto-discovery behavior:**

- On blur of email domain field, call `POST /api/school/check-domain`
- If domain is registered: show inline banner "This domain belongs to [School Name]. Join that school instead!" with a link to `/school/join?code=...`
- If domain is not registered: proceed normally

**State on completion:** Creates a draft school record (tier = `"free"`, no license). School is not active until step 3 (payment) is completed.

**Edge cases:**

- User types a domain that looks like a school but isn't registered: proceed
- User has no school email: they can still proceed, skip domain
- Browser back: preserve form state from localStorage draft

---

## Step 2: Plan Selection

**Purpose:** Choose license tier and see what's included.

**UI layout:** Tier comparison table, 3 columns, max-w-4xl centered.

**Tiers:**

| Feature                    | Free       | Standard (R50/school/mo)     | Premium (R250/school/mo)     |
| -------------------------- | ---------- | ---------------------------- | ---------------------------- |
| Teacher seats              | 1          | 5 included, +R25/extra seat  | 25 included, +R20/extra seat |
| Students                   | Unlimited  | Unlimited                    | Unlimited                    |
| AI Questions/day           | 20/school  | 500/school                   | 2,000/school                 |
| Analytics                  | Individual | School-wide dashboard        | School-wide + per-class      |
| Teacher tools              | —          | ✓                            | ✓                            |
| Parent access              | —          | —                            | ✓                            |
| Priority support           | —          | —                            | ✓                            |
| Ghost links (sales funnel) | —          | 5 active                     | Unlimited                    |
| Data export                | CSV        | CSV + PDF                    | CSV + PDF + API              |
| Billing frequency          | —          | Monthly or Annual (2mo free) | Monthly or Annual (2mo free) |

**Visual design:**

- Three cards side-by-side on desktop, stacked on mobile
- "Recommended" badge on Standard tier
- Annual pricing shown as strikethrough comparison: "R50/mo" → "R42/mo billed annually"
- Tooltip explainers on each feature icon

**State on completion:** Selected tier stored in wizard state. User can go back to change.

**Edge cases:**

- User selects Free: skip to step 4 (no payment needed)
- User selects paid tier and has a promo code: show promo input field
- Annual pricing: show "Save 17%" badge

---

## Step 3: Payment

**Purpose:** Handle billing setup.

**UI layout:** Split view — left side has payment summary, right side has provider selection + billing contact form.

**Sub-steps:**

**3a. Billing contact**

- Name, email, phone (pre-filled from step 1, editable)
- Tax/VAT number (optional, SA schools may have Section 18A cert)

**3b. Payment provider selection**

- If SA user (IP-based or billing address): show both "Credit Card (Stripe)" and "Payfast (SA banks/EFT)"
- If non-SA: show only Stripe
- Visual: two large radio cards with logos

**3c. Payment form**

- Stripe: Embedded Stripe Checkout (redirect to stripe.com)
- Payfast: Redirect to Payfast's hosted payment page

**Trial option:**

- After payment setup but before charging: offer 14-day free trial
- "Start your 14-day trial — no charge until [date]. Cancel anytime."
- Trial automatically converts to paid subscription
- Trial schools have full Premium features (conversion hook)

**Billing summary panel (always visible):**

```
┌─────────────────────────────────┐
│  South Peninsula High School    │
│  Premium — Annual               │
│                                 │
│  Teachers: 25 included           │
│  Extra seats: 0 @ R20/seat      │
│                                 │
│  Monthly:              R250.00  │
│  Annual discount:     -R500.00  │
│  Total (annual):      R2,500.00 │
│                                 │
│  [Proceed to Payment]           │
└─────────────────────────────────┘
```

**State on completion:** License created with status "trialing" or "active". School is now fully set up.

**Edge cases:**

- Payment fails: show inline error with retry button, log to Sentry
- User closes tab during redirect: webhook handles eventual state
- Trial expires without conversion: send 3 reminder emails (7d, 3d, 1d before)

---

## Step 4: Seat Allocation

**Purpose:** Add initial teachers by email.

**UI layout:** Email input list with add/remove, plus skip button.

**Flow:**

1. Show "Welcome to Lumni for Schools!" heading with school name
2. "Invite your teachers to get started"
3. Email input row (email + optional name) with "Add another" button
4. Max 10 emails in initial invite (can do more from admin panel later)
5. "Send invites" button or "Skip for now" link

**When "Send invites" is clicked:**

- For each email: create `school_members` doc with `status: "invited"`
- Send invitation email with school code and `/school/join?code=XK4M9P` link
- Show success toast: "Invitations sent! Teachers will receive an email with setup instructions."

**When "Skip for now" is clicked:**

- Redirect to `/school/admin` dashboard
- Show persistent banner: "Invite your teachers to unlock school features"

**Post-onboarding:**

- Redirect to school admin dashboard: `/school/admin`
- Dashboard shows:
  - School name, tier, seat usage (2/10 teachers)
  - "Invite Teachers" button
  - "Billing" tab with current plan and invoice history
  - Usage overview (questions answered, active students)

## Trial Reminder Flow

For schools on trial:

| Day | Action                                                                         |
| --- | ------------------------------------------------------------------------------ |
| 0   | Trial starts, full access                                                      |
| 7   | Email: "7 days left — add payment to keep access"                              |
| 11  | Email: "3 days left — your trial expires soon"                                 |
| 13  | Email: "Tomorrow is your last day"                                             |
| 14  | Trial ends → school access downgraded to Free tier (1 seat, limited questions) |
| 21  | If still unpaid: auto-suspend school (nobody can log in from that school)      |
| 30  | If still unpaid: mark school as `billingStatus: "suspended"`, archive data     |

## Mock UI Sketch (text)

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  Lumni for Schools                               │
│                                                          │
│  Step 1  →  Step 2  →  Step 3  →  Step 4               │
│  School    Plan     Payment   Teachers                   │
│  Info      Select   Setup     Invite                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [1] School Information                                  │
│                                                          │
│  School name *                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ South Peninsula High School                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Email domain                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ @southpenhigh.co.za                              │   │
│  └──────────────────────────────────────────────────┘   │
│  ✔ This domain is available — great!                     │
│                                                          │
│  Contact email *          Contact phone                  │
│  ┌──────────────────┐    ┌─────────────────────┐        │
│  │ admin@...        │    │ +27 82 123 4567    │        │
│  └──────────────────┘    └─────────────────────┘        │
│                                                          │
│  ☐ I agree to the Terms of Service *                     │
│                                                          │
│                                   [Continue →]           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
