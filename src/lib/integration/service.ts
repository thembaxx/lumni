import { computeCompetencyLevel } from "@/lib/competency-engine/types";
import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

// ── Integration 1: Lesson→Past Questions loop ──
// When a lesson is completed, suggest 3 related past questions.
// Wrong answers flag the lesson for review (resurface after 24h).

export async function suggestQuestionsForLesson(
	subject: string,
	subtopicId: string,
): Promise<
	{ id: string; questionText: string; year: number; marks: number }[]
> {
	try {
		const all = await dexieDataAccess.pastPaperQuestions
			.where("subject")
			.equals(subject)
			.toArray();
		const matched = all.filter((q) => q.subtopicId === subtopicId);
		return matched.slice(0, 3).map((q) => ({
			id: q.id,
			questionText: q.questionText,
			year: q.year,
			marks: q.marks ?? 0,
		}));
	} catch (err) {
		logError("Integration.suggestQuestions", err);
		return [];
	}
}

export async function flagLessonForReview(
	_userId: string,
	lessonId: string,
): Promise<void> {
	try {
		await dexieDataAccess.retentionRecurrence.add({
			questionId: `lesson-review:${lessonId}`,
			subject: "",
			topic: lessonId,
			questionText: "",
			correctAnswer: "",
			explanation: "",
			scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
			completed: false,
		});
	} catch (err) {
		logError("Integration.flagLesson", err);
	}
}

// ── Integration 2: Lesson→Pronunciation loop ──
// Vocabulary from each lesson feeds pronunciation practice.
// A word is "learned" only after passing pronunciation assessment.

export function getPronunciationWords(_subject: string): string[] {
	return [];
}

// ── Integration 3: Story→Lesson loop ──
// Comprehension questions feed competency tracking for "Reading and Comprehension".
// Low score suggests simpler story and vocabulary review.

export async function trackComprehensionScore(
	_userId: string,
	subjectId: string,
	topicId: string,
	score: number,
	total: number,
): Promise<void> {
	try {
		const competencies = await dexieDataAccess.competencies
			.where("subjectId")
			.equals(subjectId)
			.toArray();
		const existing = competencies.find((c) => c.topicId === topicId);
		if (existing) {
			await dexieDataAccess.competencies.update(existing.id as number, {
				level: computeCompetencyLevel(score / total),
				lastAssessed: Date.now(),
			});
		}
	} catch (err) {
		logError("Integration.trackComprehension", err);
	}
}

// ── Integration 4: Dictionary→Flashcard loop ──
// Saved vocabulary words auto-create SM-2 flashcards.

export async function createFlashcardFromVocabulary(
	userId: string,
	word: string,
	definition: string,
	subject: string,
): Promise<void> {
	try {
		const cardId = `vocab-${userId}-${word.toLowerCase()}`;
		const existing = await dexieDataAccess.flashcards.get(cardId);
		if (existing) return;
		const now = Date.now();
		await dexieDataAccess.flashcards.put({
			id: cardId,
			subject,
			topic: "vocabulary",
			front: word,
			back: definition,
			nextReview: now,
			lastReview: null,
			createdAt: now,
			updatedAt: now,
			algorithm: "sm2",
			easeFactor: 2.5,
			interval: 0,
			repetitions: 0,
			stability: 0,
			difficulty: 0,
			lapses: 0,
			status: "active",
			learningStep: 0,
			leeched: false,
		});
	} catch (err) {
		logError("Integration.vocabFlashcard", err);
	}
}

// ── Integration 5: Quiz→Past Questions mode ──
// "Quiz from past questions" using PastPaperQuestion records filtered by subtopic.

export async function getPastQuestionsForQuiz(
	subject: string,
	topicId: string,
	limit = 5,
): Promise<
	{ id: string; questionText: string; answerText: string; year: number }[]
> {
	try {
		const all = await dexieDataAccess.pastPaperQuestions
			.where("subject")
			.equals(subject)
			.toArray();
		const matched = all.filter((q) => q.subtopicId?.startsWith(topicId));
		return matched.slice(0, limit).map((q) => ({
			id: q.id,
			questionText: q.questionText,
			answerText: q.answerText,
			year: q.year,
		}));
	} catch (err) {
		logError("Integration.pastQuestionsQuiz", err);
		return [];
	}
}
