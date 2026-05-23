export function getAPSForSubject(percentage: number): number {
	if (percentage >= 80) return 7;
	if (percentage >= 70) return 6;
	if (percentage >= 60) return 5;
	if (percentage >= 50) return 4;
	if (percentage >= 40) return 3;
	if (percentage >= 30) return 2;
	return 1;
}

export function getGrade(percentage: number): string {
	if (percentage >= 80) return "A - Outstanding";
	if (percentage >= 70) return "B - Meritorious";
	if (percentage >= 60) return "C - Substantial";
	if (percentage >= 50) return "D - Adequate";
	if (percentage >= 40) return "E - Moderate";
	if (percentage >= 30) return "F - Elementary";
	return "G - Not Achieved";
}

export function calculateAPS(
	scores: { percentage: number; isLO?: boolean }[],
): number {
	const scored = scores
		.filter((s) => !s.isLO)
		.map((s) => getAPSForSubject(s.percentage))
		.sort((a, b) => b - a)
		.slice(0, 6);
	return scored.reduce((sum, s) => sum + s, 0);
}
