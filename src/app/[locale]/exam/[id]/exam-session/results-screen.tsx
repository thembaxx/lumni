"use client";

import { SessionResultsView } from "@/components/exam";
import type { QuestionPart } from "@/types/exam-paper";

interface ResultsScreenProps {
	flatParts: Array<{
		sectionId: string;
		questionId: string;
		part: QuestionPart;
	}>;
	answers: Record<string, { value: string | string[] }>;
	subject: string;
	totalMarks: number;
	duration: string;
	onDashboard: () => void;
	onReview: () => void;
}

export function ResultsScreen({
	flatParts,
	answers,
	subject,
	totalMarks,
	duration,
	onDashboard,
	onReview,
}: ResultsScreenProps) {
	const partResults = flatParts.map((item) => {
		const fullId = `${item.sectionId}-${item.questionId}-${item.part.id}`;
		const answer = answers[fullId];
		let correct = false;
		if (item.part.type === "multiple-choice" && item.part.options) {
			const selected = Array.isArray(answer?.value)
				? answer?.value[0]
				: answer?.value;
			correct = item.part.options.some((o) => o.id === selected && o.isCorrect);
		}
		return { partId: fullId, correct, score: correct ? 1 : 0 };
	});

	return (
		<SessionResultsView
			results={{ partResults }}
			flatParts={flatParts}
			answers={answers}
			metadata={{
				subject,
				totalMarks,
				duration,
			}}
			onDashboard={onDashboard}
			onReview={onReview}
		/>
	);
}
