const MINUTE_MS = 60_000;

export function getDefaultSteps(): number[] {
	return [1, 10, 1440];
}

export function isInLearning(learningStep: number): boolean {
	return learningStep >= 0;
}

export function isGraduated(learningStep: number): boolean {
	return learningStep === -1;
}

export function advanceLearningStep(
	currentStep: number,
	steps: number[],
): { learningStep: number; delayMinutes: number } {
	const nextStep = currentStep + 1;
	if (nextStep >= steps.length) {
		return { learningStep: -1, delayMinutes: 0 };
	}
	return { learningStep: nextStep, delayMinutes: steps[nextStep] };
}

export function resetLearningStep(): number {
	return 0;
}

export function computeLearningReviewTime(delayMinutes: number): number {
	return Date.now() + delayMinutes * MINUTE_MS;
}

export function getLearningStepDelay(
	stepIndex: number,
	steps: number[],
): number {
	if (stepIndex < 0 || stepIndex >= steps.length) return 0;
	return steps[stepIndex];
}
