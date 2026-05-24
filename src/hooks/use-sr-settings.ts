"use client";

import { useCallback, useEffect, useState } from "react";
import type { SRSettings } from "@/lib/spaced-repetition";
import {
	DEFAULT_SR_SETTINGS,
	loadSRSettings,
	resetDailyBudget,
	resetSRSettings,
	saveSRSettings,
} from "@/lib/spaced-repetition";

export interface UseSRSettingsReturn {
	settings: SRSettings;
	updateSettings: (updates: Partial<SRSettings>) => void;
	resetSettings: () => void;
	resetDailyBudget: () => void;
}

export function useSRSettings(): UseSRSettingsReturn {
	const [settings, setSettings] = useState<SRSettings>(DEFAULT_SR_SETTINGS);

	useEffect(() => {
		setSettings(loadSRSettings());
	}, []);

	const updateSettings = useCallback((updates: Partial<SRSettings>) => {
		setSettings((prev) => {
			const next = { ...prev, ...updates };
			saveSRSettings(next);
			return next;
		});
	}, []);

	const resetSettings = useCallback(() => {
		const defaults = resetSRSettings();
		setSettings(defaults);
	}, []);

	return {
		settings,
		updateSettings,
		resetSettings,
		resetDailyBudget,
	};
}
