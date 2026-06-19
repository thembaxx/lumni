"use client";

import {
	Cancel01Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/shared";

export interface ComprehensionQuestion {
	id: string;
	questionText: string;
	questionType: "mcq" | "short-answer";
	options?: string[];
	correctAnswer: string;
	explanation: string;
}

interface ComprehensionQuestionCardProps {
	question: ComprehensionQuestion;
	questionNumber: number;
	onGraded?: (score: number) => void;
}

function normalize(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function fuzzyMatch(answer: string, acceptable: string[]): boolean {
	const normAnswer = normalize(answer);
	if (normAnswer.length < 3) return false;
	return acceptable.some((a) => {
		const normA = normalize(a);
		if (normA === normAnswer) return true;
		if (normA.includes(normAnswer) || normAnswer.includes(normA)) return true;
		const words = normA.split(" ");
		const matched = words.filter((w) => normAnswer.includes(w));
		return matched.length >= Math.ceil(words.length * 0.6);
	});
}

export function ComprehensionQuestionCard({
	question,
	questionNumber,
	onGraded,
}: ComprehensionQuestionCardProps) {
	const [selectedOption, setSelectedOption] = useState<string | null>(null);
	const [textInput, setTextInput] = useState("");
	const [isGraded, setIsGraded] = useState(false);
	const [isCorrect, setIsCorrect] = useState(false);
	const [score, setScore] = useState(0);

	const handleMCQSubmit = useCallback(() => {
		if (!selectedOption) return;
		const correct = selectedOption === question.correctAnswer;
		const s = correct ? 100 : 0;
		setIsCorrect(correct);
		setScore(s);
		setIsGraded(true);
		onGraded?.(s);
	}, [selectedOption, question.correctAnswer, onGraded]);

	const handleShortAnswerSubmit = useCallback(() => {
		const text = textInput.trim();
		if (!text) return;
		const correct = fuzzyMatch(text, [question.correctAnswer]);
		const s = correct ? 100 : 0;
		setIsCorrect(correct);
		setScore(s);
		setIsGraded(true);
		onGraded?.(s);
	}, [textInput, question.correctAnswer, onGraded]);

	const isMCQ = question.questionType === "mcq";

	return (
		<m.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card
				className={cn(
					"overflow-hidden rounded-2xl border shadow-sm transition-[border-color] duration-300",
					isGraded &&
						(isCorrect
							? "border-success/30 bg-success/5"
							: "border-destructive/30 bg-destructive/5"),
				)}
			>
				<CardHeader className="pb-3">
					<div className="flex items-start gap-3">
						<span className="text flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-xs tabular-nums">
							{questionNumber}
						</span>
						<CardTitle className="font-semibold text-sm leading-relaxed">
							<MarkdownRenderer content={question.questionText} />
						</CardTitle>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 px-5 pt-0 pb-5">
					{isMCQ && question.options && (
						<div className="flex flex-col gap-2">
							{question.options.map((option) => {
								const isSelected = selectedOption === option;
								const showResult = isGraded;
								const isOptionCorrect = option === question.correctAnswer;
								return (
									<button
										key={option}
										type="button"
										disabled={isGraded}
										onClick={() => setSelectedOption(option)}
										className={cn(
											"flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
											!showResult &&
												isSelected &&
												"border-[--system-accent] bg-[--system-accent]/5",
											!showResult && !isSelected && "hover:bg-muted/50",
											showResult &&
												isOptionCorrect &&
												"border-success/30 bg-success/10",
											showResult &&
												isSelected &&
												!isOptionCorrect &&
												"border-destructive/30 bg-destructive/10",
											!showResult && !isSelected && "border-border",
										)}
									>
										{showResult ? (
											<HugeiconsIcon
												icon={
													isOptionCorrect
														? CheckmarkCircle01Icon
														: isSelected
															? Cancel01Icon
															: CheckmarkCircle01Icon
												}
												className={cn(
													"size-4 shrink-0",
													isOptionCorrect
														? "text-success"
														: isSelected
															? "text-destructive"
															: "text-muted-foreground/30",
												)}
											/>
										) : (
											<span
												className={cn(
													"flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
													isSelected
														? "border-[--system-accent] bg-[--system-accent] text-white"
														: "border-muted-foreground/30",
												)}
											>
												{isSelected ? "✓" : ""}
											</span>
										)}
										<span className="leading-relaxed">{option}</span>
									</button>
								);
							})}
							{!isGraded && (
								<Button
									size="sm"
									disabled={!selectedOption}
									onClick={handleMCQSubmit}
									className="mt-1 self-start rounded-full"
								>
									Submit Answer
								</Button>
							)}
						</div>
					)}

					{!isMCQ && (
						<div className="flex flex-col gap-2">
							<Textarea
								value={textInput}
								onChange={(e) => setTextInput(e.target.value)}
								disabled={isGraded}
								placeholder="Type your answer..."
								className="min-h-[80px] resize-none rounded-xl text-sm"
								aria-label={`Answer for question ${questionNumber}`}
							/>
							{!isGraded && (
								<Button
									size="sm"
									disabled={!textInput.trim()}
									onClick={handleShortAnswerSubmit}
									className="self-start rounded-full"
								>
									Submit Answer
								</Button>
							)}
						</div>
					)}

					{isGraded && (
						<m.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							transition={{ duration: 0.3 }}
							className="overflow-hidden"
						>
							<div
								className={cn(
									"flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-sm",
									isCorrect
										? "bg-success/10 text-success"
										: "bg-destructive/10 text-destructive",
								)}
							>
								<HugeiconsIcon
									icon={isCorrect ? CheckmarkCircle01Icon : Cancel01Icon}
									className="size-4 shrink-0"
								/>
								{isCorrect ? "Correct!" : "Incorrect"}
								<span className="ml-auto text-xs tabular-nums">{score}%</span>
							</div>

							{question.explanation && (
								<div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
									<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
										Explanation
									</span>
									<p className="mt-1">
										<MarkdownRenderer content={question.explanation} />
									</p>
								</div>
							)}

							{!isCorrect && isMCQ && question.options && (
								<div className="mt-2 text-muted-foreground text-xs">
									Correct answer: {question.correctAnswer}
								</div>
							)}
							{!isCorrect && !isMCQ && (
								<div className="mt-2 text-muted-foreground text-xs">
									Model answer: {question.correctAnswer}
								</div>
							)}
						</m.div>
					)}
				</CardContent>
			</Card>
		</m.div>
	);
}
