# School Licensing — Proposed Data Model

**Date:** 2026-07-05
**Status:** Design Spike (Plan 098)

## Design Decisions

### Teacher ↔ School Relationship

**Decision: Teachers belong to a school via school code or verified email domain.**

- A teacher joins a school by entering a 6-character school code or by having an email domain that matches the school's verified domain
- A school can have multiple teacher accounts (this is how a license scales from 1 teacher to 50 teachers)
- A teacher can belong to exactly ONE school at a time (simplifies billing — seats are per-school)
- Teachers can transfer schools (admin action, old school seat freed)

### Student Discovery

**Decision: Students join via school code + email domain auto-join.**

Three paths:

1. **School code**: Student enters 6-char code during onboarding or in Settings → Link to School
2. **Email domain**: If student's email domain matches a school's verified domain, auto-suggest the school
3. **Teacher import**: Teacher uploads roster CSV → system generates invite links for students

Students do NOT need a "seat" in the licensing model — unlimited students per school. The license gates advanced features (AI questions/day, analytics depth, teacher tools).

### Data Layer Strategy

| Collection       | Primary Store | Sync Direction       | Notes                               |
| ---------------- | ------------- | -------------------- | ----------------------------------- |
| `schools`        | Appwrite      | Server-authoritative | Created during onboarding           |
| `school_admins`  | Appwrite      | Server-authoritative | School staff management             |
| `licenses`       | Appwrite      | Server-authoritative | Subscription records                |
| `invoices`       | Appwrite      | Server-authoritative | Billing history                     |
| `school_codes`   | Appwrite      | Server-authoritative | One-time join codes                 |
| `school_members` | Appwrite      | Server-authoritative | Tracks teacher + student membership |

## Proposed Appwrite Collections

### `schools`

Primary school entity.

| Field           | Type   | Required | Description                                                                            |
| --------------- | ------ | -------- | -------------------------------------------------------------------------------------- |
| `$id`           | string | auto     | Appwrite document ID                                                                   |
| `name`          | string | yes      | School name (e.g. "South Peninsula High School")                                       |
| `slug`          | string | yes      | URL-friendly name, unique index                                                        |
| `domain`        | string | no       | Verified email domain (e.g. "southpenhigh.co.za") — nullable for schools without email |
| `address`       | string | no       | Physical address                                                                       |
| `contactEmail`  | string | yes      | Billing contact email                                                                  |
| `contactPhone`  | string | no       | Billing contact phone                                                                  |
| `licenseTier`   | string | yes      | `"free"` \| `"standard"` \| `"premium"`                                                |
| `seatCount`     | number | yes      | Total seats purchased (teachers only, students unlimited)                              |
| `seatsUsed`     | number | yes      | Current active teacher count                                                           |
| `billingStatus` | string | yes      | `"active"` \| `"trialing"` \| `"past_due"` \| `"cancelled"` \| `"suspended"`           |
| `trialEndsAt`   | string | no       | ISO date, null means no trial or trial expired                                         |
| `createdAt`     | string | auto     | ISO date                                                                               |
| `updatedAt`     | string | auto     | ISO date                                                                               |

**Indexes:**

- `domain` (unique, sparse — only schools with verified domains)
- `billingStatus`

### `school_admins`

Users who manage school license and settings.

| Field       | Type   | Required | Description                                     |
| ----------- | ------ | -------- | ----------------------------------------------- |
| `$id`       | string | auto     |                                                 |
| `schoolId`  | string | yes      | References `schools.$id`                        |
| `userId`    | string | yes      | References Appwrite user account                |
| `role`      | string | yes      | `"admin"` \| `"billing"` \| `"teacher_manager"` |
| `invitedAt` | string | yes      | ISO date                                        |
| `joinedAt`  | string | no       | ISO date, null if invite not accepted           |
| `status`    | string | yes      | `"active"` \| `"invited"` \| `"removed"`        |

**Indexes:**

- `schoolId` + `userId` (unique compound)
- `schoolId` + `role`

### `licenses`

Subscription records tied to schools.

| Field                  | Type    | Required | Description                                                                |
| ---------------------- | ------- | -------- | -------------------------------------------------------------------------- |
| `$id`                  | string  | auto     |                                                                            |
| `schoolId`             | string  | yes      | References `schools.$id`                                                   |
| `tier`                 | string  | yes      | `"standard"` \| `"premium"`                                                |
| `status`               | string  | yes      | `"active"` \| `"trialing"` \| `"past_due"` \| `"cancelled"` \| `"expired"` |
| `startDate`            | string  | yes      | ISO date                                                                   |
| `endDate`              | string  | yes      | ISO date                                                                   |
| `autoRenew`            | boolean | yes      | Default `true`                                                             |
| `stripeSubscriptionId` | string  | no       | Stripe sub ID for paid licenses                                            |
| `payfastToken`         | string  | no       | Payfast token for SA subscriptions                                         |
| `provider`             | string  | no       | `"stripe"` \| `"payfast"` — null for free/trial                            |
| `seatCount`            | number  | yes      | Seats at time of purchase                                                  |
| `unitPrice`            | number  | yes      | Price per seat per month in ZAR cents                                      |
| `totalPrice`           | number  | yes      | `seatCount * unitPrice` in ZAR cents                                       |
| `cancelledAt`          | string  | no       | ISO date                                                                   |
| `createdAt`            | string  | auto     |                                                                            |

**Indexes:**

- `schoolId` + `status`
- `stripeSubscriptionId` (unique, sparse)

### `invoices`

Billing history.

| Field              | Type   | Required | Description                                           |
| ------------------ | ------ | -------- | ----------------------------------------------------- |
| `$id`              | string | auto     |                                                       |
| `schoolId`         | string | yes      | References `schools.$id`                              |
| `licenseId`        | string | yes      | References `licenses.$id`                             |
| `amount`           | number | yes      | In ZAR cents                                          |
| `currency`         | string | yes      | `"ZAR"`                                               |
| `status`           | string | yes      | `"paid"` \| `"pending"` \| `"failed"` \| `"refunded"` |
| `paidAt`           | string | no       | ISO date                                              |
| `periodStart`      | string | yes      | ISO date — billing period start                       |
| `periodEnd`        | string | yes      | ISO date — billing period end                         |
| `stripeInvoiceId`  | string | no       | Stripe invoice ID                                     |
| `payfastPaymentId` | string | no       | Payfast payment ID                                    |
| `lines`            | array  | no       | Invoice line items (seat additions, prorations)       |
| `downloadUrl`      | string | no       | PDF invoice URL                                       |
| `createdAt`        | string | auto     |                                                       |

**Indexes:**

- `schoolId` + `status`
- `licenseId`

### `school_codes`

One-time or reusable join codes for teacher/student onboarding.

| Field       | Type   | Required | Description                    |
| ----------- | ------ | -------- | ------------------------------ |
| `$id`       | string | auto     |                                |
| `schoolId`  | string | yes      | References `schools.$id`       |
| `code`      | string | yes      | 6-character alphanumeric code  |
| `type`      | string | yes      | `"teacher"` \| `"student"`     |
| `maxUses`   | number | no       | Null = unlimited               |
| `useCount`  | number | yes      | Default 0                      |
| `expiresAt` | string | no       | ISO date, null = never expires |
| `createdBy` | string | yes      | References `school_admins.$id` |
| `createdAt` | string | auto     |                                |

**Indexes:**

- `code` (unique)

### `school_members`

Tracks which users (teachers and students) belong to which school.

| Field       | Type   | Required | Description                              |
| ----------- | ------ | -------- | ---------------------------------------- |
| `$id`       | string | auto     |                                          |
| `schoolId`  | string | yes      | References `schools.$id`                 |
| `userId`    | string | yes      | References Appwrite user account         |
| `role`      | string | yes      | `"teacher"` \| `"student"`               |
| `status`    | string | yes      | `"active"` \| `"invited"` \| `"removed"` |
| `joinedAt`  | string | yes      | ISO date                                 |
| `invitedBy` | string | no       | References `school_admins.$id`           |
| `grade`     | string | no       | Student grade/year level                 |
| `createdAt` | string | auto     |                                          |

**Indexes:**

- `schoolId` + `userId` (unique compound)
- `schoolId` + `role`

## Proposed Dexie Tables (Offline/Browser)

For features that work offline, a lightweight cache of school membership:

### `schoolCache`

| Field        | Type                       | Description          |
| ------------ | -------------------------- | -------------------- |
| `id`         | string                     | `school_${schoolId}` |
| `schoolId`   | string                     |                      |
| `schoolName` | string                     |                      |
| `role`       | `"teacher"` \| `"student"` |                      |
| `cachedAt`   | number                     | Timestamp            |
| `ttl`        | number                     | 24h cache expiry     |

No Dexie schema migration needed yet — adding these tables is deferred until implementation.

## Data Flow Diagram

```
Onboarding
  │
  ├─ Self-serve: School admin fills form → POST /api/school/register
  │   └─ Creates school doc (tier="free", seatCount=1)
  │   └─ Creates school_admins doc (role="admin", status="active")
  │   └─ Generates school_codes entry for teacher invites
  │
  ├─ Sales-assisted: Admin creates school via dashboard
  │   └─ Same flow but billingStatus="trialing", trialEndsAt=14d
  │
  └─ Teacher joins existing school
      └─ Enters school code or verified domain match
      └─ Creates school_members doc (role="teacher")
      └─ Increments schools.seatsUsed
```
