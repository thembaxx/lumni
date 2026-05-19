import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

const NOTIF_KEY = "lumni_notification_subscription";
const VAPID_PUBLIC_KEY =
	"BAbQ_jX8FJMzVHJyGq4MmQGfARgTABtHF_sbqUCpDZKmL2qOqD6Aq3XK9lVfASVEJNSUQUK_j18vBEx6mJiA46o";

export interface NotificationSettings {
	enabled: boolean;
	studyReminders: boolean;
	streakAlerts: boolean;
	quizReminders: boolean;
	reminderHour: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
	enabled: false,
	studyReminders: true,
	streakAlerts: true,
	quizReminders: false,
	reminderHour: 18,
};

export function getSettings(): NotificationSettings {
	return {
		...DEFAULT_SETTINGS,
		...loadFromStorage<Partial<NotificationSettings>>(
			"lumni_notification_settings",
			{},
		),
	};
}

export function saveSettings(settings: NotificationSettings): void {
	saveToStorage("lumni_notification_settings", settings);
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
			// biome-ignore lint/suspicious/noExplicitAny: TS BufferSource type mismatch with Uint8Array
			applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
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
				});
			} catch {}
		}
		localStorage.removeItem(NOTIF_KEY);
		return true;
	} catch {
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
			// biome-ignore lint/suspicious/noExplicitAny: TS DOM types lack badge/data/actions for showNotification, valid per Web API
		} as any);
	});
}

export function scheduleStudyReminder(settings = getSettings()): void {
	if (!settings.enabled || !settings.studyReminders) return;

	if (typeof window !== "undefined" && "indexedDB" in window) {
		const reminder = buildReminder(settings);
		if (reminder) {
			saveToStorage("lumni_next_reminder", reminder);
			scheduleTimeout(reminder, settings);
		}
	}
}

export function schedulePlanAwareReminder(settings = getSettings()): void {
	if (!settings.enabled || !settings.studyReminders) return;

	if (typeof window !== "undefined" && "indexedDB" in window) {
		const sessions = getTodayPlanSessions();
		const reminder = buildReminder(settings, sessions);
		if (reminder) {
			const existing = getNextReminder();
			if (existing && existing.scheduledAt > Date.now()) {
				// Don't override an already-scheduled reminder
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

function buildReminder(
	settings: NotificationSettings,
	sessions?: { subject: string; topic?: string }[],
): StudyReminder | null {
	const now = new Date();
	const target = new Date(now);
	target.setHours(settings.reminderHour, 0, 0, 0);

	if (target <= now) {
		target.setDate(target.getDate() + 1);
	}

	const msUntilReminder = target.getTime() - now.getTime();

	if (sessions && sessions.length > 0) {
		const names = sessions.map((s) => s.topic || s.subject).join(", ");
		return {
			id: crypto.randomUUID(),
			title: "Study Time!",
			body: `You have sessions today: ${names}`,
			url: "/dashboard",
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

export interface StudyReminder {
	id: string;
	title: string;
	body: string;
	url: string;
	scheduledAt: number;
	createdAt: number;
}
