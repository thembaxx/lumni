export function loadFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === "undefined") return defaultValue;
	try {
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : defaultValue;
	} catch {
		return defaultValue;
	}
}

export function saveToStorage<T>(key: string, value: T): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error("Failed to save to localStorage:", e);
	}
}

export type StudyPreferences = {
	difficulty: "easy" | "medium" | "hard";
	questionCount: number;
	timerEnabled: boolean;
	timerDuration: number;
	showExplanations: boolean;
};

export type NotificationSettings = {
	studyReminders: boolean;
	streakAlerts: boolean;
	achievementNotifications: boolean;
	weeklyProgress: boolean;
};

export type BetaFeatures = {
	aiTutor: boolean;
	voicePractice: boolean;
	examPaperAnalysis: boolean;
};

export const DEFAULT_PREFERENCES: StudyPreferences = {
	difficulty: "medium",
	questionCount: 10,
	timerEnabled: true,
	timerDuration: 30,
	showExplanations: true,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
	studyReminders: true,
	streakAlerts: true,
	achievementNotifications: true,
	weeklyProgress: false,
};

export const DEFAULT_BETA: BetaFeatures = {
	aiTutor: false,
	voicePractice: false,
	examPaperAnalysis: false,
};

export const STUDY_PREFS_KEY = "study-preferences";
export const NOTIFICATION_SETTINGS_KEY = "notification-settings";
export const BETA_FEATURES_KEY = "beta-features";
