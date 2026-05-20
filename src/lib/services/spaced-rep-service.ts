import { flashcardRepository } from "@/lib/flashcard-repository";
import type { Question } from "@/lib/question-engine/types";
import { calculateNextReview } from "@/lib/utils/spaced-repetition";

export class SpacedRepService {
	async update(
		question: Question,
		result: { correct: boolean; score: number },
	): Promise<void> {
		const quality = result.correct
			? result.score >= 0.9
				? 5
				: result.score >= 0.7
					? 4
					: 3
			: result.score >= 0.5
				? 2
				: result.score >= 0.25
					? 1
					: 0;

		const allCards = await flashcardRepository.getAll(question.subject);
		const existingCards = allCards.filter(
			(c) => c.front === question.questionText,
		);

		if (existingCards.length > 0) {
			const card = existingCards[0];
			const { easeFactor, interval, repetitions, nextReview } =
				calculateNextReview(
					quality,
					card.easeFactor,
					card.interval,
					card.repetitions,
				);

			await flashcardRepository.update(card.id, {
				easeFactor,
				interval,
				repetitions,
				nextReview,
				lastReview: Date.now(),
			});
		} else {
			const correctOptionText = extractCorrectAnswer(question);
			await flashcardRepository.create(
				question.questionText,
				correctOptionText || question.explanation,
				question.subject,
				question.topic,
			);
		}
	}
}

export function extractCorrectAnswer(question: Question): string | null {
	const body = question.body;
	if ("options" in body) {
		const options = body.options as Array<{ text: string; isCorrect: boolean }>;
		const correct = options.find((o) => o.isCorrect);
		return correct?.text ?? null;
	}
	if ("modelAnswer" in body) {
		return (body as { modelAnswer: string }).modelAnswer;
	}
	if ("correctValue" in body) {
		return String((body as { correctValue: number }).correctValue);
	}
	return null;
}

export const spacedRepService = new SpacedRepService();
