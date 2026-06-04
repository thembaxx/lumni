import { dexieDataAccess } from "@/lib/db";
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
		allBookmarks,
	] = await Promise.all([
		dexieDataAccess.progress.toArray(),
		dexieDataAccess.quizAttempts.toArray(),
		dexieDataAccess.competencies.toArray(),
		dexieDataAccess.flashcards.toArray(),
		dexieDataAccess.wrongAnswers.toArray(),
		dexieDataAccess.chatMessages.toArray(),
		dexieDataAccess.questionRatings.toArray(),
		dexieDataAccess.bookmarks.toArray(),
	]);

	await Promise.all([
		...allProgress.flatMap((p) =>
			p.odSubjectId && (p.questionsAttempted > 0 || p.correctCount > 0)
				? [
						enqueue("appwrite-progress-sync", {
							userId,
							odSubjectId: p.odSubjectId,
							questionsAttempted: p.questionsAttempted,
							correctCount: p.correctCount,
							currentStreak: p.currentStreak,
							longestStreak: p.longestStreak,
						}),
					]
				: [],
		),
		...allAttempts.flatMap((a) =>
			!a.userId
				? [
						enqueue("appwrite-attempt-sync", {
							userId,
							subjectId: a.odSubject,
							score: a.score,
							totalQuestions: a.totalQuestions,
							duration: a.duration,
							completedAt: a.completedAt,
						}).then(() =>
							dexieDataAccess.quizAttempts.update(a.id ?? 0, { userId }),
						),
					]
				: [],
		),
		...allCompetencies.map((c) =>
			enqueue("appwrite-competency-sync", {
				userId,
				subjectId: c.subjectId,
				topicId: c.topicId,
				bloomLevel: c.bloomLevel,
				proficiency: c.score,
				attempts: c.attempts,
				level: c.level,
				lastAssessed: c.lastAssessed,
			}),
		),
		...allFlashcards.map((f) =>
			enqueue("appwrite-flashcard-sync", {
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
				updatedAt: f.updatedAt,
			}),
		),
		...allWrongAnswers.map((w) =>
			enqueue("appwrite-wrong-answer-sync", {
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
			}),
		),
		...allChatMessages.map((m) =>
			enqueue("appwrite-chat-sync", {
				userId,
				messageId: m.messageId,
				role: m.role,
				content: m.content,
				type: m.type,
				timestamp: m.timestamp,
			}),
		),
		...allRatings.map((r) =>
			enqueue("appwrite-rating-sync", {
				questionId: r.questionId,
				subject: r.subject,
				rating: r.rating,
				feedback: r.feedback,
				createdAt: r.createdAt,
			}),
		),
		...allBookmarks.map((b) =>
			enqueue("appwrite-bookmark-sync", {
				userId,
				questionId: b.questionId,
				questionText: b.questionText,
				subject: b.subject,
				topic: b.topic,
				note: b.note,
				savedAt: b.savedAt,
			}),
		),
	]);
}
