# Anonymous User Access Spec

## Context
The app auto-creates Appwrite anonymous sessions for any visitor. Currently, anonymous users are treated identically to fully authenticated users (they hit the `status === "authenticated"` branch everywhere). This spec defines what to show/hide.

## Auth States
- **`loading`** — auth init in progress
- **`unauthenticated`** — no session at all (rare edge case)
- **`authenticated` + `isAnonymous`** — anonymous Appwrite session
- **`authenticated` + `!isAnonymous`** — fully logged in user (has email/password)

## Decisions (grilled)

### 1. Top Nav
| State | What to show |
|---|---|
| loading | Skeleton circle |
| unauthenticated | Sign In button (existing) |
| anonymous | **Sign In button** (was showing avatar dropdown) |
| logged in | Avatar dropdown with View Profile, Settings, Sign Out |

### 2. Bottom Nav
No changes — all 5 tabs (Home, Syllabus, Chat, Problems, Settings) are available to everyone.

### 3. Admin Page
No changes — already has its own `admin_session` localStorage gating with a login form. Protected as-is.

### 4. Settings — Profile Tab (anonymous)
**Replace the entire tab content** with an `EmptyStateWithIllustration`:
- Title: "Sign in to manage your profile"
- Description: "Create an account or sign in to update your name, change your password, manage your school details, and sync your progress across all your devices."
- Action: "Sign In" → `/auth/sign-in?redirect=/settings`
- Secondary action: "Create Account" → `/auth/sign-up?redirect=/settings`

### 5. Settings — Tab Visibility (anonymous)
| Tab | Show/Hide | Reason |
|---|---|---|
| Profile | **Show** (with empty state) | Redirect to sign in |
| UI | **Show** | Theme switching is local |
| Study | **Show** | Preferences stored in localStorage |
| Alerts | **Show** | Preferences stored in localStorage |
| Referrals | **Hide** | Requires real account + cross-session data |
| Data | **Show** | Local data management works without account |
| Beta | **Show** | Preferences stored in localStorage |

### 6. Dashboard (anonymous)
Show a **simplified dashboard**:
- **Keep**: SearchWidget, TabNav, HeroBanner, GettingStartedCard, NotificationNudge, FocusTimerCard, QuizStartCard, QuickActions, ScrollAmbient, GamificationCelebration
- **Replace with upsell**: BentoStatRow (StatsCards + DailyProgressRing), StreakCard, DailyChallenges, AchievementShowcase
- **Hide**: CountdownHeader (personalized greeting), TodayFocusCard, StudyPlanOverview, CompetencyOverview, BloomTaxonomyWidget, ComparativeAnalyticsPanel, StatsRow

The upsell section should show an `EmptyStateWithIllustration` prompting sign up to track progress.

### 7. Other Pages
No page-level gating needed — all existing pages work with local storage (Dexie/IndexedDB). The following already gracefully handle null/missing user data:
- Flashcards — local IndexedDB
- Quiz — local state
- Problems — public API
- Chat — no auth
- Study Plan — localStorage + optional Appwrite sync
- Review — local wrong answers journal
- Search — local Dexie
- Premium — localStorage-based
- Upload — public
