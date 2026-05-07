"use client";

import { useCallback, useEffect, useState } from "react";

const NOTIFICATION_PERMISSION_KEY = "lumni_notification_permission";
const SCHEDULED_NOTIFICATIONS_KEY = "lumni_scheduled_notifications";

export type NotificationType =
	| "study_reminder"
	| "quiz_due"
	| "flashcard_review"
	| "streak_warning"
	| "achievement";

export interface ScheduledNotification {
	id: string;
	type: NotificationType;
	title: string;
	body: string;
	scheduledAt: number;
	actionUrl?: string;
}

export interface UsePushNotificationsReturn {
	permission: NotificationPermission | "default";
	isSupported: boolean;
	requestPermission: () => Promise<boolean>;
	scheduleNotification: (
		notification: Omit<ScheduledNotification, "id">,
	) => void;
	cancelNotification: (id: string) => void;
	cancelAllNotifications: () => void;
	getScheduledNotifications: () => ScheduledNotification[];
	scheduleStudyReminder: (minutesFromNow: number) => void;
	scheduleDailyReminder: (hour: number, minute: number) => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
	const [permission, setPermission] = useState<
		NotificationPermission | "default"
	>("default");
	const [isSupported, setIsSupported] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		setIsSupported("Notification" in window);

		const stored = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
		if (stored) {
			setPermission(stored as NotificationPermission);
		} else {
			setPermission(Notification.permission);
		}
	}, []);

	const getScheduledNotifications = useCallback((): ScheduledNotification[] => {
		try {
			const stored = localStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}, []);

	const cancelNotification = useCallback(
		(id: string) => {
			const notifications = getScheduledNotifications();
			const filtered = notifications.filter((n) => n.id !== id);
			localStorage.setItem(
				SCHEDULED_NOTIFICATIONS_KEY,
				JSON.stringify(filtered),
			);
		},
		[getScheduledNotifications],
	);

	const scheduleNotification = useCallback(
		(notification: Omit<ScheduledNotification, "id">) => {
			const notifications = getScheduledNotifications();
			const newNotification: ScheduledNotification = {
				...notification,
				id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			};

			notifications.push(newNotification);
			localStorage.setItem(
				SCHEDULED_NOTIFICATIONS_KEY,
				JSON.stringify(notifications),
			);

			const delay = notification.scheduledAt - Date.now();
			if (delay > 0) {
				setTimeout(() => {
					showNotification(newNotification);
					cancelNotification(newNotification.id);
				}, delay);
			}
		},
		[getScheduledNotifications, cancelNotification],
	);

	const requestPermission = useCallback(async (): Promise<boolean> => {
		if (!isSupported) return false;

		try {
			const result = await Notification.requestPermission();
			setPermission(result);
			localStorage.setItem(NOTIFICATION_PERMISSION_KEY, result);
			return result === "granted";
		} catch (error) {
			console.error("Failed to request notification permission:", error);
			return false;
		}
	}, [isSupported]);

	const cancelAllNotifications = useCallback(() => {
		localStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
	}, []);

	const scheduleStudyReminder = useCallback(
		(minutesFromNow: number) => {
			scheduleNotification({
				type: "study_reminder",
				title: "Time to Study! 📚",
				body: "Your daily practice session is waiting. Keep your streak going!",
				scheduledAt: Date.now() + minutesFromNow * 60 * 1000,
				actionUrl: "/quiz",
			});
		},
		[scheduleNotification],
	);

	const scheduleDailyReminder = useCallback(
		(hour: number, minute: number) => {
			const now = new Date();
			const scheduled = new Date();
			scheduled.setHours(hour, minute, 0, 0);

			if (scheduled <= now) {
				scheduled.setDate(scheduled.getDate() + 1);
			}

			scheduleNotification({
				type: "study_reminder",
				title: "Study Time! 🎯",
				body: "Ready for your daily practice?",
				scheduledAt: scheduled.getTime(),
				actionUrl: "/quiz",
			});
		},
		[scheduleNotification],
	);

	return {
		permission: permission === "default" ? "default" : permission,
		isSupported,
		requestPermission,
		scheduleNotification,
		cancelNotification,
		cancelAllNotifications,
		getScheduledNotifications,
		scheduleStudyReminder,
		scheduleDailyReminder,
	};
}

async function showNotification(
	notification: ScheduledNotification,
): Promise<void> {
	if (!("Notification" in window) || Notification.permission !== "granted") {
		return;
	}

	try {
		const registration = await navigator.serviceWorker?.ready;

		if (registration) {
			registration.showNotification(notification.title, {
				body: notification.body,
				icon: "/icon-192.png",
				badge: "/icon-96.png",
				data: {
					url: notification.actionUrl,
				},
			});
		} else {
			new Notification(notification.title, {
				body: notification.body,
				icon: "/icon-192.png",
			});
		}
	} catch (error) {
		console.error("Failed to show notification:", error);
	}
}

export function useOfflineStudyReminder() {
	const { scheduleDailyReminder, isSupported } = usePushNotifications();
	const [enabled, setEnabled] = useState(false);

	useEffect(() => {
		const stored = localStorage.getItem("lumni_offline_reminder");
		setEnabled(stored === "true");
	}, []);

	const toggle = useCallback((enabled: boolean) => {
		setEnabled(enabled);
		localStorage.setItem("lumni_offline_reminder", String(enabled));
	}, []);

	useEffect(() => {
		if (!enabled || !isSupported) return;

		const checkAndNotify = () => {
			const now = new Date();
			const hour = now.getHours();
			const minute = now.getMinutes();

			if (hour === 19 && minute === 0) {
				scheduleDailyReminder(19, 0);
			}
		};

		const interval = setInterval(checkAndNotify, 60000);
		return () => clearInterval(interval);
	}, [enabled, isSupported, scheduleDailyReminder]);

	return { enabled, toggle };
}
