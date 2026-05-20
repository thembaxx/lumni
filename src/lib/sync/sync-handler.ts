import { offlineDB } from "@/lib/db/schema";
import { enqueue } from "@/lib/orchestrator/job-queue";

export async function flushOfflineData(userId: string): Promise<void> {
	const [
		allProgress,
		allAttempts,
		allCompetencies,
		allFlashcards,
		allWrongAnswers,
		allChatMessages,
		allRatings,
	] = await Promise.all([
		offlineDB.progress.toArray(),
		offlineDB.quizAttempts.toArray(),
		offlineDB.competencies.toArray(),
		offlineDB.flashcards.toArray(),
		offlineDB.wrongAnswers.toArray(),
		offlineDB.chatMessages.toArray(),
		offlineDB.questionRatings.toArray(),
	]);

	await Promise.all([
		...allProgress.map(async (p) => {
			if (p.odSubjectId && (p.questionsAttempted > 0 || p.correctCount > 0)) {
				await enqueue("appwrite-progress-sync", {
					userId,
					odSubjectId: p.odSubjectId,
					questionsAttempted: p.questionsAttempted,
					correctCount: p.correctCount,
					currentStreak: p.currentStreak,
					longestStreak: p.longestStreak,
				});
			}
		}),
		...allAttempts.map(async (a) => {
			if (!a.userId) {
				await enqueue("appwrite-attempt-sync", {
					userId,
					subjectId: a.odSubject,
					score: a.score,
					totalQuestions: a.totalQuestions,
					duration: a.duration,
					completedAt: a.completedAt,
				});
				await offlineDB.quizAttempts.update(a.id ?? 0, { userId });
			}
		}),
		...allCompetencies.map(async (c) => {
			await enqueue("appwrite-competency-sync", {
				userId,
				subjectId: c.subjectId,
				topicId: c.topicId,
				bloomLevel: c.bloomLevel,
				proficiency: c.score,
				attempts: c.attempts,
				level: c.level,
				lastAssessed: c.lastAssessed,
			});
		}),
		...allFlashcards.map(async (f) => {
			await enqueue("appwrite-flashcard-sync", {
				userId,
				id: f.id,
				front: f.front,
				back: f.back,
				subject: f.subject,
				topic: f.topic,
				easeFactor: f.easeFactor,
				interval: f.interval,
				repetitions: f.repetitions,
				nextReview: f.nextReview,
				lastReview: f.lastReview,
				createdAt: f.createdAt,
			});
		}),
		...allWrongAnswers.map(async (w) => {
			await enqueue("appwrite-wrong-answer-sync", {
				userId,
				questionId: w.questionId,
				questionText: w.questionText,
				subject: w.subject,
				topic: w.topic,
				correctAnswer: w.correctAnswer,
				userAnswer: w.userAnswer,
				explanation: w.explanation,
				createdAt: w.createdAt,
				reviewed: w.reviewed,
				errorType: w.errorType,
			});
		}),
		...allChatMessages.map(async (m) => {
			await enqueue("appwrite-chat-sync", {
				userId,
				messageId: m.messageId,
				role: m.role,
				content: m.content,
				type: m.type,
				timestamp: m.timestamp,
			});
		}),
		...allRatings.map(async (r) => {
			await enqueue("appwrite-rating-sync", {
				questionId: r.questionId,
				subject: r.subject,
				topic: r.topic,
				rating: r.rating,
				feedback: r.feedback,
				createdAt: r.createdAt,
			});
		}),
	]);
}
