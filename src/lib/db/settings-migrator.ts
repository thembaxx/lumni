"use client";

import type { SettingsDataAccess } from "@/lib/db/data-access";
import type { UserSettings } from "@/lib/db/schema";
import type { BetaFeatures, NotificationSettings, StudyPreferences } from "@/lib/utils/storage";
import {
  BETA_FEATURES_KEY,
  DEFAULT_BETA,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PREFERENCES,
  NOTIFICATION_SETTINGS_KEY,
  STUDY_PREFS_KEY,
  loadFromStorage,
  saveToStorage,
} from "@/lib/utils/storage";

export interface HydratedSettings {
  studyPrefs: StudyPreferences;
  notifications: NotificationSettings;
  betaFeatures: BetaFeatures;
}

export function hydrateFromRecord(record: UserSettings | undefined): HydratedSettings {
  if (!record) {
    return {
      studyPrefs: DEFAULT_PREFERENCES,
      notifications: DEFAULT_NOTIFICATIONS,
      betaFeatures: DEFAULT_BETA,
    };
  }
  return {
    studyPrefs: JSON.parse(record.studyPrefs) as StudyPreferences,
    notifications: JSON.parse(record.notifications) as NotificationSettings,
    betaFeatures: JSON.parse(record.betaFeatures) as BetaFeatures,
  };
}

export function dehydrateToRecord(
  userId: string,
  settings: HydratedSettings,
): Omit<UserSettings, "id"> {
  return {
    userId,
    studyPrefs: JSON.stringify(settings.studyPrefs),
    notifications: JSON.stringify(settings.notifications),
    betaFeatures: JSON.stringify(settings.betaFeatures),
    updatedAt: Date.now(),
  };
}

export async function loadSettings(
  db: SettingsDataAccess,
  userId: string,
): Promise<HydratedSettings> {
  try {
    const record = await db.userSettings.get(userId);
    return hydrateFromRecord(record);
  } catch {
    const onboarding = loadFromStorage<{
      selectedSubjects?: string[];
      targetAps?: number;
      dailyStudyMinutes?: number;
      notificationsEnabled?: boolean;
    }>("lumni_onboarding", {});

    const stored = loadFromStorage(STUDY_PREFS_KEY, DEFAULT_PREFERENCES);
    if (onboarding.dailyStudyMinutes && !localStorage.getItem(STUDY_PREFS_KEY)) {
      stored.timerDuration = onboarding.dailyStudyMinutes * 60;
    }

    const notifPrefs = loadFromStorage(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATIONS);
    if (
      onboarding.notificationsEnabled !== undefined &&
      !localStorage.getItem(NOTIFICATION_SETTINGS_KEY)
    ) {
      notifPrefs.studyReminders = onboarding.notificationsEnabled;
      notifPrefs.streakAlerts = onboarding.notificationsEnabled;
    }

    const betaPrefs = loadFromStorage(BETA_FEATURES_KEY, DEFAULT_BETA);

    return {
      studyPrefs: stored,
      notifications: notifPrefs,
      betaFeatures: betaPrefs,
    };
  }
}

export async function saveSettings(
  db: SettingsDataAccess,
  userId: string,
  settings: HydratedSettings,
): Promise<void> {
  const record = dehydrateToRecord(userId, settings);
  await db.userSettings.put(record);

  saveToStorage(STUDY_PREFS_KEY, settings.studyPrefs);
  saveToStorage(NOTIFICATION_SETTINGS_KEY, settings.notifications);
  saveToStorage(BETA_FEATURES_KEY, settings.betaFeatures);
}

export async function clearSettings(db: SettingsDataAccess, userId: string): Promise<void> {
  await db.userSettings.delete(userId);
  localStorage.removeItem(STUDY_PREFS_KEY);
  localStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
  localStorage.removeItem(BETA_FEATURES_KEY);
}
