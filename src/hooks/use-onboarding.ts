"use client";

import { useCallback, useEffect, useState } from "react";
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
	notificationsEnabled: true,
};

export function loadOnboardingData(): OnboardingData {
	return loadFromStorage<OnboardingData>(ONBOARDING_KEY, DEFAULT_ONBOARDING);
}

export function saveOnboardingData(data: OnboardingData): void {
	saveToStorage(ONBOARDING_KEY, data);
}

export function useOnboarding(): UseOnboardingReturn {
	const [data, setData] = useState<OnboardingData>(DEFAULT_ONBOARDING);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		const stored = loadOnboardingData();
		setData(stored);
		setIsLoaded(true);
	}, []);

	const isOnboarding = isLoaded && !data.isComplete;

	const startOnboarding = useCallback(() => {
		setData((prev) => ({
			...prev,
			isComplete: false,
			startedAt: Date.now(),
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
	const [result, setResult] = useState({ shouldShow: false });

	useEffect(() => {
		if (typeof window === "undefined") return;

		const data = loadOnboardingData();
		if (!data.isComplete) {
			setResult({ shouldShow: true });
			return;
		}

		const hasProgress = localStorage.getItem("lumni_user_progress");
		if (!hasProgress) {
			setResult({ shouldShow: true, reason: "No progress yet" });
		}
	}, []);

	return result;
}
