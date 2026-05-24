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
