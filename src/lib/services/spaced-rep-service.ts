import { safePersist } from "@/lib/db/persist";
import type { Question } from "@/lib/question-engine/types";
import {
	createFlashcard,
	loadFlashcards,
	saveFlashcards,
} from "@/lib/utils/spaced-repetition";

export class SpacedRepService {
	async update(
		question: Question,
		result: { correct: boolean; score: number },
	): Promise<void> {
		await safePersist(
			"spaced repetition update",
			async () => {
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

				const existingCards = loadFlashcards().filter(
					(c) => c.front === question.questionText,
				);

				if (existingCards.length > 0) {
					const card = existingCards[0];
					const { calculateNextReview } = await import(
						"@/lib/utils/spaced-repetition"
					);
					const { easeFactor, interval, repetitions } = calculateNextReview(
						quality,
						card.easeFactor,
						card.interval,
						card.repetitions,
					);

					const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
					const cards = loadFlashcards();
					const index = cards.findIndex((c) => c.id === card.id);
					if (index >= 0) {
						cards[index] = {
							...card,
							easeFactor,
							interval,
							repetitions,
							nextReview,
							lastReview: Date.now(),
						};
						saveFlashcards(cards);
					}
				} else {
					const correctOptionText = extractCorrectAnswer(question);
					createFlashcard(
						question.questionText,
						correctOptionText || question.explanation,
						question.subject,
						question.topic,
					);
				}

				return quality;
			},
			async (quality) => {
				const { addToSyncQueue } = await import("@/lib/db/offline");
				await addToSyncQueue("sync", {
					type: "spaced-rep-update",
					questionId: question.id,
					quality,
				});
			},
		);
	}
}

function extractCorrectAnswer(question: Question): string | null {
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
