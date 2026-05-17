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
			return existing;
		}

		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			// biome-ignore lint/suspicious/noExplicitAny: TS BufferSource type mismatch with Uint8Array
			applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
		});

		saveToStorage(NOTIF_KEY, JSON.stringify(subscription));
		return subscription;
	} catch (error) {
		console.error("Failed to subscribe to push:", error);
		return null;
	}
}

export async function unsubscribeFromPush(): Promise<boolean> {
	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		if (subscription) {
			await subscription.unsubscribe();
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
		// biome-ignore lint/suspicious/noExplicitAny: TS DOM types lack badge/data/actions for showNotification, valid per Web API
		registration.showNotification(title, {
			body,
			icon: "/web-app-manifest-192x192.png",
			badge: "/web-app-manifest-192x192.png",
			data: { url, timestamp: Date.now() },
			actions: [
				{ action: "study", title: "Open" },
				{ action: "snooze", title: "Later" },
			],
		} as any);
	});
}

export function scheduleStudyReminder(settings = getSettings()): void {
	if (!settings.enabled || !settings.studyReminders) return;

	const now = new Date();
	const target = new Date(now);
	target.setHours(settings.reminderHour, 0, 0, 0);

	if (target <= now) {
		target.setDate(target.getDate() + 1);
	}

	const msUntilReminder = target.getTime() - now.getTime();

	setTimeout(() => {
		sendLocalNotification(
			"📚 Study Time!",
			"Time for your daily study session. Stay consistent!",
			"/dashboard",
		);
		scheduleStudyReminder(settings);
	}, msUntilReminder);
}
