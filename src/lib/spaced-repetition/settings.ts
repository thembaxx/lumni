import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import type { SRSettings } from "./defaults";
import { DEFAULT_SR_SETTINGS, SR_SETTINGS_KEY } from "./defaults";

export function loadSRSettings(): SRSettings {
	return loadFromStorage(SR_SETTINGS_KEY, DEFAULT_SR_SETTINGS);
}

export function saveSRSettings(settings: SRSettings): void {
	saveToStorage(SR_SETTINGS_KEY, settings);
}

export function resetSRSettings(): SRSettings {
	saveSRSettings(DEFAULT_SR_SETTINGS);
	return { ...DEFAULT_SR_SETTINGS };
}
