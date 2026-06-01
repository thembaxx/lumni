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
