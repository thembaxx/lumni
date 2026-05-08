"use client";

import { CancelIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { MinusIcon, PlusIcon, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { Confetti, XPGainPopup } from "@/components/celebration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { QAQuestion, QuestionState } from "@/types/questions";
import { QuestionDiagram } from "./question-diagram";

interface QuestionCardProps {
	question: QAQuestion;
	questionNumber?: number;
	totalQuestions?: number;
	selectedAnswer?: string | null;
	showFeedback?: boolean;
	onSelectAnswer?: (optionId: string) => void;
	onAnswer?: (optionId: string, isCorrect: boolean) => void;
}

const difficultyColors = {
	Easy: "bg-success/20 text-success border-success",
	Medium: "bg-warning/20 text-warning border-warning",
	Hard: "bg-destructive/20 text-destructive border-destructive",
};

export function QuestionCard({
	question,
	questionNumber,
	totalQuestions,
	selectedAnswer: externalSelectedAnswer,
	showFeedback: externalShowFeedback,
	onSelectAnswer,
	onAnswer,
}: QuestionCardProps) {
	const [internalState, setInternalState] = useState<QuestionState>({
		selectedOption: null,
		isCorrect: null,
		showHint: false,
		showExplanation: false,
		isSubmitted: false,
		showDiagram: true,
	});

	const [showConfetti, setShowConfetti] = useState(false);
	const [showXPGain, setShowXPGain] = useState(false);

	const isControlled = externalSelectedAnswer !== undefined;
	const selectedOption = isControlled
		? externalSelectedAnswer
		: internalState.selectedOption;
	const showFeedback = isControlled
		? externalShowFeedback
		: internalState.isSubmitted;

	const state = isControlled
		? { ...internalState, isSubmitted: externalShowFeedback ?? false }
		: internalState;

	const handleSelect = useCallback(
		(optionId: string) => {
			if (showFeedback) return;
			if (onSelectAnswer) {
				onSelectAnswer(optionId);
			} else {
				setInternalState((prev) => ({ ...prev, selectedOption: optionId }));
			}
		},
		[showFeedback, onSelectAnswer],
	);

	const handleCheck = useCallback(() => {
		if (!selectedOption) return;

		const selectedOpt = question.options.find(
			(opt) => opt.id === selectedOption,
		);
		const isCorrect = selectedOpt?.isCorrect ?? false;

		setInternalState((prev) => ({
			...prev,
			isCorrect,
			showExplanation: true,
			isSubmitted: true,
		}));

		if (isCorrect) {
			setShowConfetti(true);
			setShowXPGain(true);
			setTimeout(() => setShowConfetti(false), 2000);
			setTimeout(() => setShowXPGain(false), 1500);
		}

		onAnswer?.(selectedOption, isCorrect);
	}, [selectedOption, question.options, onAnswer]);

	const handleHint = useCallback(() => {
		setInternalState((prev) => ({ ...prev, showHint: !prev.showHint }));
	}, []);

	const handleToggleDiagram = useCallback(() => {
		setInternalState((prev) => ({ ...prev, showDiagram: !prev.showDiagram }));
	}, []);

	const _handleNext = useCallback(() => {
		setInternalState({
			selectedOption: null,
			isCorrect: null,
			showHint: false,
			showExplanation: false,
			isSubmitted: false,
			showDiagram: true,
		});
	}, []);

	return (
		<LazyMotion features={domAnimation}>
			<Confetti trigger={showConfetti} count={30} duration={1500} />
			<XPGainPopup amount={15} visible={showXPGain} />
			<Card className="w-full max-w-2xl">
				<CardHeader className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="bg-primary/10 font-medium">
								<p className="opacity-80">{question.topic}</p>
							</Badge>
							<Badge
								variant="outline"
								className={cn(
									"border font-mono font-medium text-xs",
									difficultyColors[question.difficulty],
								)}
							>
								{question.difficulty}
							</Badge>
						</div>
						<Badge variant="secondary" className="text-xs">
							{question.points} pts
						</Badge>
					</div>
					<div
						className={cn(
							"overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent",
							question.questionText.length > 500 && "scrollbar-thin",
						)}
					>
						<CardTitle className="text-lg leading-relaxed whitespace-pre-wrap">
							{question.questionText}
						</CardTitle>
					</div>
				</CardHeader>

				{question.supportsDiagram && question.diagram && (
					<CardContent>
						<div className="flex items-center justify-between">
							<p className="text-xs font-medium text-muted-foreground">
								{question.diagram?.title}
							</p>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleToggleDiagram}
								className="h-8 gap-1 px-2"
							>
								{state.showDiagram ? (
									<>
										<MinusIcon className="h-4 w-4" />
										<span className="text-xs">Hide</span>
									</>
								) : (
									<>
										<PlusIcon className="h-4 w-4" />
										<span className="text-xs">Show</span>
									</>
								)}
							</Button>
						</div>
						{state.showDiagram && (
							<QuestionDiagram diagram={question.diagram} />
						)}
					</CardContent>
				)}

				<CardContent className="space-y-3">
					<div
						className={cn(
							"grid gap-2",
							question.options.every((opt) => opt.text.length <= 30)
								? "grid-cols-2"
								: "grid-cols-1",
						)}
					>
						{question.options.map((option, optionIndex) => {
							const isSelected = selectedOption === option.id;
							const isCorrectOption = option.isCorrect;
							const showResult = showFeedback;

							let optionClass = "border-muted hover:border-primary/50";

							if (showResult) {
								if (isCorrectOption) {
									optionClass =
										"border-success/40 ring-2 ring-success bg-success/10 animate-checkmark";
								} else if (isSelected && !isCorrectOption) {
									optionClass =
										"border-destructive bg-destructive/10 animate-shake";
								}
							} else if (isSelected) {
								optionClass = "border-primary bg-primary/10";
							}

							return (
								<m.button
									key={option.id}
									type="button"
									disabled={state.isSubmitted}
									onClick={() => handleSelect(option.id)}
									className={cn(
										"quiz-option-btn flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left",
										"disabled:cursor-not-allowed disabled:opacity-50",
										optionClass,
									)}
									initial={{ opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: optionIndex * 0.05 }}
								>
									<m.span
										className={cn(
											"quiz-option-letter flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium",
											isSelected
												? "border-primary bg-primary text-primary-foreground"
												: "border-muted-foreground/30",
										)}
									>
										{option.id}
									</m.span>
									<span className="flex-1 font-medium">{option.text}</span>
									{showResult && isCorrectOption && (
										<HugeiconsIcon
											icon={CheckmarkCircle02Icon}
											className="w-5 h-5 text-success"
										/>
									)}
									{showResult && isSelected && !isCorrectOption && (
										<HugeiconsIcon
											icon={CancelIcon}
											className="w-5 h-5 text-destructive"
										/>
									)}
								</m.button>
							);
						})}
					</div>

					<AnimatePresence>
						{state.showHint && (
							<m.div
								key="hint"
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: "auto" }}
								exit={{ opacity: 0, height: 0 }}
								className="overflow-hidden rounded-lg bg-warning/5 p-4 text-warning"
							>
								<p className="font-medium">Hint:</p>
								<p>{question.hint}</p>
							</m.div>
						)}
					</AnimatePresence>

					<AnimatePresence>
						{state.showExplanation && (
							<m.div
								key="explanation"
								initial={{ opacity: 0, scale: 0.95, y: -8 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: -8 }}
								className={cn(
									"rounded-lg p-4",
									state.isCorrect
										? "bg-success/10 text-success"
										: "bg-destructive/10 text-destructive",
								)}
							>
								<p className="font-medium">
									{state.isCorrect ? "Correct!" : "Incorrect"}
								</p>
								<p>{question.explanation}</p>
							</m.div>
						)}
					</AnimatePresence>
				</CardContent>

				<CardFooter className="flex gap-3">
					<Button
						onClick={handleCheck}
						disabled={!selectedOption}
						className="flex-1"
					>
						{showFeedback ? (
							selectedOption &&
							question.options.find((o) => o.id === selectedOption)
								?.isCorrect ? (
								<>
									<HugeiconsIcon
										icon={CheckmarkCircle02Icon}
										className="w-4 h-4 mr-1"
									/>
									Correct!
								</>
							) : (
								<>
									<HugeiconsIcon icon={CancelIcon} className="w-4 h-4 mr-1" />
									Try Again
								</>
							)
						) : (
							"Check Answer"
						)}
					</Button>
					<Button
						variant="outline"
						onClick={handleHint}
						className={cn("gap-2", state.showHint && "animate-icon-pop")}
					>
						<MinusIcon
							className={cn(
								"h-4 w-4 transition-transform duration-200",
								state.showHint && "rotate-180",
							)}
						/>
						Hint
					</Button>
				</CardFooter>
			</Card>
		</LazyMotion>
	);
}
