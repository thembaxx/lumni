import { offlineDB } from "@/lib/db/schema";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

const NOTIF_KEY = "lumni_notification_subscription";
export const NOTIF_SETTINGS_KEY = "lumni_notification_settings";
const VAPID_PUBLIC_KEY =
	"BAbQ_jX8FJMzVHJyGq4MmQGfARgTABtHF_sbqUCpDZKmL2qOqD6Aq3XK9lVfASVEJNSUQUK_j18vBEx6mJiA46o";

export interface NotificationSettings {
	enabled: boolean;
	studyReminders: boolean;
	streakAlerts: boolean;
	quizReminders: boolean;
	achievementNotifications: boolean;
	weeklyProgress: boolean;
	reminderHour: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
	enabled: false,
	studyReminders: true,
	streakAlerts: true,
	quizReminders: false,
	achievementNotifications: true,
	weeklyProgress: false,
	reminderHour: 18,
};

export function getSettings(): NotificationSettings {
	return {
		...DEFAULT_SETTINGS,
		...loadFromStorage<Partial<NotificationSettings>>(NOTIF_SETTINGS_KEY, {}),
	};
}

export function saveSettings(settings: NotificationSettings): void {
	saveToStorage(NOTIF_SETTINGS_KEY, settings);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const rawData = atob(base64);
	return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
		console.warn("Push not supported");
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const existing = await registration.pushManager.getSubscription();
		if (existing) {
			saveToStorage(NOTIF_KEY, JSON.stringify(existing));
			syncSubscriptionToServer(existing);
			return existing;
		}

		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(
				VAPID_PUBLIC_KEY,
			) as BufferSource,
		});

		saveToStorage(NOTIF_KEY, JSON.stringify(subscription));
		syncSubscriptionToServer(subscription);
		return subscription;
	} catch (error) {
		console.error("Failed to subscribe to push:", error);
		return null;
	}
}

async function syncSubscriptionToServer(
	subscription: PushSubscription,
): Promise<void> {
	try {
		await fetch("/api/push/subscribe", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				subscription: subscription.toJSON(),
				userId: loadFromStorage<string>("lumni_user_id", ""),
			}),
		});
	} catch (err) {
		console.warn("Failed to sync subscription to server:", err);
	}
}

export async function unsubscribeFromPush(): Promise<boolean> {
	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		if (subscription) {
			const json = subscription.toJSON();
			await subscription.unsubscribe();
			try {
				await fetch("/api/push/subscribe", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ endpoint: json.endpoint }),
				} as NotificationOptions);
			} catch (e) {
				console.warn("Failed to sync unsubscribe to server:", e);
			}
		}
		localStorage.removeItem(NOTIF_KEY);
		return true;
	} catch (e) {
		console.warn("Failed to unsubscribe from push:", e);
		return false;
	}
}

export async function requestPermission(): Promise<boolean> {
	if (!("Notification" in window)) return false;

	const result = await Notification.requestPermission();
	return result === "granted";
}

export function sendLocalNotification(
	title: string,
	body: string,
	url = "/dashboard",
): void {
	if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
	if (Notification.permission !== "granted") return;

	navigator.serviceWorker.ready.then((registration) => {
		registration.showNotification(title, {
			body,
			icon: "/web-app-manifest-192x192.png",
			badge: "/web-app-manifest-192x192.png",
			data: { url, timestamp: Date.now() },
			actions: [
				{ action: "study", title: "Open" },
				{ action: "snooze", title: "Later" },
			],
		} as unknown as NotificationOptions);
	});
}

export async function scheduleStudyReminder(
	settings = getSettings(),
): Promise<void> {
	if (!settings.enabled || !settings.studyReminders) return;

	if (typeof window !== "undefined" && "indexedDB" in window) {
		const reminder = await buildReminder(settings);
		if (reminder) {
			saveToStorage("lumni_next_reminder", reminder);
			scheduleTimeout(reminder, settings);
		}
	}
}

export async function schedulePlanAwareReminder(
	settings = getSettings(),
): Promise<void> {
	if (!settings.enabled || !settings.studyReminders) return;

	if (typeof window !== "undefined" && "indexedDB" in window) {
		const sessions = getTodayPlanSessions();
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

function getTodayPlanSessions(): { subject: string; topic?: string }[] {
	try {
		const raw = localStorage.getItem("lumni_study_plan");
		if (!raw) return [];
		const plan = JSON.parse(raw);
		const today = new Date();
		const startOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		).getTime();
		const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
		return (plan.sessions || []).filter(
			(s: { scheduledAt: number }) =>
				s.scheduledAt >= startOfDay && s.scheduledAt < endOfDay,
		);
	} catch {
		return [];
	}
}

async function getDueCardCount(): Promise<number> {
	try {
		const cards = await flashcardEngine.getDueCards();
		return cards.length;
	} catch {
		return 0;
	}
}

async function buildReminder(
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

function scheduleTimeout(
	reminder: StudyReminder,
	settings: NotificationSettings,
): void {
	const delay = reminder.scheduledAt - Date.now();
	if (delay <= 0) return;

	setTimeout(() => {
		sendLocalNotification(reminder.title, reminder.body, reminder.url);
		localStorage.removeItem("lumni_next_reminder");
		scheduleStudyReminder(settings);
	}, delay);
}

export function getNextReminder(): StudyReminder | null {
	return loadFromStorage<StudyReminder | null>("lumni_next_reminder", null);
}

export function cancelScheduledReminder(): void {
	localStorage.removeItem("lumni_next_reminder");
}

function getGamificationData(): {
	currentStreak: number;
	lastPracticeDate: string | null;
	achievements: { id: string; earnedAt: string }[];
} | null {
	try {
		const raw = localStorage.getItem("lumni_gamification");
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

const STREAK_ALERT_KEY = "lumni_last_streak_alert_notification";

export function scheduleStreakAlert(settings = getSettings()): void {
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

const ACHIEVEMENT_CHECK_KEY = "lumni_last_checked_achievement_count";

export function checkForNewAchievements(): void {
	const settings = getSettings();
	if (!settings.enabled || !settings.achievementNotifications) return;

	const gamification = getGamificationData();
	if (!gamification) return;

	const currentCount = gamification.achievements.length;
	const lastCount = loadFromStorage<number>(ACHIEVEMENT_CHECK_KEY, 0);

	if (currentCount > lastCount && lastCount > 0) {
		const newlyEarned = gamification.achievements.slice(lastCount);
		for (const _achievement of newlyEarned) {
			sendLocalNotification(
				"Achievement Unlocked!",
				`You unlocked an achievement!`,
			);
		}
	}

	saveToStorage(ACHIEVEMENT_CHECK_KEY, currentCount);
}

const WEEKLY_NOTIF_KEY = "lumni_last_weekly_notification";

export async function scheduleWeeklyProgress(
	settings = getSettings(),
): Promise<void> {
	if (!settings.enabled || !settings.weeklyProgress) return;

	const lastNotif = loadFromStorage<number>(WEEKLY_NOTIF_KEY, 0);
	const now = Date.now();
	if (now - lastNotif < 7 * 24 * 60 * 60 * 1000) return;

	try {
		const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
		const attempts = await offlineDB.quizAttempts
			.filter((a) => a.completedAt >= sevenDaysAgo)
			.toArray();

		const totalAttempts = attempts.length;
		let totalScore = 0;
		for (const a of attempts) {
			totalScore += a.score;
		}
		const avgScore =
			totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;

		const gamification = getGamificationData();
		const streak = gamification?.currentStreak ?? 0;

		sendLocalNotification(
			"Weekly Progress",
			`${totalAttempts} quiz attempts this week, ${avgScore}% avg accuracy. Streak: ${streak} days`,
		);

		saveToStorage(WEEKLY_NOTIF_KEY, now);
	} catch {
		// Silently fail — Dexie may not be ready
	}
}

export function initializeNotificationSchedulers(): void {
	const settings = getSettings();
	if (!settings.enabled) return;

	scheduleStudyReminder(settings);
	scheduleStreakAlert(settings);
	checkForNewAchievements();

	if (typeof window !== "undefined" && "indexedDB" in window) {
		scheduleWeeklyProgress(settings);
	}
}

export async function scheduleExamAlerts(
	slots: { subject: string; date: string; startTime: string }[],
): Promise<void> {
	if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
	if (Notification.permission !== "granted") return;

	for (const slot of slots) {
		const examDate = new Date(`${slot.date}T${slot.startTime}:00`);
		const now = Date.now();
		const alertTime = examDate.getTime() - 24 * 60 * 60 * 1000;

		if (alertTime <= now) continue;

		const delay = alertTime - now;
		const existing = loadFromStorage<
			{ examSubject: string; scheduledAt: number }[]
		>("lumni_exam_alerts", []);
		if (
			existing.some(
				(e) => e.examSubject === slot.subject && e.scheduledAt === alertTime,
			)
		) {
			continue;
		}

		setTimeout(() => {
			sendLocalNotification(
				`${slot.subject} exam tomorrow!`,
				`Your ${slot.subject} exam starts at ${slot.startTime}. Good luck!`,
				"/dashboard",
			);
		}, delay);

		existing.push({ examSubject: slot.subject, scheduledAt: alertTime });
		saveToStorage("lumni_exam_alerts", existing);
	}
}

export interface StudyReminder {
	id: string;
	title: string;
	body: string;
	url: string;
	scheduledAt: number;
	createdAt: number;
}
