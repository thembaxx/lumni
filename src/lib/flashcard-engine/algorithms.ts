import type { CardStatus } from "./types";

export function computeNextReviewDate(interval: number): number {
	return Date.now() + interval * 24 * 60 * 60 * 1000;
}

export function calculateNextReview(
	quality: number,
	currentEaseFactor: number,
	currentInterval: number,
	currentRepetitions: number,
): {
	easeFactor: number;
	interval: number;
	repetitions: number;
	nextReview: number;
} {
	let easeFactor = currentEaseFactor;
	let interval = currentInterval;
	let repetitions = currentRepetitions;

	easeFactor =
		easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
	easeFactor = Math.max(1.3, easeFactor);

	if (quality < 3) {
		repetitions = 0;
		interval = 1;
	} else {
		repetitions += 1;

		if (repetitions === 1) {
			interval = 1;
		} else if (repetitions === 2) {
			interval = 6;
		} else {
			interval = Math.round(currentInterval * easeFactor);
		}
	}

	return {
		easeFactor: Math.round(easeFactor * 100) / 100,
		interval,
		repetitions,
		nextReview: computeNextReviewDate(interval),
	};
}

export interface FSRSConfig {
	desiredRetention: number;
	enableFuzz: boolean;
}

export interface FSRSResult {
	stability: number;
	difficulty: number;
	interval: number;
	nextReview: number;
}

export const DEFAULT_FSRS_CONFIG: FSRSConfig = {
	desiredRetention: 0.9,
	enableFuzz: true,
};

const W: number[] = [
	0.4197, 1.1869, 3.0412, 15.2441, 7.1434, 0.6477, 1.0007, 0.0675, 0.0025,
	1.0138, 0.1868, 0.3813, 1.4039, 0.9125, 0.0561, 0.2119, 2.0954, 0.6835,
	2.2315,
];

const GRADE_MAP: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4 };

function clamp(v: number, lo: number, hi: number): number {
	return Math.min(hi, Math.max(lo, v));
}

export function initFSRS(quality: number): {
	stability: number;
	difficulty: number;
} {
	const g = GRADE_MAP[quality] ?? 3;
	const difficulty = clamp(W[4] - W[5] * (g - 3), 1, 10);
	const stability = [W[15], W[16], W[17], W[18]][g - 1] ?? W[17];
	return { stability, difficulty };
}

export function calculateNextReviewFSRS(
	quality: number,
	currentStability: number,
	currentDifficulty: number,
	config: FSRSConfig = DEFAULT_FSRS_CONFIG,
): FSRSResult {
	const g = GRADE_MAP[quality] ?? 3;
	const D = currentDifficulty;
	const S = currentStability;

	const fD = (11 - D) / 9;
	const fS = S ** -W[12];
	const R = (1 + (config.desiredRetention / 0.9) ** (1 / W[4])) ** -1;

	let newStability: number;
	let newDifficulty: number;

	if (g < 3) {
		newStability =
			W[6] * D ** -W[10] * ((S + 1) ** W[11] - 1) * Math.exp((1 - R) * W[12]);
		newDifficulty = clamp(D + W[9] * (g - 3), 1, 10);
	} else {
		newStability = S * (1 + W[2] * fD * fS * Math.exp((R - 1) * W[3]));
		newDifficulty = clamp(D + W[7] * (g - 3), 1, 10);
	}

	newStability = Math.max(0.1, newStability);

	const intervalDays = Math.round(newStability);
	const nextReview = Date.now() + intervalDays * 24 * 60 * 60 * 1000;

	return {
		stability: Math.round(newStability * 100) / 100,
		difficulty: Math.round(newDifficulty * 100) / 100,
		interval: intervalDays,
		nextReview,
	};
}

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

export interface LeechConfig {
	threshold: number;
	action: "suspend" | "bury" | "tag-only";
}

export interface LeechResult {
	isLeech: boolean;
	newStatus: CardStatus | null;
	actionTaken: "suspend" | "bury" | "tag-only" | null;
}

export function checkLeech(
	lapses: number,
	alreadyLeeched: boolean,
	config: LeechConfig,
): LeechResult {
	if (alreadyLeeched) {
		return { isLeech: false, newStatus: null, actionTaken: null };
	}

	if (lapses < config.threshold) {
		return { isLeech: false, newStatus: null, actionTaken: null };
	}

	switch (config.action) {
		case "suspend":
			return { isLeech: true, newStatus: "suspended", actionTaken: "suspend" };
		case "bury":
			return { isLeech: true, newStatus: "buried", actionTaken: "bury" };
		case "tag-only":
			return { isLeech: true, newStatus: null, actionTaken: "tag-only" };
	}
}
