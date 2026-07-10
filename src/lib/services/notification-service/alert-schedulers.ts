import { logError } from "@/lib/shared/logger";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { dexieDataAccess } from "@/lib/db";
import { ReEngagementService } from "@/lib/services/re-engagement-service";
import { getDeps } from "./deps";
import { sendLocalNotification } from "./push";
import { getSettings } from "./settings";
import { getGamificationData } from "./reminder-builder";
import { clearAllTimers, scheduleStudyReminder } from "./study-scheduler";

const reEngagementService = new ReEngagementService({ db: dexieDataAccess });

const activeTimers = new Set<ReturnType<typeof setTimeout>>();

function clearActiveTimers(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();
}
import {
  ASSIGNMENT_ALERT_KEY,
  DAILY_DIGEST_KEY,
  STREAK_ALERT_KEY,
  WEEKLY_NOTIF_KEY,
} from "./types";
import type { NotificationSettings } from "./types";

function scheduleStreakAlert(settings = getSettings()): void {
  if (!settings.enabled || !settings.streakAlerts) return;

  const lastAlertDay = loadFromStorage<string>(STREAK_ALERT_KEY, "");
  const today = new Date().toDateString();
  if (lastAlertDay === today) return;

  const gamification = getGamificationData();
  if (!gamification) return;

  if (gamification.lastPracticeDate === today) return;

  if (gamification.currentStreak > 0) {
    sendLocalNotification(
      "Streak at Risk!",
      "Your streak is at risk! Practice now to keep it alive.",
    );
    saveToStorage(STREAK_ALERT_KEY, today);
  }
}

async function scheduleWeeklyProgress(settings = getSettings()): Promise<void> {
  if (!settings.enabled || !settings.weeklyProgress) return;

  const lastNotif = loadFromStorage<number>(WEEKLY_NOTIF_KEY, 0);
  const now = Date.now();
  if (now - lastNotif < 7 * 24 * 60 * 60 * 1000) return;

  try {
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const attempts = await getDeps()
      .db.quizAttempts.where("completedAt")
      .above(sevenDaysAgo)
      .toArray();

    const totalAttempts = attempts.length;
    let totalScore = 0;
    const subjectStats = new Map<string, { count: number; totalScore: number }>();
    for (const a of attempts) {
      totalScore += a.score;
      const sub = a.odSubject;
      if (sub) {
        const prev = subjectStats.get(sub) ?? { count: 0, totalScore: 0 };
        prev.count += 1;
        prev.totalScore += a.score;
        subjectStats.set(sub, prev);
      }
    }
    const avgScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

    const gamification = getGamificationData();
    const streak = gamification?.currentStreak ?? 0;

    const subjectLines = [...subjectStats.entries()]
      .slice(0, 3)
      .map(([sub, st]) => {
        const subAvg = Math.round(st.totalScore / st.count);
        return `${sub}: ${st.count} quiz, ${subAvg}%`;
      })
      .join(" · ");

    const body = `${totalAttempts} quizzes, ${avgScore}% avg. ${subjectLines ? `${subjectLines}. ` : ""}Streak: ${streak}d`;

    sendLocalNotification("Weekly Progress", body);

    saveToStorage(WEEKLY_NOTIF_KEY, now);
  } catch (err) {
    logError("ScheduleWeeklyProgress", err);
  }
}

async function scheduleDailyDigest(settings = getSettings()): Promise<void> {
  if (!settings.enabled || !settings.dailyDigest) return;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const lastDigest = loadFromStorage<number>(DAILY_DIGEST_KEY, 0);
  const now = Date.now();
  if (now - lastDigest < 24 * 60 * 60 * 1000) return;

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const todayAttempts = await getDeps()
      .db.quizAttempts.where("completedAt")
      .above(todayMs)
      .toArray();

    const totalScore = todayAttempts.reduce((s, a) => s + a.score, 0);
    const avgScore = todayAttempts.length > 0 ? Math.round(totalScore / todayAttempts.length) : 0;

    const body =
      todayAttempts.length > 0
        ? `You completed ${todayAttempts.length} quiz${todayAttempts.length === 1 ? "" : "zes"} today with ${avgScore}% average.`
        : "You haven't studied yet today. Time for a quick quiz!";

    sendLocalNotification("Daily Study Report", body, "/dashboard");
    saveToStorage(DAILY_DIGEST_KEY, now);
  } catch (err) {
    logError("ScheduleDailyDigest", err);
  }
}

async function scheduleAssignmentReminders(settings = getSettings()): Promise<void> {
  if (!settings.enabled || !settings.assignmentDue) return;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const res = await fetch("/api/student/assignments");
    if (!res.ok) return;
    const data = (await res.json()) as {
      assignments: {
        id: string;
        topics: string[];
        dueDate?: string;
      }[];
    };

    const now = Date.now();
    const existing = loadFromStorage<{ id: string; scheduledAt: number }[]>(
      ASSIGNMENT_ALERT_KEY,
      [],
    );

    for (const a of data.assignments) {
      if (!a.dueDate) continue;
      if (a.dueDate && new Date(a.dueDate).getTime() <= now) continue;

      const alertTime = new Date(a.dueDate).getTime() - 24 * 60 * 60 * 1000;
      if (alertTime <= now) continue;

      if (existing.some((e) => e.id === a.id && e.scheduledAt === alertTime)) {
        continue;
      }

      const delay = alertTime - now;
      const timer = setTimeout(() => {
        sendLocalNotification(
          "Assignment Due Tomorrow!",
          `Your assignment on ${a.topics.join(", ")} is due tomorrow. Complete it now!`,
          "/dashboard",
        );
        activeTimers.delete(timer);
      }, delay);
      activeTimers.add(timer);

      existing.push({ id: a.id, scheduledAt: alertTime });
      saveToStorage(ASSIGNMENT_ALERT_KEY, existing);
    }
  } catch (err) {
    logError("ScheduleAssignmentReminders", err);
  }
}

async function scheduleExamAlertsFromSession(settings: NotificationSettings): Promise<void> {
  try {
    const { getCurrentSession } = await import("@/lib/exam-dates/types");
    const { getExamDates } = await import("@/lib/exam-dates/service");
    const { session, year } = getCurrentSession();
    const slots = await getExamDates(session, year);
    if (slots.length === 0) return;
    await scheduleExamAlerts(slots, settings);
  } catch (err) {
    logError("ScheduleExamAlertsFromSession", err);
  }
}

export async function scheduleExamAlerts(
  slots: { subject: string; date: string; startTime: string }[],
  settings?: NotificationSettings,
): Promise<void> {
  const prefs = settings ?? getSettings();
  if (!prefs.enabled || !prefs.examAlerts) return;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  for (const slot of slots) {
    const examDate = new Date(`${slot.date}T${slot.startTime}:00`);
    const now = Date.now();
    const alertTime = examDate.getTime() - 24 * 60 * 60 * 1000;

    if (alertTime <= now) continue;

    const delay = alertTime - now;
    const existing = loadFromStorage<{ examSubject: string; scheduledAt: number }[]>(
      "lumni_exam_alerts",
      [],
    );
    if (existing.some((e) => e.examSubject === slot.subject && e.scheduledAt === alertTime)) {
      continue;
    }

    const timer = setTimeout(() => {
      sendLocalNotification(
        `${slot.subject} exam tomorrow!`,
        `Your ${slot.subject} exam starts at ${slot.startTime}. Good luck!`,
        "/dashboard",
      );
      activeTimers.delete(timer);
    }, delay);
    activeTimers.add(timer);

    existing.push({ examSubject: slot.subject, scheduledAt: alertTime });
    saveToStorage("lumni_exam_alerts", existing);
  }
}

async function scheduleReEngagement(settings: NotificationSettings): Promise<void> {
  if (!settings.enabled || !settings.streakAlerts) return;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (typeof window === "undefined" || !("indexedDB" in window)) return;

  try {
    const events = await dexieDataAccess.analyticsEvents
      .orderBy("timestamp")
      .reverse()
      .limit(1)
      .toArray();
    const userId = events.length > 0 ? events[0].userId : null;
    if (!userId) return;

    const result = await reEngagementService.checkAndNotify(userId);
    if (result.notified) {
      sendLocalNotification(
        "Keep Learning!",
        result.message ?? "",
        result.deepLink ?? "/dashboard",
      );
    }
  } catch (err) {
    logError("ScheduleReEngagement", err);
  }
}

export function initializeNotificationSchedulers(): void {
  clearActiveTimers();
  clearAllTimers();
  const settings = getSettings();
  if (!settings.enabled) return;

  scheduleStudyReminder(settings);
  scheduleStreakAlert(settings);
  scheduleReEngagement(settings);

  if (typeof window !== "undefined" && "indexedDB" in window) {
    scheduleWeeklyProgress(settings);
    scheduleDailyDigest(settings);
    scheduleAssignmentReminders(settings);
    scheduleExamAlertsFromSession(settings);
  }
}
