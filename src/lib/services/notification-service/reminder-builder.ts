import { flashcardEngine } from "@/lib/flashcard-engine";
import { logError } from "@/lib/shared/logger";
import { getDeps } from "./deps";
import type { NotificationSettings, StudyReminder } from "./types";

export function getGamificationData(): {
  currentStreak: number;
  lastPracticeDate: string | null;
  achievements: { id: string; earnedAt: string }[];
} | null {
  try {
    const raw = localStorage.getItem("lumni_gamification");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    logError("GetGamificationData", err);
    return null;
  }
}

export async function getTodayPlanSessions(): Promise<{ subject: string; topic?: string }[]> {
  try {
    const record = await getDeps().db.studyPlans.get("default");
    if (!record) return [];
    const plan = JSON.parse(record.plan) as {
      sessions: { scheduledAt: number; subject: string; topic?: string }[];
    };
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    return (plan.sessions || []).filter(
      (s) => s.scheduledAt >= startOfDay && s.scheduledAt < endOfDay,
    );
  } catch (err) {
    logError("GetTodayPlanSessions", err);
    return [];
  }
}

async function getDueCardCount(): Promise<number> {
  try {
    const cards = await flashcardEngine.getDueCards();
    return cards.length;
  } catch (err) {
    logError("GetDueCardCount", err);
    return 0;
  }
}

export async function buildReminder(
  settings: NotificationSettings,
  sessions?: { subject: string; topic?: string }[],
): Promise<StudyReminder | null> {
  const now = new Date();
  const target = new Date(now);
  target.setHours(settings.reminderHour, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const msUntilReminder = target.getTime() - now.getTime();
  const dueCount = await getDueCardCount();
  const dueSuffix = dueCount > 0 ? ` · ${dueCount} flashcards due` : "";

  if (sessions && sessions.length > 0) {
    const names = sessions.map((s) => s.topic || s.subject).join(", ");
    return {
      id: crypto.randomUUID(),
      title: "Study Time!",
      body: `You have sessions today: ${names}${dueSuffix}`,
      url: "/dashboard",
      scheduledAt: Date.now() + msUntilReminder,
      createdAt: Date.now(),
    };
  }

  if (dueCount > 0) {
    return {
      id: crypto.randomUUID(),
      title: `${dueCount} flashcards due!`,
      body: "You have flashcards waiting for review. Keep your streak going!",
      url: "/flashcards",
      scheduledAt: Date.now() + msUntilReminder,
      createdAt: Date.now(),
    };
  }

  return {
    id: crypto.randomUUID(),
    title: "Study Time!",
    body: "Time for your daily study session. Stay consistent!",
    url: "/dashboard",
    scheduledAt: Date.now() + msUntilReminder,
    createdAt: Date.now(),
  };
}
