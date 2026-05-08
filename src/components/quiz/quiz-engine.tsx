"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizQuestion } from "./quiz-question";
import { QuizResult } from "./quiz-result";

const questionSchema = z.object({
	id: z.string(),
	topicId: z.string(),
	type: z.string(),
	questionText: z.string(),
	options: z.record(z.string(), z.string()).nullable(),
	correctAnswer: z.string(),
	explanation: z.string().nullable(),
	difficulty: z.string(),
	hasImage: z.boolean(),
	imageUrl: z.string().nullable(),
});

interface Question {
	id: string;
	topicId: string;
	type: string;
	questionText: string;
	options: Record<string, string> | null;
	correctAnswer: string;
	explanation: string | null;
	difficulty: "easy" | "medium" | "hard";
	hasImage: boolean;
	imageUrl: string | null;
	topicName?: string;
}

interface QuizEngineProps {
	subjectIds: string[];
	onComplete?: (results: QuizResults) => void;
	userId: string;
}

interface QuizResults {
	totalQuestions: number;
	correctAnswers: number;
	accuracy: number;
	incorrectAnswers: {
		questionId: string;
		selectedAnswer: string;
		correctAnswer: string;
	}[];
}

const difficultyColors = {
	easy: "bg-green-500/20 text-green-500",
	medium: "bg-yellow-500/20 text-yellow-500",
	hard: "bg-red-500/20 text-red-500",
};

async function fetchQuizQuestions(subjectIds: string[]): Promise<Question[]> {
	if (subjectIds.length === 0) return [];
	const params = new URLSearchParams();
	for (const id of subjectIds) {
		params.append("subjectIds", id);
	}
	const response = await fetch(`/api/questions?${params}`);
	if (!response.ok) return [];
	const data = await response.json();
	if (!data.questions) return [];
	return data.questions as Question[];
}

function useQuizQuestions(subjectIds: string[]) {
	return useQuery({
		queryKey: ["quiz-questions", subjectIds],
		queryFn: () => fetchQuizQuestions(subjectIds),
		enabled: subjectIds.length > 0,
		staleTime: 1000 * 60 * 10,
	});
}

export function QuizEngine({
	subjectIds,
	onComplete,
	userId,
}: QuizEngineProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [results, setResults] = useState<QuizResults>({
		totalQuestions: 0,
		correctAnswers: 0,
		accuracy: 0,
		incorrectAnswers: [],
	});

	const { data: rawQuestions, isLoading } = useQuizQuestions(subjectIds);

	const questions = useMemo(() => {
		if (!rawQuestions?.length) return [];
		const validQuestions = rawQuestions
			.map((q) => {
				const parsed = questionSchema.safeParse(q);
				if (!parsed.success) return null;
				return {
					...parsed.data,
					difficulty: parsed.data.difficulty as "easy" | "medium" | "hard",
				};
			})
			.filter((q): q is NonNullable<typeof q> => q !== null);
		return validQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
	}, [rawQuestions]);

	const currentQuestion = questions[currentIndex];

	function handleSelectAnswer(answer: string) {
		if (showFeedback) return;
		setSelectedAnswer(answer);
	}

	function handleNext() {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			setIsComplete(true);
			onComplete?.(results);
		}
	}

	function handleRestart() {
		setCurrentIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setIsComplete(false);
		setResults({
			totalQuestions: 0,
			correctAnswers: 0,
			accuracy: 0,
			incorrectAnswers: [],
		});
	}

	if (isLoading) {
		return (
			<Card className="p-6 space-y-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-5 w-16" />
				</div>
				<Skeleton className="h-6 w-full" />
				<Skeleton className="h-24 w-full rounded-lg" />
				<div className="space-y-2">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton
							key={`skeleton-${i}`}
							className="h-12 w-full rounded-lg"
						/>
					))}
				</div>
			</Card>
		);
	}

	if (questions.length === 0) {
		return (
			<Card className="p-8 flex flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">
					No questions available for this subject.
				</p>
				<p className="text-sm">Select a subject to start practicing.</p>
			</Card>
		);
	}

	if (isComplete) {
		return (
			<QuizResult
				results={results}
				onRestart={handleRestart}
				onClose={() => onComplete?.(results)}
			/>
		);
	}

	return (
		<LazyMotion features={domAnimation}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<Badge variant="outline">
						Question {currentIndex + 1} of {questions.length}
					</Badge>
					{currentQuestion?.difficulty && (
						<Badge className={difficultyColors[currentQuestion.difficulty]}>
							{currentQuestion.difficulty}
						</Badge>
					)}
				</div>

				{currentQuestion && (
					<AnimatePresence mode="wait">
						<m.div
							key={currentQuestion.id}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							<QuizQuestion
								question={currentQuestion}
								selectedAnswer={selectedAnswer}
								showFeedback={showFeedback}
								onSelectAnswer={handleSelectAnswer}
							/>
						</m.div>
					</AnimatePresence>
				)}

				{showFeedback && currentQuestion && (
					<div className="space-y-2">
						<div
							className={`p-4 rounded-lg ${
								selectedAnswer === currentQuestion.correctAnswer
									? "bg-green-500/20 text-green-500"
									: "bg-red-500/20 text-red-500"
							}`}
						>
							{selectedAnswer === currentQuestion.correctAnswer
								? "Correct!"
								: `Incorrect. The correct answer is ${currentQuestion.correctAnswer}`}
						</div>
						{currentQuestion.explanation && (
							<Card className="p-4 bg-muted">
								<p className="text-sm">{currentQuestion.explanation}</p>
							</Card>
						)}
						<Button className="w-full" onClick={handleNext}>
							{currentIndex < questions.length - 1
								? "Next Question"
								: "See Results"}
						</Button>
					</div>
				)}

				<div
					className="flex justify-center gap-1"
					role="tablist"
					aria-label="Question progress"
				>
					{questions.map((q, idx) => (
						<div
							key={q.id || `q-${idx}`}
							role="tab"
							aria-selected={idx === currentIndex}
							className={`h-1.5 w-1.5 rounded-full ${
								idx === currentIndex
									? "bg-primary"
									: idx < currentIndex
										? "bg-primary/50"
										: "bg-muted"
							}`}
						/>
					))}
				</div>
			</div>
		</LazyMotion>
	);
}
