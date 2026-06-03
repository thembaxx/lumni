"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { QuizView } from "@/components/quiz";

function handleQuit() {
	window.history.back();
}

function handleFinish(
	results: {
		questions: { id: string }[];
		correctness: boolean[];
		correctAnswers: number;
		totalQuestions: number;
		elapsedTime: number;
	},
	assignmentId: string | null,
) {
	if (!assignmentId) return;

	const score = Math.round(
		(results.correctAnswers / results.totalQuestions) * 100,
	);

	fetch(`/api/assignments/${assignmentId}/submit`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			score,
			maxScore: 100,
			totalQuestions: results.totalQuestions,
			correctCount: results.correctAnswers,
		}),
	}).catch(() => {
		/* silent fail */
	});
}

function QuizClientContent() {
	const { get } = useSearchParams();
	const initialSubject = get("subject") || undefined;
	const topic = get("topic") || undefined;
	const countParam = get("count");
	const questionCount = countParam ? parseInt(countParam, 10) : 20;
	const timeParam = get("time");
	const maxTime = timeParam ? parseInt(timeParam, 10) : undefined;
	const pastPaperMode = get("pastPaperMode") === "true";
	const assignmentId = get("assignmentId") || null;

	return (
		<QuizView
			initialSubject={initialSubject}
			topic={topic}
			questionCount={questionCount}
			maxTime={maxTime}
			pastPaperMode={pastPaperMode}
			onQuit={handleQuit}
			onFinish={(results) => handleFinish(results, assignmentId)}
		/>
	);
}

export function QuizClient() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center p-8">
					<div className="size-8 animate-spin rounded-full border-foreground border-b-2" />
				</div>
			}
		>
			<QuizClientContent />
		</Suspense>
	);
}
