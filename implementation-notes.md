# Implementation Notes — Anonymous User Gating

## Summary of Changes

### 1. Top Nav (`src/components/navigation/top-nav.tsx`)
- **Change**: Anonymous users now see the **Sign In button** instead of the avatar dropdown
- **Before**: `status === "authenticated"` (covers both logged-in and anonymous) → avatar dropdown
- **After**: `status === "unauthenticated" || isAnonymous` → Sign In button; `status === "authenticated" && !isAnonymous` → avatar dropdown
- **Tradeoff**: Anonymous users lose quick access to Settings from the top nav. They can still reach Settings via the bottom nav. This is intentional — the empty state on the Profile tab redirects them to sign in.
- **Note**: The XP/level bar was already correctly gated for non-anonymous users only (line 96).

### 2. Settings — Referrals Tab Hidden (`src/app/settings/settings-client.tsx`)
- **Change**: The `Referrals` tab is filtered out from the tab navigation when `isAnonymous === true`
- **Implementation**: Uses `useMemo` to compute `visibleTabs` array; a `useEffect` resets `activeTab` away from "referrals" if it was somehow set
- **Reason**: Referral system requires a real Appwrite account (referral codes are tied to user IDs)

### 3. Settings — Profile Tab Empty State (`src/components/settings/tabs/profile-tab.tsx`)
- **Change**: Anonymous users see a full-screen `EmptyStateWithIllustration` with Sign In / Create Account buttons instead of the profile form
- **Before**: Profile form rendered fully, then hid email/password/sign-out sections for anonymous, plus a subtle "browsing as guest" banner
- **After**: Early return at the top of the render function — none of the profile form code executes for anonymous users
- **Tradeoff**: We lose the ability for anonymous users to fill in school details, subjects, or study goals. These were optional fields, but since they can't be synced across devices without an account, the empty state is cleaner UX.

### 4. Dashboard — Simplified for Anonymous (`src/components/dashboard/dashboard-client.tsx`)
- **Change**: Anonymous users see a simplified dashboard with essential functionality + an upsell banner
- **Kept**: HeroBanner, SearchWidget, TabNav, GettingStartedCard, NotificationNudge, FocusTimerCard, QuizStartCard, QuickActions
- **Replaced with upsell**: BentoStatRow (StatsCards + DailyProgressRing), StreakCard, DailyChallenges, AchievementShowcase
- **Hidden**: CountdownHeader (personalized greeting), TodayFocusCard, StudyPlanOverview, CompetencyOverview, BloomTaxonomyWidget, ComparativeAnalyticsPanel, StatsRow
- **Upsell**: `EmptyStateWithIllustration` with Sign In / Create Account buttons appears in all tabs where analytics/stats would be
- **Tradeoff**: Anonymous users lose competency tracking, study planning, and comparative analytics on the dashboard. These features all depend on Appwrite-backed data or user-specific API calls that won't have meaningful data for anonymous sessions.

### 5. Remaining Pages — No Changes Needed
After analysis:
- All other pages (Quiz, Flashcards, Problems, Chat, Study Plan, Upload, Review, Premium, Search) work with local Dexie/IndexedDB/localStorage and don't require auth
- No page-level route guards needed — the app auto-creates anonymous sessions, so every visitor is always "authenticated" in some form
- The admin page already has its own `localStorage("admin_session")` gating — no changes needed

## Decisions Not in the Spec

### Why not hide more settings tabs?
The UI (theme), Study, Alerts, Data, and Beta tabs all store preferences in **localStorage**, not Appwrite. Anonymous users can still benefit from these settings. The Data tab's Progress Export reads from local Dexie, which has data from anonymous quiz attempts.

### Why not add a route guard middleware?
The app creates anonymous sessions by default, so there's no concept of "not signed in" at the route level. Soft gating via component-level `isAnonymous` checks is the correct pattern here.

### Why no premium page gating?
The premium page is a marketing/upsell page — it should be visible to everyone. The `usePremium()` hook is localStorage-based, so anonymous users can even "become premium" in local state (though actual premium features behind API calls will fail server-side).

### Redirect behavior
All upsell buttons redirect with `?redirect=/settings` or `?redirect=/dashboard` so users land back where they were after signing in.

---

# Implementation Notes — National Exam Dates Tracker

## Summary

### New Files

| File | Purpose |
|------|---------|
| `src/lib/exam-dates/types.ts` | `ExamSlot` type, `getCurrentSession()` |
| `src/lib/exam-dates/service.ts` | CRUD + Dexie caching + formatting utils |
| `src/lib/exam-dates/data-2026-may.ts` | Seed timetable (~90 exam slots for May/June 2026 NSC) |
| `src/lib/exam-dates/index.ts` | Barrel exports |
| `src/components/tools/national-exam-calendar.tsx` | Main component: Apple widget + agenda view |
| `src/components/tools/exam-detail-dialog.tsx` | Detail Dialog with Practice / Mock / Common Q actions |
| `src/app/api/exam-dates/route.ts` | GET endpoint for seed data |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Added `examDates` table (version 12) |
| `src/components/tools/tools-dialog.tsx` | Replaced old `ExamCalendar` with `NationalExamCalendar` |
| `src/components/tools/index.ts` | Added `NationalExamCalendar` export |
| `src/components/dashboard/practice/exams-browse.tsx` | Added "Exam Dates" button (opens tools dialog → calendar tab) |

### Decisions not in the spec

1. **PDF parsing skipped for now**: The education.gov.za PDF is image-based (contains embedded JPEGs). Text extraction via `@opendataloader/pdf` or `pdfjs-dist` failed. Instead, I manually extracted the timetable from search results (studentdaily.co.za article that had the full table) and wrote seed data. The `POST /api/exam-dates/refresh` endpoint is not implemented — added to TODO.

2. **Dexie-only caching (no Appwrite write path)**: The service reads from Dexie L1 and falls back to the seed array. I designed the API route to be the always-fresh source, but the Appwrite write path for `exam_dates` collection is not implemented — data lives in seed + Dexie. For a production rollout, a server-side cron would scrape the PDF, store in Appwrite, and the client would sync from there.

3. **Icon availability**: `@hugeicons/core-free-icons` doesn't have `ClockForwardIcon`. Used `TimeScheduleIcon` instead. Also doesn't have `Calendar01FreeIcons` (that was used in old component) but `Calendar01Icon` is fine.

4. **Toast hook usage**: The `useToast()` hook returns `null | ((props) => void)`. This project also exports a top-level `toast()` function that works outside React context. Used the direct `toast()` import for the "Coming Soon" toasts.

5. **Reused subject colors from old component**: The `subjectColors` and `subjectAbbrs` maps are duplicated in the new service. In a future refactor they should be moved to a shared location.

6. **Old `ExamCalendar` preserved**: The old manual exam calendar is still at `src/components/tools/exam-calendar.tsx` and exported. It's not deleted — just no longer used in the tools dialog. Can be removed in a future cleanup.

## Verification
- `npx tsc --noEmit`: ✅ 0 errors
- `npx @biomejs/biome check --write --unsafe`: ✅ 0 errors on changed files
