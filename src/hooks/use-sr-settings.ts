"use client";

import { useCallback, useEffect, useState } from "react";
import { flashcardEngine } from "@/lib/flashcard-engine";
import type { SRSettings } from "@/lib/flashcard-engine";
import { DEFAULT_SR_SETTINGS } from "@/lib/flashcard-engine";

export interface UseSRSettingsReturn {
	settings: SRSettings;
	updateSettings: (updates: Partial<SRSettings>) => void;
	resetSettings: () => void;
	resetDailyBudget: () => void;
}

export function useSRSettings(): UseSRSettingsReturn {
	const [settings, setSettings] = useState<SRSettings>(DEFAULT_SR_SETTINGS);

	useEffect(() => {
		setSettings(flashcardEngine.loadSettings());
	}, []);

	const updateSettings = useCallback((updates: Partial<SRSettings>) => {
		setSettings((prev) => {
			const next = { ...prev, ...updates };
			flashcardEngine.saveSettings(next);
			return next;
		});
	}, []);

	const resetSettings = useCallback(() => {
		const defaults = flashcardEngine.resetSettings();
		setSettings(defaults);
	}, []);

	const handleResetDailyBudget = useCallback(() => {
		flashcardEngine.resetDailyBudget();
	}, []);

	return {
		settings,
		updateSettings,
		resetSettings,
		resetDailyBudget: handleResetDailyBudget,
	};
}
