import type { NotificationSettings } from "@/lib/services/notification-service";
import { logError } from "@/lib/shared/logger";

export type { NotificationSettings };

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    logError("LoadFromStorage", e);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    logError("SaveToStorage", e);
  }
}

export type StudyPreferences = {
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  showExplanations: boolean;
};

export const DEFAULT_PREFERENCES: StudyPreferences = {
  difficulty: "medium",
  questionCount: 10,
  showExplanations: true,
};

export const STUDY_PREFS_KEY = "study-preferences";
export const NOTIFICATION_SETTINGS_KEY = "lumni_notification_settings";

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
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
