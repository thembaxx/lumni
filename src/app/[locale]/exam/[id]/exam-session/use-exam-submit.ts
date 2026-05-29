import { useCallback } from "react";
import type { QuestionPart } from "@/types/exam-paper";

interface PartItem {
	sectionId: string;
	questionId: string;
	part: QuestionPart;
}

interface SubmitDeps {
	flatParts: PartItem[];
	answers: Record<string, { value: string | string[] }>;
	completeSession: () => void;
	updateStreak: () => void;
	addXp: (count: number, accuracy: number, streak: number) => void;
	checkAndUnlockAchievements: (
		total: number,
		accuracy: number,
		streak: number,
		level: number,
		perfect: boolean,
	) => void;
	currentStreak: number;
	totalQuestionsAnswered: number;
	levelInfo: { level: number };
	paperData?: { metadata: { subject: string } };
	addWrongAnswer: (data: {
		questionId: string;
		questionText: string;
		subject: string;
		topic: string;
		correctAnswer: string;
		userAnswer: string;
		explanation: string;
	}) => void;
}

export function useExamSubmit(deps: SubmitDeps) {
	const {
		flatParts,
		answers,
		completeSession,
		updateStreak,
		addXp,
		checkAndUnlockAchievements,
		currentStreak,
		totalQuestionsAnswered,
		levelInfo,
		paperData,
		addWrongAnswer,
	} = deps;

	const handleSubmit = useCallback(async () => {
		const timerRef = { current: null as ReturnType<typeof setInterval> | null };
		completeSession();
		if (timerRef.current) clearInterval(timerRef.current);

		const partResults = flatParts.map((item) => {
			const fullId = `${item.sectionId}-${item.questionId}-${item.part.id}`;
			const answer = answers[fullId];
			let correct = false;
			if (item.part.type === "multiple-choice" && item.part.options) {
				const selected = Array.isArray(answer?.value)
					? answer?.value[0]
					: answer?.value;
				correct = item.part.options.some(
					(o) => o.id === selected && o.isCorrect,
				);
			}
			return { partId: fullId, correct, score: correct ? 1 : 0 };
		});

		const correctCount = partResults.filter((r) => r.correct).length;
		const totalCount = partResults.length;
		const accuracy =
			totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

		updateStreak();
		addXp(totalCount, accuracy, currentStreak);
		checkAndUnlockAchievements(
			totalQuestionsAnswered + totalCount,
			accuracy,
			currentStreak,
			levelInfo.level,
			accuracy === 100,
		);

		const { trackQuestionResult } = await import("@/lib/orchestrator");
		const { flashcardEngine } = await import("@/lib/flashcard-engine");
		const { getCorrectAnswerText, getAnswerText } = await import(
			"@/lib/exam/helpers"
		);
		const { addStudySession } = await import("@/lib/utils/study-planner");

		const flashcardPromises: Promise<unknown>[] = [];
		const trackPromises: Promise<unknown>[] = [];
		for (let i = 0; i < flatParts.length; i++) {
			const item = flatParts[i];
			const result = partResults[i];
			const topic = item.sectionId;
			const subject = paperData?.metadata.subject ?? "unknown";

			const maxScore =
				typeof item.part.marks === "number" ? item.part.marks : result.score;

			trackPromises.push(
				trackQuestionResult({
					subjectId: subject,
					topicId: topic,
					bloomLevel: "apply",
					score: result.score,
					maxScore,
				}),
			);

			if (!result.correct) {
				const partText = item.part.text ?? `Question ${item.questionId}`;
				addWrongAnswer({
					questionId: result.partId,
					questionText: partText,
					subject,
					topic,
					correctAnswer: getCorrectAnswerText(item.part),
					userAnswer: getAnswerText(item.part, answers[result.partId]),
					explanation: "",
				});
				flashcardPromises.push(
					flashcardEngine.create(
						partText,
						getCorrectAnswerText(item.part) || "Review this topic",
						subject,
					),
				);
			}
		}
		await Promise.all([...trackPromises, ...flashcardPromises]);

		const weakCount = partResults.filter((r) => !r.correct).length;
		if (weakCount > 0) {
			const now = Date.now();
			addStudySession({
				subject: paperData?.metadata.subject ?? "unknown",
				type: "exam",
				scheduledAt: now + 24 * 60 * 60 * 1000,
				duration: Math.min(weakCount * 5, 45),
				completed: false,
			});
		}

		return partResults;
	}, [
		flatParts,
		answers,
		completeSession,
		updateStreak,
		addXp,
		currentStreak,
		checkAndUnlockAchievements,
		totalQuestionsAnswered,
		levelInfo.level,
		paperData,
		addWrongAnswer,
	]);

	return { handleSubmit };
}
