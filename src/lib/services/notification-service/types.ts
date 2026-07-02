import type { CompetencyDataAccess, StudyDataAccess } from "@/lib/db/data-access";

export type NotifDb = StudyDataAccess & Pick<CompetencyDataAccess, "quizAttempts">;

export interface NotificationSettings {
  enabled: boolean;
  studyReminders: boolean;
  streakAlerts: boolean;
  quizReminders: boolean;
  achievementNotifications: boolean;
  weeklyProgress: boolean;
  reminderHour: number;
  examAlerts: boolean;
  assignmentDue: boolean;
  marketing: boolean;
  dailyDigest: boolean;
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  studyReminders: true,
  streakAlerts: true,
  quizReminders: false,
  achievementNotifications: true,
  weeklyProgress: false,
  reminderHour: 18,
  examAlerts: true,
  assignmentDue: true,
  marketing: false,
  dailyDigest: false,
};

export const VAPID_PUBLIC_KEY =
  "BAbQ_jX8FJMzVHJyGq4MmQGfARgTABtHF_sbqUCpDZKmL2qOqD6Aq3XK9lVfASVEJNSUQUK_j18vBEx6mJiA46o";

export const NOTIF_KEY = "lumni_notification_subscription";
export const NOTIF_SETTINGS_KEY = "lumni_notification_settings";
export const STREAK_ALERT_KEY = "lumni_last_streak_alert_notification";
export const WEEKLY_NOTIF_KEY = "lumni_last_weekly_notification";
export const ASSIGNMENT_ALERT_KEY = "lumni_assignment_alerts";
export const DAILY_DIGEST_KEY = "lumni_daily_digest";

export interface StudyReminder {
  id: string;
  title: string;
  body: string;
  url: string;
  scheduledAt: number;
  createdAt: number;
}
