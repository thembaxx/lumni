import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { sendLocalNotification } from "./push";
import { getSettings } from "./settings";
import { buildReminder, getTodayPlanSessions } from "./reminder-builder";
import type { NotificationSettings, StudyReminder } from "./types";

let currentTimer: ReturnType<typeof setTimeout> | null = null;

function clearCurrentTimer(): void {
  if (currentTimer !== null) {
    clearTimeout(currentTimer);
    currentTimer = null;
  }
}

function scheduleTimeout(reminder: StudyReminder, settings: NotificationSettings): void {
  const delay = reminder.scheduledAt - Date.now();
  if (delay <= 0) return;

  clearCurrentTimer();
  currentTimer = setTimeout(() => {
    currentTimer = null;
    sendLocalNotification(reminder.title, reminder.body, reminder.url);
    localStorage.removeItem("lumni_next_reminder");
    scheduleStudyReminder(settings);
  }, delay);
}

function getNextReminder(): StudyReminder | null {
  return loadFromStorage<StudyReminder | null>("lumni_next_reminder", null);
}

export async function scheduleStudyReminder(settings = getSettings()): Promise<void> {
  if (!settings.enabled || !settings.studyReminders) return;

  if (typeof window !== "undefined" && "indexedDB" in window) {
    const reminder = await buildReminder(settings);
    if (reminder) {
      saveToStorage("lumni_next_reminder", reminder);
      scheduleTimeout(reminder, settings);
    }
  }
}

export async function schedulePlanAwareReminder(settings = getSettings()): Promise<void> {
  if (!settings.enabled || !settings.studyReminders) return;

  if (typeof window !== "undefined" && "indexedDB" in window) {
    const sessions = await getTodayPlanSessions();
    const reminder = await buildReminder(settings, sessions);
    if (reminder) {
      const existing = getNextReminder();
      if (existing && existing.scheduledAt > Date.now()) {
        return;
      }
      saveToStorage("lumni_next_reminder", reminder);
      scheduleTimeout(reminder, settings);
    }
  }
}

export function clearAllTimers(): void {
  clearCurrentTimer();
}
