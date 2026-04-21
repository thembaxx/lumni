"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { QAQuestion, QuestionState } from "@/lib/types/questions";
import { cn } from "@/lib/utils";
import { QuestionDiagram } from "./question-diagram";

interface QuestionCardProps {
	question: QAQuestion;
	questionNumber: number;
	totalQuestions: number;
	onAnswer?: (optionId: string, isCorrect: boolean) => void;
}

const difficultyColors = {
	Easy: "bg-green-500/20 text-white border-green-500",
	Medium: "bg-yellow-500/20 text-white border-yellow-500",
	Hard: "bg-red-500/20 text-white border-red-500",
};

export function QuestionCard({
	question,
	questionNumber,
	totalQuestions,
	onAnswer,
}: QuestionCardProps) {
	const [state, setState] = useState<QuestionState>({
		selectedOption: null,
		isCorrect: null,
		showHint: false,
		showExplanation: false,
		isSubmitted: false,
		showDiagram: true,
	});

	const handleSelect = useCallback(
		(optionId: string) => {
			if (state.isSubmitted) return;
			setState((prev) => ({ ...prev, selectedOption: optionId }));
		},
		[state.isSubmitted],
	);

	const handleCheck = useCallback(() => {
		if (!state.selectedOption) return;

		const selectedOption = question.options.find(
			(opt) => opt.id === state.selectedOption,
		);
		const isCorrect = selectedOption?.isCorrect ?? false;

		setState((prev) => ({
			...prev,
			isCorrect,
			showExplanation: true,
			isSubmitted: true,
		}));

		onAnswer?.(state.selectedOption, isCorrect);
	}, [state.selectedOption, question.options, onAnswer]);

	const handleHint = useCallback(() => {
		setState((prev) => ({ ...prev, showHint: !prev.showHint }));
	}, []);

	const handleToggleDiagram = useCallback(() => {
		setState((prev) => ({ ...prev, showDiagram: !prev.showDiagram }));
	}, []);

	const _handleNext = useCallback(() => {
		setState({
			selectedOption: null,
			isCorrect: null,
			showHint: false,
			showExplanation: false,
			isSubmitted: false,
			showDiagram: true,
		});
	}, []);

	return (
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
				<CardTitle className="text-lg leading-relaxed">
					{question.questionText}
				</CardTitle>
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
					{state.showDiagram && <QuestionDiagram diagram={question.diagram} />}
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
					{question.options.map((option) => {
						const isSelected = state.selectedOption === option.id;
						const isCorrectOption = option.isCorrect;
						const showResult = state.isSubmitted;

						let optionClass = "border-muted hover:border-primary/50";

						if (showResult) {
							if (isCorrectOption) {
								optionClass =
									"border-green-500/40 ring-2 ring-green-500 bg-green-500/10 animate-checkmark";
							} else if (isSelected && !isCorrectOption) {
								optionClass = "border-red-500 bg-red-500/10 animate-shake";
							}
						} else if (isSelected) {
							optionClass = "border-primary bg-primary/10";
						}

						return (
							<button
								key={option.id}
								type="button"
								disabled={state.isSubmitted}
								onClick={() => handleSelect(option.id)}
								className={cn(
									"quiz-option-btn flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left",
									"disabled:cursor-not-allowed disabled:opacity-50",
									optionClass,
								)}
							>
								<span
									className={cn(
										"quiz-option-letter flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium",
										isSelected
											? "border-primary bg-primary text-primary-foreground"
											: "border-muted-foreground/30",
									)}
								>
									{option.id}
								</span>
								<span className="flex-1 font-medium">{option.text}</span>
								{showResult && isCorrectOption && (
									<span className="text-green-500">✓</span>
								)}
								{showResult && isSelected && !isCorrectOption && (
									<span className="text-red-500">✗</span>
								)}
							</button>
						);
					})}
				</div>

				{state.showHint && (
					<div className="animate-slide-in-bottom rounded-lg bg-amber-500/3 p-4 text-amber-700">
						<p className="font-medium">Hint:</p>
						<p>{question.hint}</p>
					</div>
				)}

				{state.showExplanation && (
					<div
						className={cn(
							"animate-scale-in rounded-lg p-4",
							state.isCorrect
								? "bg-green-500/10 text-green-700 animate-correct-pulse"
								: "bg-red-500/10 text-red-700",
						)}
					>
						<p className="font-medium">
							{state.isCorrect ? "Correct!" : "Incorrect"}
						</p>
						<p>{question.explanation}</p>
					</div>
				)}
			</CardContent>

			<CardFooter className="flex gap-3">
				<Button
					onClick={handleCheck}
					disabled={!state.selectedOption || state.isSubmitted}
					className="flex-1"
					// disableRipple={state.isSubmitted}
				>
					{state.isSubmitted
						? state.isCorrect
							? "✓ Correct!"
							: "✗ Try Again"
						: "Check Answer"}
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
	);
}
