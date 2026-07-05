# School Licensing — Proposed API Surface

**Date:** 2026-07-05
**Status:** Design Spike (Plan 098)

## Conventions

- **Auth**: All endpoints require authentication unless noted. Auth via Appwrite JWT or session cookie.
- **Rate limiting**: All POST/PATCH endpoints use `withRateLimit` (10 req/min per user). GET endpoints use 30 req/min.
- **Validation**: Zod schemas defined inline, errors return `{ error: string, code: string }` with 400/401/403/404 status.
- **Response shape**: Success: `{ data: T }`. Error: `{ error: string }`.
- **URL prefix**: All endpoints under `/api/school/`. Admin endpoints under `/api/admin/schools/`.

## Endpoints

### `POST /api/school/register`

Create a new school (self-serve onboarding step 1).

**Auth:** Authenticated user (becomes the first school admin)

**Rate limit:** 3 req/min per user (only needs to be called once)

**Zod schema:**

```ts
const RegisterSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  domain: z.string().optional(), // email domain for auto-discovery
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  agreeToTerms: z.literal(true), // required checkbox
});
```

**Response (201):**

```json
{
  "data": {
    "schoolId": "abc123",
    "name": "South Peninsula High School",
    "tier": "free",
    "seatCount": 1,
    "seatsUsed": 1,
    "billingStatus": "active",
    "joinCode": "XK4M9P",
    "adminId": "user_xyz"
  }
}
```

**Logic:**
1. Validate domain is not already registered (unique check)
2. Create `schools` doc with `tier: "free"`, `seatCount: 1`, `seatsUsed: 1`
3. Create `school_admins` doc for the calling user with `role: "admin"`
4. Generate 6-char `school_codes` entry for teacher invites
5. Create `school_members` doc for the admin as `role: "teacher"`
6. Enqueue background job: `check-domain-dns` to verify domain ownership

---

### `POST /api/school/checkout`

Create a Stripe Checkout Session or Payfast redirect for subscription purchase.

**Auth:** Authenticated user with `school_admins.role` = `"admin"` or `"billing"`

**Rate limit:** 5 req/min per school

**Zod schema:**

```ts
const CheckoutSchema = z.object({
  schoolId: z.string(),
  tier: z.enum(["standard", "premium"]),
  billingFrequency: z.enum(["monthly", "annual"]),
  seatCount: z.number().int().min(1).max(500),
  provider: z.enum(["stripe", "payfast"]).default("stripe"),
  returnUrl: z.string().url(),
});
```

**Response (200):**

```json
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/c/pay_cs_xxx",
    "sessionId": "cs_xxx"
  }
}
```

**For Payfast: returns `<form>` HTML with MD5-signed fields instead.**

**Logic:**
1. Verify caller is authorized admin for this school
2. Calculate price: `seatCount * unitPrice[tier][billingFrequency]` (prices from server-side config)
3. For Stripe: Create Stripe Checkout Session with `client_reference_id=schoolId`, `mode=subscription`, metadata with tier/seatCount
4. For Payfast: Build MD5-signed form data, return as HTML form (Payfast requires POST redirect)
5. Create `licenses` doc with `status: "pending"`

---

### `GET /api/school/billing`

Get billing history for the authenticated user's school.

**Auth:** Authenticated user with `school_admins.role` = `"admin"` or `"billing"`

**Query params:** `?schoolId=abc123&page=1&limit=20`

**Response (200):**

```json
{
  "data": {
    "school": {
      "id": "abc123",
      "name": "South Peninsula High School",
      "licenseTier": "standard",
      "billingStatus": "active",
      "seatCount": 10,
      "seatsUsed": 7,
      "trialEndsAt": null
    },
    "currentLicense": {
      "id": "lic_001",
      "tier": "standard",
      "status": "active",
      "startDate": "2026-07-01T00:00:00Z",
      "endDate": "2026-08-01T00:00:00Z",
      "autoRenew": true,
      "seatCount": 10,
      "unitPrice": 2500,
      "totalPrice": 25000
    },
    "invoices": [
      {
        "id": "inv_001",
        "amount": 25000,
        "currency": "ZAR",
        "status": "paid",
        "paidAt": "2026-07-01T00:00:00Z",
        "periodStart": "2026-07-01T00:00:00Z",
        "periodEnd": "2026-08-01T00:00:00Z",
        "lines": [
          { "description": "10 seats × Standard", "amount": 25000 }
        ]
      }
    ],
    "page": 1,
    "totalPages": 1
  }
}
```

---

### `POST /api/school/seat/add`

Add seats mid-cycle (prorated billing).

**Auth:** Authenticated user with `school_admins.role` = `"admin"` or `"billing"`

**Zod schema:**

```ts
const AddSeatSchema = z.object({
  schoolId: z.string(),
  additionalSeats: z.number().int().min(1).max(500),
});
```

**Response (200):**

```json
{
  "data": {
    "previousSeatCount": 10,
    "newSeatCount": 15,
    "proratedAmount": 12500,
    "invoiceUrl": "https://...",
    "nextBillingDate": "2026-08-01T00:00:00Z"
  }
}
```

**Logic:**
1. Verify caller is authorized admin
2. Update `schools.seatCount` (+additional)
3. Create Stripe/Payfast invoice item for prorated amount
4. Record in `invoices` with proration line items
5. If Stripe: call `stripe.subscriptions.update` with new quantity

---

### `POST /api/school/link-teacher`

Teacher joins an existing school.

**Auth:** Authenticated user (will become a teacher member)

**Rate limit:** 5 req/min per user

**Zod schema:**

```ts
const LinkTeacherSchema = z.object({
  schoolCode: z.string().length(6).optional(),
  schoolId: z.string().optional(), // only when admin-initiated
});
```

Exactly one of `schoolCode` or `schoolId` must be provided.

**Response (200):**

```json
{
  "data": {
    "schoolId": "abc123",
    "schoolName": "South Peninsula High School",
    "role": "teacher",
    "status": "active"
  }
}
```

**Logic:**
1. If `schoolCode`: look up `school_codes` by code, verify not expired and has remaining uses
2. If `schoolId`: verify caller was invited (school_members has status="invited")
3. Check `schools.seatsUsed < schools.seatCount` — reject with 403 if full
4. Create `school_members` doc with `role: "teacher"`
5. Increment `schools.seatsUsed`

---

### `POST /api/school/link-student`

Student joins a school (for school-licensed features).

**Auth:** Authenticated user

**Zod schema:**

```ts
const LinkStudentSchema = z.object({
  schoolCode: z.string().length(6).optional(),
  schoolId: z.string().optional(), // when teacher-invited
});
```

**Response (200):**

```json
{
  "data": {
    "schoolId": "abc123",
    "schoolName": "South Peninsula High School",
    "role": "student",
    "status": "active"
  }
}
```

**Logic:**
1. Same as `link-teacher` but does NOT check seat count (students unlimited)
2. Creates `school_members` doc with `role: "student"`

---

### `GET /api/admin/schools`

Admin-only: list all schools with license status.

**Auth:** Authenticated user with admin role (system admin, not school admin)

**Query params:** `?page=1&limit=20&status=active&search=`

**Response (200):**

```json
{
  "data": {
    "schools": [
      {
        "id": "abc123",
        "name": "South Peninsula High School",
        "domain": "southpenhigh.co.za",
        "licenseTier": "standard",
        "billingStatus": "active",
        "seatCount": 10,
        "seatsUsed": 7,
        "activeTeachers": 7,
        "activeStudents": 142,
        "totalQuestionsAnswered": 15420,
        "mrr": 25000,
        "trialEndsAt": null,
        "createdAt": "2026-07-01T00:00:00Z"
      }
    ],
    "page": 1,
    "totalPages": 3,
    "totalSchools": 58,
    "totalMrr": 1450000
  }
}
```

**Logic:**
1. Query `schools` collection with filters
2. Aggregate stats per school from analytics data
3. Calculate MRR from active licenses

---

### `GET /api/admin/schools/[schoolId]`

Get detailed view of a single school.

**Auth:** Authenticated user with system admin role

**Response (200):**

```json
{
  "data": {
    "school": { "...school fields..." },
    "admins": [
      { "userId": "usr_1", "name": "John", "email": "john@...", "role": "admin" }
    ],
    "teachers": [
      { "userId": "usr_2", "name": "Jane", "grade": "grade-10", "lastActive": "..." }
    ],
    "studentCount": 142,
    "recentInvoices": [ "...last 5 invoices..." ],
    "usageStats": {
      "totalQuizzes": 892,
      "totalQuestions": 15420,
      "avgScore": 0.67,
      "activeTeachersLast30d": 7,
      "activeStudentsLast30d": 89
    }
  }
}
```

---

### `POST /api/school/cancel`

Cancel subscription at period end.

**Auth:** Authenticated user with `school_admins.role` = `"admin"`

**Zod schema:**

```ts
const CancelSchema = z.object({
  schoolId: z.string(),
  reason: z.string().max(500).optional(),
  immediate: z.boolean().default(false), // immediate vs end-of-period
});
```

**Response (200):**

```json
{
  "data": {
    "licenseId": "lic_001",
    "status": "cancelling",
    "effectiveEndDate": "2026-08-01T00:00:00Z"
  }
}
```

---

### `POST /api/school/check-domain`

Check if an email domain is already registered to a school (for auto-discovery).

**Auth:** Public (no auth required)

**Zod schema:**

```ts
const CheckDomainSchema = z.object({
  domain: z.string().min(3).max(200),
});
```

**Response (200):**

```json
{
  "data": {
    "registered": true,
    "schoolName": "South Peninsula High School",
    "schoolId": "abc123"
  }
}
```

If domain is not registered: `{ "data": { "registered": false } }`

---

## Webhook: Stripe `POST /api/stripe/webhook`

Reusing the pattern from the original monetization spec, but adapted for schools.

**Events to handle:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Create `licenses` doc from metadata, activate `schools.billingStatus`, create first `invoices` doc |
| `customer.subscription.updated` | Sync seat counts, tier changes, status changes to `schools` and `licenses` |
| `customer.subscription.deleted` | Set `schools.billingStatus = "cancelled"`, `licenses.status = "cancelled"` |
| `invoice.paid` | Create `invoices` doc, update `licenses` period end |
| `invoice.payment_failed` | Set `schools.billingStatus = "past_due"`, send notification to billing contact |

## Webhook: Payfast ITN `POST /api/payfast/itn`

- Validate IPN signature (MD5 comparison)
- Match `m_payment_id` to pending license doc
- On `payment_complete`: activate license, create invoice
- On `payment_failed`: set license status to `"failed"`, notify admin

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `SCHOOL_NOT_FOUND` | 404 | School ID doesn't exist |
| `NOT_SCHOOL_ADMIN` | 403 | User is not authorized for this school |
| `SEATS_EXHAUSTED` | 403 | School has no available seats |
| `DOMAIN_TAKEN` | 409 | Email domain already registered to another school |
| `INVALID_CODE` | 404 | School code doesn't exist or expired |
| `ALREADY_MEMBER` | 409 | User is already a member of this school |
| `TIER_NOT_FOUND` | 400 | Invalid tier selection |
| `CHECKOUT_FAILED` | 500 | Payment provider returned an error |
