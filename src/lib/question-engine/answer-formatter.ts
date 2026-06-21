import type { Question, QuestionBody } from "./types";

export function formatCorrectAnswer(question: Question): string {
	const body = question.body as Record<string, unknown>;

	switch (question.type) {
		case "ordering": {
			const items = body.items as { id: string; text: string }[] | undefined;
			const correctOrder = body.correctOrder as string[] | undefined;
			if (!items || !correctOrder) return question.explanation;
			const itemMap = new Map(items.map((i) => [i.id, i.text]));
			return correctOrder
				.map((id, i) => `${i + 1}. ${itemMap.get(id) ?? id}`)
				.join("\n");
		}

		case "fill-in-sequence": {
			const blanks = body.blanks as
				| { id: string; correctAnswer: string }[]
				| undefined;
			if (!blanks) return question.explanation;
			return blanks
				.map((b, i) => `Blank ${i + 1}: ${b.correctAnswer}`)
				.join("\n");
		}

		case "match-pairs": {
			const leftItems = body.leftItems as
				| { id: string; text: string }[]
				| undefined;
			const correctMatches = body.correctMatches as
				| { leftId: string; rightId: string }[]
				| undefined;
			const rightItems = body.rightItems as
				| { id: string; text: string }[]
				| undefined;
			if (!leftItems || !correctMatches || !rightItems) {
				return question.explanation;
			}
			const leftMap = new Map(leftItems.map((i) => [i.id, i.text]));
			const rightMap = new Map(rightItems.map((i) => [i.id, i.text]));
			return correctMatches
				.map(
					(m) => `${leftMap.get(m.leftId) ?? m.leftId} → ${rightMap.get(m.rightId) ?? m.rightId}`,
				)
				.join("\n");
		}

		case "diagram-labelling": {
			const regions = body.regions as
				| { id: string; label: string }[]
				| undefined;
			const correctPlacements = body.correctPlacements as
				| { labelId: string; regionId: string }[]
				| undefined;
			const labels = body.labels as { id: string; text: string }[] | undefined;
			if (!regions || !correctPlacements || !labels) {
				return question.explanation;
			}
			const regionMap = new Map(regions.map((r) => [r.id, r.label]));
			const labelMap = new Map(labels.map((l) => [l.id, l.text]));
			return correctPlacements
				.map(
					(m) =>
						`${labelMap.get(m.labelId) ?? m.labelId} → ${regionMap.get(m.regionId) ?? m.regionId}`,
				)
				.join("\n");
		}

		case "hot-spot": {
			const hsRegions = body.regions as
				| { id: string; label: string }[]
				| undefined;
			const correctId = body.correctRegionId as string | undefined;
			if (!hsRegions || !correctId) return question.explanation;
			const correct = hsRegions.find((r) => r.id === correctId);
			return correct
				? `Correct region: ${correct.label}`
				: question.explanation;
		}

		default:
			return question.explanation;
	}
}

export function formatUserAnswer(question: Question, answerValue: unknown): string {
	switch (question.type) {
		case "ordering": {
			const ids = answerValue as string[];
			return ids.map((_, i) => `Item ${i + 1}`).join(", ");
		}
		case "fill-in-sequence": {
			const answers = answerValue as Record<string, string>;
			return Object.entries(answers)
				.map(([k, v]) => `${k}: ${v}`)
				.join(", ");
		}
		case "match-pairs": {
			const matches = answerValue as Record<string, string>;
			return Object.entries(matches)
				.map(([k, v]) => `${k}→${v}`)
				.join(", ");
		}
		case "diagram-labelling": {
			const placements = answerValue as Record<string, string>;
			return Object.entries(placements)
				.map(([k, v]) => `${k}→${v}`)
				.join(", ");
		}
		case "hot-spot":
			return `Selected: ${answerValue as string}`;
		default:
			return "(see quiz history)";
	}
}
