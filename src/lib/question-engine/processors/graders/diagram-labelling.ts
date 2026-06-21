import type { QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
	const body = q.body as QuestionBody["diagram-labelling"];
	const userPlacements = a.value as Record<string, string>;
	const correctPlacements = body.correctPlacements;

	if (!userPlacements || Object.keys(userPlacements).length === 0) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No labels placed. Drag labels onto the correct regions.",
		};
	}

	let correctCount = 0;
	for (const placement of correctPlacements) {
		if (userPlacements[placement.labelId] === placement.regionId) {
			correctCount++;
		}
	}

	const isExact = correctCount === correctPlacements.length;
	const score = Math.round(
		(correctCount / correctPlacements.length) * q.points,
	);

	return {
		correct: isExact,
		score,
		maxScore: q.points,
		feedback: isExact
			? "All labels placed correctly!"
			: `${correctCount}/${correctPlacements.length} labels placed correctly.`,
	};
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["diagram-labelling"];
	return `Look at each region's position on the diagram. Match labels based on what each region represents. There are ${body.labels.length} labels to place.`;
};
