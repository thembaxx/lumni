import { logError } from "@/lib/shared/logger";

export const StorageKeys = {
  // Auth
  AnonymousAttempted: "lumni_anonymous_attempted",
  // Onboarding
  Onboarding: "lumni_onboarding",
  OnboardingV1: "lumni_onboarding:v1",
  HasVisited: "lumni_has_visited",
  // Theme
  Theme: "theme",
  // Gamification
  Gamification: "lumni_gamification",
  DisplayName: "lumni_display_name",
  WeeklyFreezeGrant: "lumni_last_freeze_grant_week",
  TotalXp: "lumni_total_xp",
  Streak: "lumni_streak",
  LeaderboardHistory: "lumni_leaderboard_history",
  // Settings
  NotificationSettings: "lumni_notification_settings",
  StudyPreferences: "study-preferences",
  // PWA
  PwaInstallDismissed: "pwa-install-dismissed",
  // AI
  AiLatency: "lumni_ai_latency",
  EngineQuality: "lumni_engine_quality",
  EngineAnalytics: "lumni_engine_analytics",
  // Quiz
  ActiveQuizSession: "lumni_active_quiz_session",
  // Dictionary
  DictionaryRecent: "lumni_dictionary_recent",
  // Notes
  NotesV1: "lumni-notes:v1",
  NotesMigrated: "lumni-notes:migrated",
  // Study sets
  StudySetsV1: "lumni-study-sets:v1",
  // Study plan
  PlanTargetAps: "lumni_plan_target_aps",
  PlanDailyMinutes: "lumni_plan_daily_minutes",
  // Flashcard
  SrDailyBudget: "lumni_sr_daily_budget",
  // Exam dates
  ExamDates: "lumni_exam_dates",
  // Referral
  ReferralSource: "lumni_referral_source",
  // Consent
  Consent: "lumni-consent",
  // QOTD
  QotdShown: "lumni_qotd_shown",
  // Login banner
  LoginBannerDismissed: "lumni_login_banner_dismissed",
  // Question ratings
  QuestionRatings: "lumni_question_ratings",
  // Next action
  NextActionDismiss: "lumni_next_action_dismiss",
  // Local data notice
  LocalDataNoticePrefix: "lumni_dismiss_notice",
  // Usage events
  UsageEvents: "lumni_usage_events",
  // Notification schedule
  NextReminder: "lumni_next_reminder",
  // Admin
  AdminSession: "admin_session",
  AdminEmail: "admin_email",
  AdminAccess: "admin_access",
  // Notification nudge
  NudgeDismissed: "lumni_nudge_dismissed",
  // Getting started
  Steps: "lumi_steps",
  FirstVisits: "lumi_first_visits",
  // Referral tracking
  Referrer: "lumni_referral_source",
  // Study buddy
  SharedStreakPrefix: "shared_streak",
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export const ls = {
  getString(key: StorageKey, fallback = ""): string {
    if (!isBrowser()) return fallback;
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch (e) {
      logError("Storage.getString", e);
      return fallback;
    }
  },

  getJSON<T>(key: StorageKey, fallback: T): T {
    if (!isBrowser()) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch (e) {
      logError("Storage.getJSON", e);
      return fallback;
    }
  },

  setString(key: StorageKey, value: string): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      logError("Storage.setString", e);
    }
  },

  setJSON(key: StorageKey, value: unknown): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      logError("Storage.setJSON", e);
    }
  },

  remove(key: StorageKey): void {
    if (!isBrowser()) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      logError("Storage.remove", e);
    }
  },

  clearAll(prefix: string = "lumni_"): void {
    if (!isBrowser()) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      logError("Storage.clearAll", e);
    }
  },
};
