"use client";

import { useCallback, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

export interface OnboardingData {
	isComplete: boolean;
	startedAt?: number;
	completedAt?: number;
	selectedSubjects: string[];
	targetAps: number;
	dailyStudyMinutes: number;
	studyTimes: number[];
	notificationsEnabled: boolean;
	currentStep: number;
	notificationFrequency: "daily" | "every_other_day" | "weekly";
	notificationTimeOfDay: "morning" | "afternoon" | "evening" | undefined;
}

export interface UseOnboardingReturn {
	isOnboarding: boolean;
	data: OnboardingData;
	startOnboarding: () => void;
	completeOnboarding: (data: Partial<OnboardingData>) => void;
	skipOnboarding: () => void;
	updateProgress: (data: Partial<OnboardingData>) => void;
	resetOnboarding: () => void;
}

const ONBOARDING_KEY = "lumni_onboarding";

const DEFAULT_ONBOARDING: OnboardingData = {
	isComplete: false,
	selectedSubjects: [],
	targetAps: 30,
	dailyStudyMinutes: 30,
	studyTimes: [18, 19, 20],
	notificationsEnabled: false,
	currentStep: 0,
	notificationFrequency: "daily",
	notificationTimeOfDay: "morning",
};

export function loadOnboardingData(): OnboardingData {
	const stored = loadFromStorage<OnboardingData>(
		ONBOARDING_KEY,
		DEFAULT_ONBOARDING,
	);
	// Merge with defaults to ensure we have all fields (for backward compatibility)
	return { ...DEFAULT_ONBOARDING, ...stored };
}

export function saveOnboardingData(data: OnboardingData): void {
	saveToStorage(ONBOARDING_KEY, data);
}

export function resetOnboardingData(): void {
	saveToStorage(ONBOARDING_KEY, DEFAULT_ONBOARDING);
}

export function useOnboarding(): UseOnboardingReturn {
	const [data, setData] = useState<OnboardingData>(() => loadOnboardingData());
	const [isLoaded] = useState(true);

	const isOnboarding = isLoaded && !data.isComplete;

	const startOnboarding = useCallback(() => {
		setData((prev) => ({
			...prev,
			isComplete: false,
			startedAt: Date.now(),
			currentStep: 0, // Reset to step 0 when starting
			// Reset notification settings to default? Or keep existing? We'll reset to default for a fresh start.
			notificationFrequency: DEFAULT_ONBOARDING.notificationFrequency,
			notificationTimeOfDay: DEFAULT_ONBOARDING.notificationTimeOfDay,
		}));
	}, []);

	const completeOnboarding = useCallback(
		(newData: Partial<OnboardingData>) => {
			const updated = {
				...data,
				...newData,
				isComplete: true,
				completedAt: Date.now(),
			};
			setData(updated);
			saveOnboardingData(updated);
		},
		[data],
	);

	const skipOnboarding = useCallback(() => {
		const updated = {
			...data,
			isComplete: true,
			completedAt: Date.now(),
		};
		setData(updated);
		saveOnboardingData(updated);
	}, [data]);

	const updateProgress = useCallback(
		(newData: Partial<OnboardingData>) => {
			const updated = { ...data, ...newData };
			setData(updated);
			saveOnboardingData(updated);
		},
		[data],
	);

	const resetOnboarding = useCallback(() => {
		setData(DEFAULT_ONBOARDING);
		saveToStorage(ONBOARDING_KEY, DEFAULT_ONBOARDING);
	}, []);

	return {
		isOnboarding,
		data,
		startOnboarding,
		completeOnboarding,
		skipOnboarding,
		updateProgress,
		resetOnboarding,
	};
}

export function useOnboardingCheck(): { shouldShow: boolean; reason?: string } {
	const [result] = useState<{
		shouldShow: boolean;
		reason?: string;
	}>(() => {
		if (typeof window === "undefined") return { shouldShow: false };

		const data = loadOnboardingData();
		if (!data.isComplete) {
			return { shouldShow: true };
		}

		const hasProgress = localStorage.getItem("lumni_user_progress");
		if (!hasProgress) {
			return { shouldShow: true, reason: "No progress yet" };
		}

		return { shouldShow: false };
	});

	return result;
}
