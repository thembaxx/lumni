"use client";

import { useCallback, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

export interface SubjectAnalytics {
	subjectId: string;
	subjectName: string;
	totalQuestions: number;
	correctCount: number;
	accuracy: number;
	currentStreak: number;
	longestStreak: number;
	lastAttemptAt: number | null;
	weakTopics: TopicPerformance[];
	strongTopics: TopicPerformance[];
	history: PerformanceHistoryItem[];
}

export interface TopicPerformance {
	topic: string;
	total: number;
	correct: number;
	accuracy: number;
	avgTime: number;
	lastAttempt: number;
}

export interface PerformanceHistoryItem {
	date: string;
	questions: number;
	correct: number;
	accuracy: number;
	duration: number;
}

export interface OverallAnalytics {
	totalQuestions: number;
	totalCorrect: number;
	overallAccuracy: number;
	currentStreak: number;
	longestStreak: number;
	totalStudyTime: number;
	subjects: SubjectAnalytics[];
	weeklyProgress: PerformanceHistoryItem[];
	insights: string[];
	recommendations: AnalyticsRecommendation[];
}

export interface AnalyticsRecommendation {
	type: "practice" | "review" | "rest" | "exam";
	subject?: string;
	topic?: string;
	message: string;
	priority: number;
}

const ANALYTICS_KEY = "lumni_analytics";
const HISTORY_KEY = "lumni_performance_history";

export function loadAnalytics(): OverallAnalytics | null {
	return loadFromStorage<OverallAnalytics>(ANALYTICS_KEY, null);
}

export function saveAnalytics(data: OverallAnalytics): void {
	saveToStorage(ANALYTICS_KEY, data);
}

export function useAnalytics() {
	const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const loadFromStorage = useCallback(() => {
		if (typeof window === "undefined") return null;
		const stored = localStorage.getItem(ANALYTICS_KEY);
		return stored ? JSON.parse(stored) : null;
	}, []);

	const calculateAnalytics = useCallback((): OverallAnalytics => {
		const progressData = getUserProgress();
		const historyData = getPerformanceHistory();

		const subjects: SubjectAnalytics[] = progressData.map((p) => {
			const topicStats: Record<
				string,
				{ correct: number; total: number; times: number[] }
			> = {};

			const subjectHistory = historyData.filter(
				(h) => h.subject === p.subjectName,
			);

			subjectHistory.forEach((h) => {
				h.topicStats?.forEach((ts) => {
					if (!topicStats[ts.topic]) {
						topicStats[ts.topic] = { correct: 0, total: 0, times: [] };
					}
					topicStats[ts.topic].total += ts.total;
					topicStats[ts.topic].correct += ts.correct;
					topicStats[ts.topic].times.push(ts.avgTime || 0);
				});
			});

			const weakTopics = Object.entries(topicStats)
				.filter(([, stats]) => stats.correct / stats.total < 0.6)
				.map(([topic, stats]) => ({
					topic,
					total: stats.total,
					correct: stats.correct,
					accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
					avgTime:
						stats.times.length > 0
							? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
							: 0,
					lastAttempt: Date.now(),
				}))
				.sort((a, b) => a.accuracy - b.accuracy);

			const strongTopics = Object.entries(topicStats)
				.filter(([, stats]) => stats.correct / stats.total >= 0.8)
				.map(([topic, stats]) => ({
					topic,
					total: stats.total,
					correct: stats.correct,
					accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
					avgTime:
						stats.times.length > 0
							? stats.times.reduce((a, b) => a + b, 0) / stats.times.length
							: 0,
					lastAttempt: Date.now(),
				}))
				.sort((a, b) => b.accuracy - a.accuracy);

			return {
				subjectId: p.subjectId,
				subjectName: p.subjectName,
				totalQuestions: p.totalQuestions,
				correctCount: p.correctCount,
				accuracy: p.totalQuestions > 0 ? p.correctCount / p.totalQuestions : 0,
				currentStreak: p.currentStreak,
				longestStreak: p.currentStreak,
				lastAttemptAt: p.lastAttemptAt,
				weakTopics,
				strongTopics,
				history: subjectHistory.slice(-30),
			};
		});

		const totalQuestions = subjects.reduce(
			(sum, s) => sum + s.totalQuestions,
			0,
		);
		const totalCorrect = subjects.reduce((sum, s) => sum + s.correctCount, 0);
		const totalStudyTime = historyData.reduce((sum, h) => sum + h.duration, 0);

		const weeklyProgress = historyData
			.filter(
				(h) =>
					Date.now() - new Date(h.date).getTime() < 7 * 24 * 60 * 60 * 1000,
			)
			.slice(-7);

		const insights = generateInsights(subjects, totalQuestions, totalCorrect);
		const recommendations = generateRecommendations(subjects);

		return {
			totalQuestions,
			totalCorrect,
			overallAccuracy: totalQuestions > 0 ? totalCorrect / totalQuestions : 0,
			currentStreak: Math.max(...subjects.map((s) => s.currentStreak), 0),
			longestStreak: Math.max(...subjects.map((s) => s.longestStreak), 0),
			totalStudyTime,
			subjects,
			weeklyProgress,
			insights,
			recommendations,
		};
	}, []);

	const refresh = useCallback(() => {
		const data = calculateAnalytics();
		setAnalytics(data);
		saveAnalytics(data);
	}, [calculateAnalytics]);

	useEffect(() => {
		const stored = loadFromStorage();
		if (stored) {
			setAnalytics(stored);
		} else {
			const calculated = calculateAnalytics();
			setAnalytics(calculated);
			saveAnalytics(calculated);
		}
		setIsLoading(false);
	}, [loadFromStorage, calculateAnalytics]);

	return {
		analytics,
		isLoading,
		refresh,
	};
}

function getUserProgress(): Array<{
	subjectId: string;
	subjectName: string;
	totalQuestions: number;
	correctCount: number;
	currentStreak: number;
	lastAttemptAt: number | null;
}> {
	if (typeof window === "undefined") return [];

	const stored = localStorage.getItem("lumni_user_progress");
	if (!stored) return [];

	try {
		return JSON.parse(stored);
	} catch {
		return [];
	}
}

function getPerformanceHistory(): Array<{
	date: string;
	subject: string;
	questions: number;
	correct: number;
	accuracy: number;
	duration: number;
	topicStats?: Array<{
		topic: string;
		total: number;
		correct: number;
		avgTime: number;
	}>;
}> {
	if (typeof window === "undefined") return [];

	const stored = localStorage.getItem(HISTORY_KEY);
	if (!stored) return [];

	try {
		return JSON.parse(stored);
	} catch {
		return [];
	}
}

function generateInsights(
	subjects: SubjectAnalytics[],
	totalQuestions: number,
	totalCorrect: number,
): string[] {
	const insights: string[] = [];

	if (totalQuestions === 0) {
		insights.push("Start your first quiz to begin tracking your progress!");
		return insights;
	}

	const avgAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

	if (avgAccuracy >= 0.9) {
		insights.push(
			"Outstanding! You're maintaining 90%+ accuracy across subjects.",
		);
	} else if (avgAccuracy >= 0.7) {
		insights.push(
			"Great progress! You're averaging 70%+ accuracy. Keep it up!",
		);
	} else if (avgAccuracy >= 0.5) {
		insights.push(
			"You're making progress. Focus on understanding the fundamentals.",
		);
	} else {
		insights.push(
			"Let's turn this around. Start with easier topics to build confidence.",
		);
	}

	subjects.forEach((subject) => {
		if (subject.weakTopics.length > 2) {
			insights.push(
				`${subject.subjectName}: Focus on ${subject.weakTopics[0].topic} - it's your weakest area.`,
			);
		}
		if (subject.accuracy >= 0.9) {
			insights.push(
				`You've mastered ${subject.subjectName}! Consider helping peers or teaching the topic.`,
			);
		}
	});

	const recentSubjects = subjects.filter(
		(s) =>
			s.lastAttemptAt && Date.now() - s.lastAttemptAt < 24 * 60 * 60 * 1000,
	);
	if (recentSubjects.length === 0) {
		insights.push(
			"You haven't studied recently. Set a daily reminder to maintain your streak!",
		);
	}

	return insights;
}

function generateRecommendations(
	subjects: SubjectAnalytics[],
): AnalyticsRecommendation[] {
	const recommendations: AnalyticsRecommendation[] = [];

	const weakSubjects = subjects
		.filter((s) => s.weakTopics.length > 0)
		.sort((a, b) => {
			const aAccuracy = a.weakTopics[0]?.accuracy || 0;
			const bAccuracy = b.weakTopics[0]?.accuracy || 0;
			return aAccuracy - bAccuracy;
		});

	if (weakSubjects.length > 0) {
		const worst = weakSubjects[0];
		recommendations.push({
			type: "practice",
			subject: worst.subjectName,
			topic: worst.weakTopics[0]?.topic,
			message: `Practice ${worst.weakTopics[0]?.topic} in ${worst.subjectName} - only ${Math.round(worst.weakTopics[0]?.accuracy * 100)}% accuracy`,
			priority: 1,
		});
	}

	const strongSubjects = subjects
		.filter((s) => s.accuracy >= 0.8)
		.sort((a, b) => b.accuracy - a.accuracy);

	if (strongSubjects.length > 0) {
		recommendations.push({
			type: "exam",
			subject: strongSubjects[0].subjectName,
			message: `Great ${strongSubjects[0].subjectName} skills! Try an exam paper to test yourself.`,
			priority: 2,
		});
	}

	const inactiveSubjects = subjects.filter(
		(s) =>
			!s.lastAttemptAt ||
			Date.now() - s.lastAttemptAt > 3 * 24 * 60 * 60 * 1000,
	);

	if (inactiveSubjects.length > 0) {
		recommendations.push({
			type: "practice",
			subject: inactiveSubjects[0].subjectName,
			message: `Time to review ${inactiveSubjects[0].subjectName} - haven't practiced in 3+ days!`,
			priority: 3,
		});
	}

	recommendations.push({
		type: "rest",
		message: "Remember to take breaks - study smarter, not just harder!",
		priority: 10,
	});

	return recommendations.sort((a, b) => a.priority - b.priority);
}

export function trackQuizResult(
	subject: string,
	questions: number,
	correct: number,
	duration: number,
	topicStats?: Array<{
		topic: string;
		total: number;
		correct: number;
		avgTime: number;
	}>,
): void {
	if (typeof window === "undefined") return;

	const history = getPerformanceHistory();
	const today = new Date().toISOString().split("T")[0];

	const existingToday = history.find(
		(h) => h.date === today && h.subject === subject,
	);

	if (existingToday) {
		existingToday.questions += questions;
		existingToday.correct += correct;
		existingToday.accuracy = existingToday.correct / existingToday.questions;
		existingToday.duration += duration;
		if (topicStats) {
			existingToday.topicStats = mergeTopicStats(
				existingToday.topicStats || [],
				topicStats,
			);
		}
	} else {
		history.push({
			date: today,
			subject,
			questions,
			correct,
			accuracy: correct / questions,
			duration,
			topicStats,
		});
	}

	const trimmedHistory = history.slice(-90);
	localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));

	localStorage.removeItem(ANALYTICS_KEY);
}

function mergeTopicStats(
	existing: Array<{
		topic: string;
		total: number;
		correct: number;
		avgTime: number;
	}>,
	incoming: Array<{
		topic: string;
		total: number;
		correct: number;
		avgTime: number;
	}>,
): Array<{ topic: string; total: number; correct: number; avgTime: number }> {
	const merged = [...existing];

	incoming.forEach((incomingStat) => {
		const existingIndex = merged.findIndex(
			(e) => e.topic === incomingStat.topic,
		);
		if (existingIndex >= 0) {
			merged[existingIndex].total += incomingStat.total;
			merged[existingIndex].correct += incomingStat.correct;
			merged[existingIndex].avgTime =
				(merged[existingIndex].avgTime *
					(merged[existingIndex].total - incomingStat.total) +
					incomingStat.avgTime * incomingStat.total) /
				merged[existingIndex].total;
		} else {
			merged.push(incomingStat);
		}
	});

	return merged;
}
