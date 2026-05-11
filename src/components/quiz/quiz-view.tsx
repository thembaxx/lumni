"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	EmptyStateWithIllustration,
	QuestionCard,
	QuizControls,
	QuizEmptyState,
	QuizHeader,
	QuizResultsCard,
	QuizSelectSubject,
	QuizSubjectPrompt,
} from "@/components/quiz";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { Question } from "@/types/questions";

export type QuizViewVariant = "full" | "compact";

export interface QuizViewProps {
	variant?: QuizViewVariant;
	initialSubject?: string;
	topic?: string;
	questionCount?: number;
	maxTime?: number;
	onQuit?: () => void;
	onFinish?: (results: { correctAnswers: number; elapsedTime: number }) => void;
	className?: string;
}

export function QuizView({
	variant = "full",
	initialSubject,
	topic,
	questionCount = 10,
	maxTime = 90 * 60,
	onQuit,
	onFinish,
	className,
}: QuizViewProps) {
	const [selectedSubject, setSelectedSubject] = useState(initialSubject ?? "");
	const [sessionActive, setSessionActive] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [totalAnswered, setTotalAnswered] = useState(0);
	const [currentAnswered, setCurrentAnswered] = useState(false);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isComplete, setIsComplete] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const engineParams = useMemo(
		() => ({
			subject: selectedSubject.toLowerCase(),
			topic,
			count: questionCount,
			questionType: "any" as const,
		}),
		[selectedSubject, topic, questionCount],
	);

	const { questions, isLoading, isError, error } = useQuestionEngine(engineParams, {
		enabled: sessionActive && !!selectedSubject,
	});

	const currentQuestion = questions?.[currentIndex] ?? null;
	const totalQuestions = questions?.length ?? questionCount;

	const handleStartWithSubject = useCallback((subject: string) => {
		setSelectedSubject(subject);
		setSessionActive(true);
		setCurrentIndex(0);
		setCorrectAnswers(0);
		setTotalAnswered(0);
		setCurrentAnswered(false);
		setElapsedTime(0);
		setIsComplete(false);
		setLoadError(null);
	}, []);

	const handleStop = useCallback(() => {
		setSessionActive(false);
		if (timerRef.current) clearInterval(timerRef.current);
		onFinish?.({ correctAnswers, elapsedTime });
	}, [onFinish, correctAnswers, elapsedTime]);

	const handleRestart = useCallback(() => {
		setCurrentIndex(0);
		setCorrectAnswers(0);
		setTotalAnswered(0);
		setElapsedTime(0);
		setIsComplete(false);
	}, []);

	const handleNext = useCallback(() => {
		if (currentIndex < totalQuestions - 1) {
			setCurrentIndex((prev) => prev + 1);
			setCurrentAnswered(false);
		} else {
			setIsComplete(true);
			if (timerRef.current) clearInterval(timerRef.current);
			onFinish?.({ correctAnswers, elapsedTime });
		}
	}, [currentIndex, totalQuestions, onFinish, correctAnswers, elapsedTime]);

	const handlePrevious = useCallback(() => {
		if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
		setCurrentAnswered(false);
	}, [currentIndex]);

	const handleSkip = useCallback(() => {
		handleNext();
	}, [handleNext]);

	const handleAnswered = useCallback((correct: boolean) => {
		setCurrentAnswered(true);
		setTotalAnswered((prev) => prev + 1);
		if (correct) setCorrectAnswers((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (sessionActive && questions.length > 0) {
			if (timerRef.current) clearInterval(timerRef.current);
			timerRef.current = setInterval(() => {
				setElapsedTime((prev) => {
					if (prev >= maxTime) {
						if (timerRef.current) clearInterval(timerRef.current);
						setIsComplete(true);
						return prev;
					}
					return prev + 1;
				});
			}, 1000);
		}
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [sessionActive, questions.length, maxTime]);

	if (loadError) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardHeader className="text-center">
						<CardTitle>Unable to Load</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<EmptyStateWithIllustration
							animation="error"
							title="Unable to Load Questions"
							description={loadError}
							action={{ label: "Try Again", onClick: () => { setLoadError(null); window.location.reload(); } }}
							secondaryAction={{ label: "Go Back", onClick: handleStop }}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!sessionActive || !selectedSubject) {
		if (variant === "compact") {
			return <QuizSubjectPrompt onSelect={() => handleStartWithSubject("")} hasSubject={false} />;
		}
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardHeader className="text-center">
						<CardTitle className="ios-title-2">Quiz Practice</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<QuizSelectSubject onSelect={(s) => handleStartWithSubject(s)} />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardContent className="p-8 text-center">
						<p className="text-muted-foreground">Loading questions...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardHeader className="text-center">
						<CardTitle>Unable to Load Questions</CardTitle>
					</CardHeader>
					<CardContent>
						<QuizEmptyState variant="no-questions" subject={selectedSubject} onBack={handleStop} />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<Card className="max-w-md w-full card-elevated">
					<CardHeader className="text-center">
						<CardTitle>No Questions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<QuizEmptyState variant="no-questions" subject={selectedSubject} onBack={handleStop} />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isComplete) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center pb-20">
				<QuizResultsCard
					totalQuestions={totalQuestions}
					correctAnswers={correctAnswers}
					elapsedTime={elapsedTime}
					onRestart={handleRestart}
					onDashboard={handleStop}
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 space-y-6 pb-20 max-w-md mx-auto">
			<QuizHeader
				elapsedTime={elapsedTime}
				currentQuestionIndex={currentIndex}
				totalQuestions={totalQuestions}
				correctAnswers={correctAnswers}
				onQuit={handleStop}
			/>

			{currentQuestion && (
				<QuestionCard
					question={currentQuestion}
					subject={selectedSubject}
					questionNumber={currentIndex + 1}
					totalQuestions={totalQuestions}
					onNext={handleNext}
					onAnswered={handleAnswered}
				/>
			)}

			<QuizControls
				currentQuestionIndex={currentIndex}
				totalQuestions={totalQuestions}
				hasSelected={currentAnswered}
				showFeedback={currentAnswered}
				onPrevious={handlePrevious}
				onNext={handleNext}
				onSkip={handleSkip}
				showSkip={variant === "full" && !currentAnswered}
			/>

			<ProgressDots total={totalQuestions} currentIndex={currentIndex} variant="quiz" />
		</div>
	);
}
