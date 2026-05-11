import type { Option, QAQuestion } from "@/types/questions";

function getMcqOptions(q: QAQuestion): Option[] {
	return (q as unknown as { body: { options: Option[] } }).body?.options ?? [];
}

export interface FlashcardData {
	id: string;
	question: string;
	answer: string;
	explanation?: string;
	topic: string;
	difficulty: string;
	sourceQuizId?: string;
	createdAt: number;
}

export interface QuizToFlashcardsOptions {
	questions: QAQuestion[];
	correctAnswers: number;
	incorrectAnswerIds: string[];
	subject: string;
	quizId?: string;
}

export function convertQuizToFlashcards({
	questions,
	incorrectAnswerIds,
	subject,
	quizId,
}: QuizToFlashcardsOptions): FlashcardData[] {
	const flashcards: FlashcardData[] = [];

	for (const question of questions) {
		if (incorrectAnswerIds.includes(question.id)) {
			const correctOption = getMcqOptions(question).find(
				(opt) => opt.isCorrect,
			);

			flashcards.push({
				id: `fc_${question.id}_${Date.now()}`,
				question: question.questionText,
				answer: correctOption?.text || "",
				explanation: question.explanation,
				topic: question.topic || "General",
				difficulty: question.difficulty,
				sourceQuizId: quizId,
				createdAt: Date.now(),
			});
		}
	}

	return flashcards;
}

export function saveFlashcardsToStorage(flashcards: FlashcardData[]): void {
	const existing = JSON.parse(
		localStorage.getItem("lumni_flashcards") || "[]",
	) as FlashcardData[];

	const updated = [...existing, ...flashcards];
	localStorage.setItem("lumni_flashcards", JSON.stringify(updated));
}

export function getFlashcardsFromStorage(): FlashcardData[] {
	return JSON.parse(
		localStorage.getItem("lumni_flashcards") || "[]",
	) as FlashcardData[];
}

export function getFlashcardsByTopic(topic: string): FlashcardData[] {
	return getFlashcardsFromStorage().filter((fc) => fc.topic === topic);
}

export function getFlashcardsByDifficulty(
	difficulty: "Easy" | "Medium" | "Hard",
): FlashcardData[] {
	return getFlashcardsFromStorage().filter(
		(fc) => fc.difficulty === difficulty,
	);
}

export function deleteFlashcard(id: string): void {
	const flashcards = getFlashcardsFromStorage();
	const filtered = flashcards.filter((fc) => fc.id !== id);
	localStorage.setItem("lumni_flashcards", JSON.stringify(filtered));
}

export function clearAllFlashcards(): void {
	localStorage.removeItem("lumni_flashcards");
}

export function getFlashcardStats(): {
	total: number;
	byTopic: Record<string, number>;
	byDifficulty: Record<string, number>;
	weakestTopic: string | null;
} {
	const flashcards = getFlashcardsFromStorage();

	const byTopic: Record<string, number> = {};
	const byDifficulty: Record<string, number> = {};

	for (const fc of flashcards) {
		byTopic[fc.topic] = (byTopic[fc.topic] || 0) + 1;
		byDifficulty[fc.difficulty] = (byDifficulty[fc.difficulty] || 0) + 1;
	}

	let weakestTopic: string | null = null;
	let minCount = Infinity;

	for (const [topic, count] of Object.entries(byTopic)) {
		if (count < minCount && count > 0) {
			minCount = count;
			weakestTopic = topic;
		}
	}

	return {
		total: flashcards.length,
		byTopic,
		byDifficulty,
		weakestTopic,
	};
}

export function prioritizeIncorrectAnswers(
	questions: QAQuestion[],
	incorrectAnswerIds: string[],
): QAQuestion[] {
	const correct: QAQuestion[] = [];
	const incorrect: QAQuestion[] = [];

	for (const q of questions) {
		if (incorrectAnswerIds.includes(q.id)) {
			incorrect.push(q);
		} else {
			correct.push(q);
		}
	}

	incorrect.sort((a, b) => {
		const difficultyOrder = { Hard: 0, Medium: 1, Easy: 2 };
		return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
	});

	return [...incorrect, ...correct];
}
