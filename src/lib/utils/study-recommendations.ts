import type { QAQuestion } from "@/types/questions";

export interface UserProgress {
	subjectId: string;
	subjectName: string;
	totalQuestions: number;
	correctCount: number;
	currentStreak: number;
	lastAttemptAt: number | null;
	weakTopics: string[];
	strongTopics: string[];
}

export interface StudyRecommendation {
	type: "review" | "practice" | "flashcard" | "exam";
	subject: string;
	topic?: string;
	priority: number;
	reason: string;
	actionLabel: string;
	actionUrl: string;
}

const STREAK_STORAGE_KEY = "lumni_user_progress";
const RECOMMENDATION_CACHE_KEY = "lumni_recommendations_cache";
const CACHE_DURATION = 1000 * 60 * 30;

export function getUserProgress(): UserProgress[] {
	const stored = localStorage.getItem(STREAK_STORAGE_KEY);
	if (!stored) return [];

	try {
		return JSON.parse(stored) as UserProgress[];
	} catch {
		return [];
	}
}

export function saveUserProgress(progress: UserProgress[]): void {
	localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(progress));
}

export function updateProgressFromQuiz(
	subjectId: string,
	subjectName: string,
	questions: QAQuestion[],
	correctCount: number,
): void {
	const progressList = getUserProgress();
	const existing = progressList.find((p) => p.subjectId === subjectId);

	const topicStats: Record<string, { correct: number; total: number }> = {};

	for (const q of questions) {
		const topic = q.topic || "General";
		if (!topicStats[topic]) {
			topicStats[topic] = { correct: 0, total: 0 };
		}
		topicStats[topic].total++;
	}

	const correctAnswers = new Set(
		questions
			.filter((q) =>
				q.options?.find(
					(o) => o.isCorrect && q.options?.find((opt) => opt.isCorrect),
				),
			)
			.map((q) => q.topic),
	);

	for (const [topic, stats] of Object.entries(topicStats)) {
		const accuracy = stats.correct / stats.total;
		if (accuracy < 0.5) {
			correctAnswers.delete(topic);
		}
	}

	const weakTopics = Object.entries(topicStats)
		.filter(([, stats]) => stats.correct / stats.total < 0.6)
		.map(([topic]) => topic);

	const strongTopics = Object.entries(topicStats)
		.filter(([, stats]) => stats.correct / stats.total >= 0.8)
		.map(([topic]) => topic);

	const newProgress: UserProgress = {
		subjectId,
		subjectName,
		totalQuestions: questions.length,
		correctCount,
		currentStreak: existing ? existing.currentStreak + 1 : 1,
		lastAttemptAt: Date.now(),
		weakTopics,
		strongTopics,
	};

	if (existing) {
		newProgress.currentStreak = Math.max(
			existing.currentStreak,
			newProgress.currentStreak,
		);
	}

	const updated = existing
		? progressList.map((p) => (p.subjectId === subjectId ? newProgress : p))
		: [...progressList, newProgress];

	saveUserProgress(updated);
	clearRecommendationCache();
}

export function generateStudyRecommendations(): StudyRecommendation[] {
	const cached = getCachedRecommendations();
	if (cached) return cached;

	const progressList = getUserProgress();
	const recommendations: StudyRecommendation[] = [];

	for (const progress of progressList) {
		if (progress.weakTopics.length > 0) {
			for (const topic of progress.weakTopics.slice(0, 2)) {
				recommendations.push({
					type: "practice",
					subject: progress.subjectName,
					topic,
					priority: 1,
					reason: `You're struggling with ${topic}. Practice to improve.`,
					actionLabel: `Practice ${topic}`,
					actionUrl: `/quiz?subject=${progress.subjectId}&topic=${encodeURIComponent(topic)}`,
				});
			}
		}

		recommendations.push({
			type: "flashcard",
			subject: progress.subjectName,
			priority: 2,
			reason: `Review ${progress.subjectName} flashcards to strengthen recall.`,
			actionLabel: "Review Flashcards",
			actionUrl: `/flashcards?subject=${progress.subjectId}`,
		});

		if (progress.currentStreak >= 5) {
			recommendations.push({
				type: "exam",
				subject: progress.subjectName,
				priority: 3,
				reason: `Great streak! Test yourself with exam papers.`,
				actionLabel: "Take Exam",
				actionUrl: `/dashboard?tab=practice&subject=${progress.subjectId}`,
			});
		}
	}

	if (recommendations.length === 0) {
		recommendations.push({
			type: "practice",
			subject: "General",
			priority: 1,
			reason: "Start your learning journey by practicing some questions.",
			actionLabel: "Start Quiz",
			actionUrl: "/quiz",
		});
	}

	recommendations.sort((a, b) => a.priority - b.priority);
	setCachedRecommendations(recommendations);

	return recommendations;
}

function getCachedRecommendations(): StudyRecommendation[] | null {
	const stored = localStorage.getItem(RECOMMENDATION_CACHE_KEY);
	if (!stored) return null;

	try {
		const cached = JSON.parse(stored);
		if (Date.now() - cached.timestamp > CACHE_DURATION) {
			localStorage.removeItem(RECOMMENDATION_CACHE_KEY);
			return null;
		}
		return cached.recommendations;
	} catch {
		return null;
	}
}

function setCachedRecommendations(
	recommendations: StudyRecommendation[],
): void {
	localStorage.setItem(
		RECOMMENDATION_CACHE_KEY,
		JSON.stringify({
			timestamp: Date.now(),
			recommendations,
		}),
	);
}

function clearRecommendationCache(): void {
	localStorage.removeItem(RECOMMENDATION_CACHE_KEY);
}

export function getRecommendedStudyTime(): {
	daily: number;
	weekly: number;
	reason: string;
} {
	const progressList = getUserProgress();

	if (progressList.length === 0) {
		return {
			daily: 30,
			weekly: 150,
			reason: "Start with 30 minutes daily to build a habit.",
		};
	}

	const avgCorrect =
		progressList.reduce(
			(sum, p) => sum + p.correctCount / Math.max(p.totalQuestions, 1),
			0,
		) / progressList.length;

	if (avgCorrect < 0.5) {
		return {
			daily: 45,
			weekly: 225,
			reason: "Focus more time on practice to improve your understanding.",
		};
	}

	if (avgCorrect >= 0.8) {
		return {
			daily: 20,
			weekly: 100,
			reason: "Great progress! Maintain your knowledge with regular review.",
		};
	}

	return {
		daily: 30,
		weekly: 150,
		reason: "Balanced study schedule to keep improving.",
	};
}
