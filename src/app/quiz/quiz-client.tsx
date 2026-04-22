"use client";

import {
	ChevronLeft,
	ChevronRight,
	Home,
	RotateCcw,
	Target,
	Timer,
	Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { QuestionCard } from "@/components/questions/question-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { useSubjectQuestions } from "@/lib/hooks/use-subject-questions";
import type { QAQuestion } from "@/lib/types/questions";
import { cn } from "@/lib/utils";

const QUIZ_SIZE = 10;

interface QuizResults {
	questionId: string;
	selectedAnswer: string;
	isCorrect: boolean;
}

export function QuizClient() {
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [isQuizActive, setIsQuizActive] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showFeedback, setShowFeedback] = useState(false);
	const [results, setResults] = useState<QuizResults[]>([]);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [_isTimerRunning, setIsTimerRunning] = useState(false);

	const subjectToFetch = selectedSubject.toLowerCase();

	const { data: questions, isLoading } = useSubjectQuestions(
		subjectToFetch,
		QUIZ_SIZE,
		{
			enabled: isQuizActive && !!selectedSubject,
		},
	);

	const questionsToUse =
		isLoading === false && questions?.length ? questions : [];
	const currentQuestion = questionsToUse[currentQuestionIndex];

	const _startQuiz = useCallback(() => {
		setIsQuizActive(true);
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setResults([]);
		setElapsedTime(0);
		setIsTimerRunning(true);
	}, []);

	const stopQuiz = useCallback(() => {
		setIsQuizActive(false);
		setIsTimerRunning(false);
	}, []);

	const handleStart = useCallback((subject: string) => {
		setSelectedSubject(subject);
		setIsQuizActive(true);
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setResults([]);
		setElapsedTime(0);
		setIsTimerRunning(true);
	}, []);

	const handleSelectAnswer = useCallback(
		(answerId: string) => {
			if (showFeedback) return;
			setSelectedAnswer(answerId);
		},
		[showFeedback],
	);

	// const handleSubmit = useCallback(() => {
	// 	if (!selectedAnswer || !currentQuestion) return;

	// 	const selectedOption = currentQuestion.options.find(
	// 		(o) => o.id === selectedAnswer,
	// 	);
	// 	const isCorrect = selectedOption?.isCorrect || false;

	// 	setResults((prev) => [
	// 		...prev,
	// 		{
	// 			questionId: currentQuestion.id,
	// 			selectedAnswer,
	// 			isCorrect,
	// 		},
	// 	]);
	// 	setShowFeedback(true);
	// }, [selectedAnswer, currentQuestion]);

	const handleNext = useCallback(() => {
		if (currentQuestionIndex < questionsToUse.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
			setSelectedAnswer(null);
			setShowFeedback(false);
		} else {
			stopQuiz();
		}
	}, [currentQuestionIndex, questionsToUse.length, stopQuiz]);

	// const _handlePrevious = useCallback(() => {
	// 	if (currentQuestionIndex > 0) {
	// 		setCurrentQuestionIndex((prev) => prev - 1);
	// 		setSelectedAnswer(null);
	// 		setShowFeedback(false);
	// 	}
	// }, [currentQuestionIndex]);

	const handleRestart = useCallback(() => {
		setCurrentQuestionIndex(0);
		setSelectedAnswer(null);
		setShowFeedback(false);
		setResults([]);
		setElapsedTime(0);
		setIsTimerRunning(true);
	}, []);

	const formatTime = useCallback((seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}, []);

	const correctCount = results.filter((r) => r.isCorrect).length;
	const accuracy =
		results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
	const progressValue =
		((currentQuestionIndex + 1) / questionsToUse.length) * 100;

	if (!isQuizActive) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Quiz Practice</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Target className="size-8" />
								</EmptyMedia>
								<EmptyTitle>Start a Quiz</EmptyTitle>
								<EmptyDescription>
									Select a subject to begin practicing
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<SubjectsDrawer onSelect={handleStart}>
									<Button>Choose Subject</Button>
								</SubjectsDrawer>
							</EmptyContent>
						</Empty>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (results.length === questionsToUse.length && questionsToUse.length > 0) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle>Quiz Complete!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-4 text-center">
							<div className="p-4 rounded-lg bg-muted">
								<p className="text-2xl font-bold">{results.length}</p>
								<p className="text-xs text-muted-foreground">Questions</p>
							</div>
							<div className="p-4 rounded-lg bg-muted">
								<p className="text-2xl font-bold text-green-500">
									{correctCount}
								</p>
								<p className="text-xs text-muted-foreground">Correct</p>
							</div>
							<div className="p-4 rounded-lg bg-muted">
								<p className="text-2xl font-bold">{accuracy}%</p>
								<p className="text-xs text-muted-foreground">Accuracy</p>
							</div>
						</div>
						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<Timer className="size-4" />
							<span className="text-sm">{formatTime(elapsedTime)}</span>
						</div>
						<div className="flex gap-2">
							<Button variant="outline" className="flex-1" onClick={stopQuiz}>
								<Home className="size-4 mr-2" />
								Dashboard
							</Button>
							<Button className="flex-1" onClick={handleRestart}>
								<RotateCcw className="size-4 mr-2" />
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardContent className="p-8 text-center">
						<p className="text-muted-foreground">Loading questions...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (questionsToUse.length === 0) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle>No Questions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No questions found</EmptyTitle>
								<EmptyDescription>
									Upload questions for {selectedSubject} to start practicing
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
						<Button variant="outline" className="w-full" onClick={stopQuiz}>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 space-y-4">
			<div className="flex items-center justify-between">
				<Button variant="ghost" size="sm" onClick={stopQuiz}>
					Quit
				</Button>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50">
						<Timer className="size-3.5 text-muted-foreground" />
						<span className="text-sm font-medium tabular-nums font-mono">
							{formatTime(elapsedTime)}
						</span>
					</div>
					<span className="text-muted-foreground">|</span>
					<Badge variant="secondary" className="font-mono">
						{currentQuestionIndex + 1}/{questionsToUse.length}
					</Badge>
					<span className="text-muted-foreground">|</span>
					<div className="flex items-center gap-1.5">
						<Target className="size-3.5 text-green-500" />
						<span className="text-sm font-semibold tabular-nums font-mono text-green-500">
							{accuracy}%
						</span>
					</div>
				</div>
			</div>

			<Progress value={progressValue} className="h-1.5" />

			<QuestionCard
				question={currentQuestion}
				questionNumber={currentQuestionIndex + 1}
				totalQuestions={questionsToUse.length}
				selectedAnswer={selectedAnswer}
				showFeedback={showFeedback}
				onSelectAnswer={handleSelectAnswer}
			/>

			{showFeedback && (
				<div className="space-y-2">
					<div
						className={cn(
							"p-4 rounded-lg text-center font-medium",
							results[currentQuestionIndex]?.isCorrect
								? "bg-green-500/20 text-green-500"
								: "bg-red-500/20 text-red-500",
						)}
					>
						{results[currentQuestionIndex]?.isCorrect
							? "Correct!"
							: "Incorrect"}
					</div>
					{currentQuestion.explanation && (
						<Card className="p-4 bg-muted">
							<p className="text-sm">{currentQuestion.explanation}</p>
						</Card>
					)}
					<Button className="w-full" onClick={handleNext}>
						{currentQuestionIndex < questionsToUse.length - 1
							? "Next Question"
							: "See Results"}
					</Button>
				</div>
			)}

			<div className="flex justify-center gap-1">
				{questionsToUse.map((_, idx) => (
					<div
						key={idx}
						className={cn(
							"h-1.5 w-1.5 rounded-full",
							idx === currentQuestionIndex
								? "bg-primary"
								: idx < currentQuestionIndex
									? results[idx]?.isCorrect
										? "bg-green-500"
										: "bg-red-500"
									: "bg-muted",
						)}
					/>
				))}
			</div>
		</div>
	);
}
