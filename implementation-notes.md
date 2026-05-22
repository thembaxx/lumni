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

## Verification
- `npx tsc --noEmit`: ✅ 0 errors
- `npx @biomejs/biome check`: ✅ 0 errors on changed files
