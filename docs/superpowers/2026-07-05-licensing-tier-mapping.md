# School Licensing — Feature-to-Tier Mapping & Repurposing Analysis

**Date:** 2026-07-05
**Status:** Design Spike (Plan 098)

## Pricing Model

Three tiers with rationale based on SA school market analysis (~25,000 high schools).

| Tier         | Price                                          | Target                                                 | Rationale                                                                                                                                                                              |
| ------------ | ---------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free**     | R0                                             | Individual students and teachers trialing the platform | Low friction adoption. 1 teacher seat, 20 AI questions/day — enough to evaluate but not enough to run a classroom.                                                                     |
| **Standard** | R50/school/month (R42/mo annual, ~R500/yr)     | Small schools, subject departments                     | ~R500/year is a rounding error in a school budget. 5 teacher seats covers most departments. Extra seats at R25/month make scaling predictable. At 0.5% of 25,000 schools → R75,000/mo. |
| **Premium**  | R250/school/month (R208/mo annual, ~R2,500/yr) | Large schools, whole-school adoption                   | 25 teacher seats, unlimited ghost links, parent access — covers an entire school. Extra seats at R20/month. At 0.2% of 25,000 schools → R125,000/mo.                                   |

## What Stays Free (Individual Users)

The following remain free for all individual users (not linked to a school):

| Feature                                      | Rationale                                                            |
| -------------------------------------------- | -------------------------------------------------------------------- |
| Quiz generation (limited — 20 questions/day) | Still usable for individual study, downgraded from current unlimited |
| Flashcards (SM-2)                            | Core learning tool, no server cost                                   |
| Wrong answer journal                         | Individual feedback loop                                             |
| Basic competency tracking                    | Individual progress                                                  |
| Public share routes (`/q/[id]`)              | Organic growth vector                                                |
| Problem solver (with RAG)                    | Core value prop, but downgraded to 5 solves/day for free             |
| Study planner                                | Individual tool, no server cost                                      |

## What Gates Behind a School License

| Feature                               | Tier      | Notes                                                           |
| ------------------------------------- | --------- | --------------------------------------------------------------- |
| Teacher dashboard (class view)        | Standard+ | Currently free in teacher tools. Gates at school license check. |
| Student roster management             | Standard+ | `teacher-service.ts` gets a school-filtered query layer         |
| Assignment creation & grading         | Standard+ | Full assignment lifecycle                                       |
| Observation timeline                  | Standard+ | Teacher notes on students                                       |
| Bulk question bank                    | Standard+ | Item-bank pruning for teachers                                  |
| **Advanced analytics** (school-wide)  | Standard+ | Comparative analytics across classes                            |
| **AI questions > 500/day per school** | Standard+ | Scaled limit tied to tier                                       |
| Parent access dashboard               | Premium   | Currently free in `/parent/` route                              |
| Ghost links (unlimited)               | Premium   | Currently unlimited for all teachers                            |
| Priority support                      | Premium   | Chat + email SLA                                                |
| Data export (PDF + CSV)               | Standard+ | Individual users get CSV only                                   |
| API access                            | Premium   | For school-wide integration                                     |

## Repurposing Existing Features

### Teacher Service (`src/lib/server/teacher-service.ts`)

**Current:** Queries Appwrite for student/teacher links directly. No school scoping.

**Changes needed for licensing:**

1. Add `schoolId` as a constructor/function parameter to all query methods
2. `getStudents()` → filter by `school_members.schoolId = x`
3. `getTopicMastery()` → query competencies for students in the school
4. `linkStudentToTeacher()` → create `school_members` doc (with teacher/student roles)
5. How teacher identity resolves: From `school_members.userId` where `role = "teacher"` and `schoolId = x`

**Auth gating:** Each teacher route checks:

- Caller is authenticated
- Caller has an active `school_members` record for the school
- The school has an active license (not trial, not expired, not suspended)

### Teacher API Routes (`src/app/api/teacher/`)

| Route                                       | License Gate                      | Change                                                     |
| ------------------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `GET /api/teacher/students`                 | Standard+                         | Add school filter, check license                           |
| `GET /api/teacher/topics`                   | Standard+                         | Add school filter                                          |
| `GET /api/teacher/engagement`               | Standard+                         | Add school filter, aggregate across students               |
| `GET /api/teacher/students/[id]/report`     | Standard+                         | Currently works, add license check                         |
| `POST /api/teacher/assignments/[id]/submit` | Standard+                         | No change needed functionally, just gating                 |
| `POST /api/teacher/ghost-link`              | Standard+ (Premium for unlimited) | Currently unlimited — add count check for Standard (5 max) |
| `POST /api/teacher/share-assignment`        | Standard+                         | Add license check                                          |

### Parent Dashboard (`src/app/[locale]/parent/`)

**Current:** Free for anyone who has linked as a parent.

**Changes:**

- Gate behind Premium tier (or make it a Standard add-on at R25/mo)
- Parent links a student via school code or teacher invitation
- Parent access is school-scoped — parent sees data for students at their school only
- Weekly digest notifications already exist — wire into school-level notification preferences

### Weekly Digest (`POST /api/cron/weekly-digest`)

**Current:** Admin-triggered push to all subscribers.

**Extend to:**

- School-level billing digest (sent to billing contact): next invoice date, seat usage, payment due
- School-level usage digest (sent to school admin): weekly active teachers, top subjects, questions answered
- Frequency: Weekly (Monday 08:00 SAST)

### Ghost Links (`POST /api/teacher/ghost-link`)

**Current:** Unlimited, 30-day expiry.

**Changes for licensing:**

- Free tier: 0 ghost links
- Standard tier: 5 active ghost links
- Premium tier: Unlimited
- Ghost link serves as a marketing funnel — school admin who receives a ghost link sees aggregate stats and a CTA to "Upgrade to see more"

### Student Experience on Free Tier

Individual users who are not linked to a school lose the following compared to current behavior (where everything is free):

- Question generation: capped at 20/day (from effectively unlimited via AI generate)
- No teacher tools
- No parent access
- No data export
- Problems: 5 solves/day
- Everything else: unchanged

This is a regression from the current state. One option: grandfather existing users who signed up before launch with a legacy flag (`legacyFree: true`) that preserves unlimited access. New users after launch get the capped free tier. This avoids backlash.

## Implementation Priority

| Order | Item                                                                                                               | Effort | Impact                          |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------- |
| 1     | Create Appwrite collections (`schools`, `school_admins`, `licenses`, `invoices`, `school_codes`, `school_members`) | M      | Foundation for everything       |
| 2     | School self-serve onboarding wizard (step 1-4)                                                                     | L      | Direct acquisition channel      |
| 3     | License gating middleware (`withSchoolLicense()` HOF for API routes)                                               | S      | Unlocks all gating              |
| 4     | Teacher school-scoped queries                                                                                      | M      | Licenses existing teacher tools |
| 5     | Stripe/Payfast checkout integration                                                                                | L      | Revenue capture                 |
| 6     | Stripe webhook + Payfast ITN                                                                                       | M      | Billing automation              |
| 7     | School admin dashboard (billing, seats, invites)                                                                   | L      | Self-serve management           |
| 8     | Free tier caps (20 Q/day, 5 solves/day)                                                                            | S      | Limits cost exposure            |
| 9     | Trial management + reminder emails                                                                                 | M      | Conversion optimization         |
| 10    | Parent access gating                                                                                               | S      | Upsell path                     |
