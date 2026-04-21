"use client";

import { ChevronLeft, ChevronRight, Play, Square } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { QuestionCard } from "@/components/questions/question-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubjectQuestions } from "@/lib/hooks/use-subject-questions";
import type { QAQuestion } from "@/lib/types/questions";
import { cn } from "@/lib/utils";

const MAX_TIME = 90 * 60;

const DEMO_QUESTIONS: QAQuestion[] = [
	{
		id: "demo_001",
		topic: "Newton's Laws",
		difficulty: "Easy",
		points: 10,
		questionText:
			"A 5 kg box is pushed with 20 N force. What is the acceleration?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "4 m/s²", isCorrect: true },
			{ id: "B", text: "2 m/s²", isCorrect: false },
			{ id: "C", text: "10 m/s²", isCorrect: false },
			{ id: "D", text: "100 m/s²", isCorrect: false },
		],
		supportsDiagram: true,
		diagram: {
			type: "force-vector",
			title: "Box on Surface",
			data: {
				objects: [
					{
						type: "rectangle",
						x: 100,
						y: 100,
						width: 80,
						height: 50,
						fill: "#6366f1",
						label: "5 kg",
					},
				],
				showForces: [
					{
						label: "F = 20N",
						direction: "right",
						color: "#3b82f6",
						origin: "center-right",
					},
				],
			},
		},
		hint: "Use F = ma → a = F/m",
		explanation: "a = 20N / 5kg = 4 m/s²",
	},
	{
		id: "demo_002",
		topic: "Momentum",
		difficulty: "Easy",
		points: 10,
		questionText: "A 4 kg ball moves at 3 m/s. What is its momentum?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "12 kg·m/s", isCorrect: true },
			{ id: "B", text: "7 kg·m/s", isCorrect: false },
			{ id: "C", text: "1.33 kg·m/s", isCorrect: false },
			{ id: "D", text: "0.75 kg·m/s", isCorrect: false },
		],
		supportsDiagram: false,
		diagram: null,
		hint: "p = mv",
		explanation: "p = 4 × 3 = 12 kg·m/s",
	},
	{
		id: "demo_003",
		topic: "Work & Energy",
		difficulty: "Easy",
		points: 10,
		questionText: "A force of 50 N moves an object 4 m. How much work is done?",
		questionType: "multiple-choice",
		options: [
			{ id: "A", text: "200 J", isCorrect: true },
			{ id: "B", text: "12.5 J", isCorrect: false },
			{ id: "C", text: "54 J", isCorrect: false },
			{ id: "D", text: "2000 J", isCorrect: false },
		],
		supportsDiagram: false,
		diagram: null,
		hint: "W = F × Δx",
		explanation: "W = 50 × 4 = 200 J",
	},
];

interface QuizTabProps {
	className?: string;
	onHeaderChange?: (show: boolean) => void;
}

export function QuizTab({ className, onHeaderChange }: QuizTabProps) {
	const [selectedSubject, setSelectedSubject] = useState<string>("Random");
	const [elapsedTime, setElapsedTime] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [points, setPoints] = useState(() => Math.floor(Math.random() * 101));
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [correctAnswers, setCorrectAnswers] = useState(0);
	const [questionCount] = useState(10);

	const subjectToFetch =
		selectedSubject === "Random" ? "physics" : selectedSubject.toLowerCase();

	const { data: questions, isLoading } = useSubjectQuestions(
		subjectToFetch,
		questionCount,
		{
			enabled: isRunning,
		},
	);

	const questionsToUse =
		isLoading === false && questions?.length ? questions : DEMO_QUESTIONS;
	const currentQuestion = questionsToUse?.[currentQuestionIndex];

	const handleSubjectSelect = useCallback((subject: string) => {
		setSelectedSubject(subject);
	}, []);

	const formatTime = useCallback((seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}, []);

	const generatePoints = useCallback(() => {
		return Math.floor(Math.random() * 101);
	}, []);

	const handleStart = useCallback(() => {
		setIsRunning(true);
		setCurrentQuestionIndex(0);
		setCorrectAnswers(0);
		onHeaderChange?.(false);
	}, [onHeaderChange]);

	const handleStop = useCallback(() => {
		setIsRunning(false);
		setElapsedTime(0);
		setPoints(generatePoints());
		onHeaderChange?.(true);
	}, [generatePoints, onHeaderChange]);

	const handleAnswer = useCallback((_optionId: string, isCorrect: boolean) => {
		if (isCorrect) {
			setCorrectAnswers((prev) => prev + 1);
		}
	}, []);

	const handleNext = useCallback(() => {
		if (questionsToUse && currentQuestionIndex < questionsToUse.length - 1) {
			setCurrentQuestionIndex((prev) => prev + 1);
		} else {
			handleStop();
		}
	}, [questionsToUse, currentQuestionIndex, handleStop]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			setCurrentQuestionIndex((prev) => prev - 1);
		}
	}, [currentQuestionIndex]);

	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (isRunning && elapsedTime < MAX_TIME) {
			interval = setInterval(() => {
				setElapsedTime((prev) => {
					if (prev >= MAX_TIME) {
						setIsRunning(false);
						onHeaderChange?.(true);
						return MAX_TIME;
					}
					return prev + 1;
				});
			}, 1000);
		}

		return () => clearInterval(interval);
	}, [isRunning, elapsedTime, onHeaderChange]);

	if (isRunning && currentQuestion) {
		return (
			<div className="w-full max-w-2xl px-4 pb-6 space-y-6">
				<div className="flex items-center justify-between">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleStop}
						className="text-muted-foreground"
					>
						Quit
					</Button>
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium tabular-nums">
							{formatTime(elapsedTime)}
						</span>
						<span className="text-muted-foreground">|</span>
						<Badge variant="secondary">
							{currentQuestionIndex + 1}/
							{questionsToUse?.length || questionCount}
						</Badge>
					</div>
					<Badge variant="outline" className="text-green-600">
						{correctAnswers} pts
					</Badge>
				</div>

				<QuestionCard
					question={currentQuestion}
					questionNumber={currentQuestionIndex + 1}
					totalQuestions={questionsToUse?.length || questionCount}
					onAnswer={handleAnswer}
				/>

				<div className="flex items-center justify-between">
					<Button
						variant="outline"
						onClick={handlePrevious}
						disabled={currentQuestionIndex === 0}
					>
						<ChevronLeft className="size-4 mr-1" />
						Previous
					</Button>
					<Button onClick={handleNext}>
						{currentQuestionIndex < (questions?.length || questionCount) - 1
							? "Next"
							: "Finish"}
						<ChevronRight className="size-4 ml-1" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex items-center gap-4", className)}>
			<div className="flex items-center justify-between gap-6 w-full max-w-md px-2 py-2 rounded-full bg-secondary/40 border border-muted">
				<SubjectsDrawer onSelect={handleSubjectSelect}>
					<Button
						variant="ghost"
						className="w-28 h-9 rounded-full text-xs font-normal border bg-zinc-700"
						disabled={isRunning}
					>
						<p className="grow truncate">{selectedSubject}</p>
					</Button>
				</SubjectsDrawer>

				<div className="flex items-center gap-2">
					<span className="text-lg font-semibold tabular-nums tracking-tight font-mono min-w-14 text-center">
						{formatTime(elapsedTime)}
					</span>
				</div>

				<div className="flex items-center gap-3">
					<span className="text-xs font-medium tabular-nums min-w-12 text-center">
						{points} pts
					</span>
				</div>
			</div>
			{isRunning ? (
				<Button
					size="icon"
					onClick={handleStop}
					className="size-11 rounded-full"
				>
					<Square className="size-4 fill-current" />
				</Button>
			) : (
				<Button
					size="icon"
					onClick={handleStart}
					className="size-11 rounded-full"
				>
					<Play className="size-4 ml-0.5 fill-current" />
				</Button>
			)}
		</div>
	);
}
