"use client";

import {
	ChevronLeft,
	ChevronRight,
	Play,
	Square,
	Target,
	Timer,
	Zap,
} from "lucide-react";
import {
	startTransition,
	useCallback,
	useEffect,
	useState,
	ViewTransition,
} from "react";
import { QuestionCard } from "@/components/questions/question-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useSubjectQuestions } from "@/lib/hooks/use-subject-questions";
import { useUploadStore } from "@/lib/store";
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
	const [isTransitioning, setIsTransitioning] = useState(false);

	const { subjects } = useUploadStore();
	const storeSubjects =
		subjects.length > 0
			? subjects.map((s) => s.displayName)
			: [
					"Random",
					"Physics",
					"Chemistry",
					"Biology",
					"Mathematics",
					"History",
					"Geography",
				];

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

	const handleSubjectSelect = useCallback((value: string) => {
		setSelectedSubject(value);
	}, []);

	const formatTime = useCallback((seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}, []);

	const calculateAccuracy = useCallback(() => {
		if (currentQuestionIndex === 0) return 0;
		return Math.round((correctAnswers / currentQuestionIndex) * 100);
	}, [correctAnswers, currentQuestionIndex]);

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
		if (!questionsToUse) return;

		const maxIndex = questionsToUse.length - 1;
		if (currentQuestionIndex < maxIndex) {
			startTransition(() => {
				setIsTransitioning(true);
				setTimeout(() => {
					setCurrentQuestionIndex((prev) => prev + 1);
					setIsTransitioning(false);
				}, 150);
			});
		} else {
			handleStop();
		}
	}, [questionsToUse, currentQuestionIndex, handleStop]);

	const handlePrevious = useCallback(() => {
		if (currentQuestionIndex > 0) {
			startTransition(() => {
				setIsTransitioning(true);
				setTimeout(() => {
					setCurrentQuestionIndex((prev) => prev - 1);
					setIsTransitioning(false);
				}, 150);
			});
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
		const progressValue =
			((currentQuestionIndex + 1) / (questionsToUse?.length || questionCount)) *
			100;

		return (
			<div className="w-full max-w-2xl px-4 pb-6 space-y-4">
				<div className="animate-fade-in space-y-4">
					<div className="flex items-center justify-between">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleStop}
							className="font-medium hover:text-foreground hover:bg-destructive/10"
						>
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
								{currentQuestionIndex + 1}/
								{questionsToUse?.length || questionCount}
							</Badge>
						</div>
						<div className="flex items-center gap-1.5">
							<Target className="size-3.5 text-green-500" />
							<span className="text-sm font-semibold tabular-nums font-mono text-green-500">
								{calculateAccuracy()}%
							</span>
						</div>
					</div>

					<Progress value={progressValue} className="h-1.5">
						{/* <ProgressIndicator
							className={cn(
								"h-full bg-linear-to-r from-primary to-green-500 transition-all duration-300",
								progressValue === 100 && "to-green-500",
							)}
						/>
						<ProgressValue className="sr-only">{progressValue}</ProgressValue> */}
					</Progress>
				</div>

				<ViewTransition
					default="none"
					enter="vt-slide-up-in"
					exit="vt-slide-down-out"
				>
					<div
						className={cn(
							"transition-all duration-200",
							isTransitioning
								? "opacity-0 translate-x-2"
								: "opacity-100 translate-x-0",
						)}
					>
						<QuestionCard
							key={currentQuestion.id}
							question={currentQuestion}
							questionNumber={currentQuestionIndex + 1}
							totalQuestions={questionsToUse?.length || questionCount}
							onAnswer={handleAnswer}
						/>
					</div>
				</ViewTransition>

				<div
					className={cn(
						"flex items-center justify-between gap-3",
						isTransitioning && "opacity-0",
					)}
				>
					<Button
						variant="outline"
						onClick={handlePrevious}
						disabled={currentQuestionIndex === 0}
						className="gap-2"
					>
						<ChevronLeft className="size-4" />
						Previous
					</Button>
					<Button onClick={handleNext} className="gap-2">
						{questionsToUse && currentQuestionIndex < questionsToUse.length - 1
							? "Next"
							: "Finish"}
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex items-center gap-3 px-6!", className)}>
			<Select
				value={selectedSubject}
				onValueChange={(value) => handleSubjectSelect(value || "Random")}
			>
				<SelectTrigger
					className="w-32 h-9 rounded-full border-muted bg-muted/50"
					disabled={isRunning}
				>
					<SelectValue placeholder="Subject" />
				</SelectTrigger>
				<SelectContent align="center">
					{storeSubjects.map((subject) => (
						<SelectItem key={subject} value={subject}>
							{subject}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<div className="flex items-center gap-3 pl-4 py-2 rounded-full bg-muted/30 border border-muted">
				<div className="flex items-center gap-2 min-w-16">
					<Timer className="size-4 text-muted-foreground" />
					<span className="text-sm font-medium -mb-0.5 tabular-nums font-mono tracking-tight">
						{formatTime(elapsedTime)}
					</span>
				</div>

				<div className="w-px h-4 bg-muted" />

				<div className="flex items-center gap-2 min-w-14">
					<Zap className="size-4 text-yellow-500" />
					<span className="text-sm font-semibold tabular-nums font-mono">
						{points}
					</span>
				</div>
			</div>

			{isRunning ? (
				<Button
					size="icon"
					onClick={handleStop}
					className="size-11 rounded-full bg-destructive hover:bg-destructive/90"
				>
					<Square className="size-4 fill-current" />
				</Button>
			) : (
				<Button
					size="icon"
					onClick={handleStart}
					className="size-11 rounded-full bg-primary hover:bg-primary/90"
				>
					<Play className="size-4 ml-0.5 fill-current" />
				</Button>
			)}
		</div>
	);
}
