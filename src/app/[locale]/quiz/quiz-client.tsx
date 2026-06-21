"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QuizView } from "@/components/quiz";
import type { Question } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";

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
	}).catch((err) => {
		logError("AssignmentSubmit", err);
	});
}

function QuizClientContent() {
	const searchParams = useSearchParams();
	const initialSubject = searchParams.get("subject") || undefined;
	const topic = searchParams.get("topic") || undefined;
	const countParam = searchParams.get("count");
	const questionCount = countParam ? parseInt(countParam, 10) : 20;
	const timeParam = searchParams.get("time");
	const maxTime = timeParam ? parseInt(timeParam, 10) : undefined;
	const pastPaperMode = searchParams.get("pastPaperMode") === "true";
	const assignmentId = searchParams.get("assignmentId") || null;
	const packId = searchParams.get("packId") || null;

	const [packQuestions, setPackQuestions] = useState<Question[] | null>(null);

	useEffect(() => {
		if (!packId) return;
		try {
			const stored = sessionStorage.getItem(`lumni_pack_${packId}`);
			if (stored) {
				setPackQuestions(JSON.parse(stored));
				sessionStorage.removeItem(`lumni_pack_${packId}`);
			}
		} catch (err) {
			logError("PackQuestionLoad", err);
		}
	}, [packId]);

	return (
		<QuizView
			initialSubject={initialSubject}
			topic={topic}
			questionCount={questionCount}
			maxTime={maxTime}
			pastPaperMode={pastPaperMode}
			packQuestions={packQuestions ?? undefined}
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
