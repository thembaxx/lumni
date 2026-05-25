export interface EaseHellConfig {
	consecutivePasses: number;
	boost: number;
}

export function checkEaseHellRecovery(
	currentEaseFactor: number,
	consecutivePasses: number,
	config: EaseHellConfig,
): { shouldBoost: boolean; newEaseFactor: number } {
	const shouldBoost =
		consecutivePasses >= config.consecutivePasses && currentEaseFactor < 2.5;
	if (!shouldBoost) {
		return { shouldBoost: false, newEaseFactor: currentEaseFactor };
	}
	const newEaseFactor = Math.min(currentEaseFactor + config.boost, 2.5);
	return { shouldBoost: true, newEaseFactor };
}
