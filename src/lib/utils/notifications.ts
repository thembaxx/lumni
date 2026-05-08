"use client";

import { useCallback, useEffect, useState } from "react";

const NOTIFICATION_PERMISSION_KEY = "lumni_notification_permission";
const SCHEDULED_NOTIFICATIONS_KEY = "lumni_scheduled_notifications";

export type NotificationType =
	| "study_reminder"
	| "quiz_due"
	| "flashcard_review"
	| "streak_warning"
	| "achievement"
	| "exam_reminder"
	| "weekly_summary"
	| "streak_celebration"
	| "weak_topic_alert";

export interface NotificationTemplate {
	type: NotificationType;
	title: string;
	body: string;
	icon: string;
	actionUrl: string;
}

export const NOTIFICATION_TEMPLATES: Record<
	NotificationType,
	() => NotificationTemplate
> = {
	study_reminder: () => ({
		type: "study_reminder",
		title: "Time to Study! 📚",
		body: "Your daily practice session is waiting. Keep your streak going!",
		icon: "📚",
		actionUrl: "/quiz",
	}),
	quiz_due: () => ({
		type: "quiz_due",
		title: "Quiz Ready! 🎯",
		body: "Your generated quiz is ready. Test your knowledge!",
		icon: "🎯",
		actionUrl: "/quiz",
	}),
	flashcard_review: () => ({
		type: "flashcard_review",
		title: "Review Time! 🃏",
		body: "You have flashcards due for review. Don't lose your progress!",
		icon: "🃏",
		actionUrl: "/flashcards",
	}),
	streak_warning: () => ({
		type: "streak_warning",
		title: "Streak at Risk! 🔥",
		body: "Your streak will reset if you don't practice today!",
		icon: "🔥",
		actionUrl: "/quiz",
	}),
	achievement: () => ({
		type: "achievement",
		title: "Achievement Unlocked! 🏆",
		body: "Congratulations! You've earned a new achievement!",
		icon: "🏆",
		actionUrl: "/dashboard",
	}),
	exam_reminder: () => ({
		type: "exam_reminder",
		title: "Exam Prep 📅",
		body: "Your exam is approaching. Time to review past papers!",
		icon: "📅",
		actionUrl: "/dashboard?tab=practice",
	}),
	weekly_summary: () => ({
		type: "weekly_summary",
		title: "Weekly Progress 📊",
		body: "Great week! You answered X questions with Y% accuracy.",
		icon: "📊",
		actionUrl: "/dashboard?tab=stats",
	}),
	streak_celebration: () => ({
		type: "streak_celebration",
		title: "Streak Milestone! 🎉",
		body: "Amazing! You've reached a new streak milestone!",
		icon: "🎉",
		actionUrl: "/dashboard",
	}),
	weak_topic_alert: () => ({
		type: "weak_topic_alert",
		title: "Focus Area 📌",
		body: "Time to practice your weak topics and improve!",
		icon: "📌",
		actionUrl: "/quiz",
	}),
};

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

export interface StudyPattern {
	preferredTimes: number[];
	averageSessionLength: number;
	studyDays: number[];
	streakDays: number;
}

const STUDY_PATTERN_KEY = "lumni_study_pattern";

export function getStudyPattern(): StudyPattern {
	if (typeof window === "undefined") {
		return {
			preferredTimes: [18, 19, 20],
			averageSessionLength: 20,
			studyDays: [1, 2, 3, 4, 5, 6, 0],
			streakDays: 0,
		};
	}
	const stored = localStorage.getItem(STUDY_PATTERN_KEY);
	return stored
		? JSON.parse(stored)
		: {
				preferredTimes: [18, 19, 20],
				averageSessionLength: 20,
				studyDays: [1, 2, 3, 4, 5, 6, 0],
				streakDays: 0,
			};
}

export function updateStudyPattern(updates: Partial<StudyPattern>): void {
	if (typeof window === "undefined") return;
	const current = getStudyPattern();
	const updated = { ...current, ...updates };
	localStorage.setItem(STUDY_PATTERN_KEY, JSON.stringify(updated));
}

export function getSmartReminderTime(): { hour: number; minute: number } {
	const pattern = getStudyPattern();
	const preferred = pattern.preferredTimes;

	if (preferred.length > 0) {
		const avgTime = preferred.reduce((a, b) => a + b, 0) / preferred.length;
		return { hour: Math.round(avgTime), minute: 0 };
	}

	return { hour: 19, minute: 0 };
}

export function scheduleSmartReminder(
	scheduleNotification: (n: Omit<ScheduledNotification, "id">) => void,
): void {
	const { hour, minute } = getSmartReminderTime();
	const now = new Date();
	const scheduled = new Date();
	scheduled.setHours(hour, minute, 0, 0);

	if (scheduled <= now) {
		scheduled.setDate(scheduled.getDate() + 1);
	}

	scheduleNotification({
		type: "study_reminder",
		title: "Study Time! 🎯",
		body: "Your personalized reminder - time to practice!",
		scheduledAt: scheduled.getTime(),
		actionUrl: "/quiz",
	});
}

export function checkStreakAndNotify(
	scheduleNotification: (n: Omit<ScheduledNotification, "id">) => void,
	currentStreak: number,
): void {
	if (currentStreak === 0) {
		scheduleNotification({
			type: "streak_warning",
			title: "Streak at Risk! 🔥",
			body: "Practice now to keep your streak going!",
			scheduledAt: Date.now() + 12 * 60 * 60 * 1000,
			actionUrl: "/quiz",
		});
	} else if (currentStreak > 0 && currentStreak % 7 === 0) {
		scheduleNotification({
			type: "streak_celebration",
			title: `🎉 ${currentStreak} Day Streak!`,
			body: "Incredible dedication! Keep it up!",
			scheduledAt: Date.now(),
			actionUrl: "/dashboard",
		});
	}
}
