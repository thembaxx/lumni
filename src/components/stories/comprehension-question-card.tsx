"use client";

import {
	Cancel01Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ComprehensionQuestion {
	id: string;
	questionText: string;
	questionType:
		| "mcq"
		| "short-answer"
		| "fill-in-blank"
		| "true-false"
		| "matching";
	options?: string[];
	correctAnswer: string;
	explanation: string;
	sentenceTemplate?: string;
	pairs?: { left: string; right: string }[];
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
	const [selectedLeftIdx, setSelectedLeftIdx] = useState<number | null>(null);
	const [userPairs, setUserPairs] = useState<Map<number, number>>(new Map());
	const [isGraded, setIsGraded] = useState(false);
	const [isCorrect, setIsCorrect] = useState(false);
	const [score, setScore] = useState(0);

	const canSubmit = useMemo(() => {
		switch (question.questionType) {
			case "mcq":
			case "true-false":
				return selectedOption !== null;
			case "short-answer":
			case "fill-in-blank":
				return textInput.trim().length > 0;
			case "matching":
				return userPairs.size > 0;
			default:
				return false;
		}
	}, [question.questionType, selectedOption, textInput, userPairs]);

	const handleSubmit = useCallback(() => {
		let correct = false;
		let s = 0;

		switch (question.questionType) {
			case "mcq":
			case "true-false": {
				if (!selectedOption) return;
				correct = selectedOption === question.correctAnswer;
				s = correct ? 100 : 0;
				break;
			}
			case "short-answer":
			case "fill-in-blank": {
				const text = textInput.trim();
				if (!text) return;
				correct = fuzzyMatch(text, [question.correctAnswer]);
				s = correct ? 100 : 0;
				break;
			}
			case "matching": {
				const correctPairs = question.pairs ?? [];
				if (correctPairs.length === 0) {
					correct = true;
					s = 100;
					break;
				}
				const leftItems = correctPairs.map((p) => p.left);
				const rightItems = correctPairs.map((p) => p.right);
				let correctCount = 0;
				for (const [leftIdx, rightIdx] of userPairs) {
					const l = leftItems[leftIdx];
					const r = rightItems[rightIdx];
					if (correctPairs.some((p) => p.left === l && p.right === r)) {
						correctCount++;
					}
				}
				s = Math.round((correctCount / correctPairs.length) * 100);
				correct = s === 100;
				break;
			}
		}

		setIsCorrect(correct);
		setScore(s);
		setIsGraded(true);
		onGraded?.(s);
	}, [question, selectedOption, textInput, userPairs, onGraded]);

	const handleLeftClick = useCallback(
		(idx: number) => {
			if (isGraded) return;
			if (userPairs.has(idx)) {
				const next = new Map(userPairs);
				next.delete(idx);
				setUserPairs(next);
			} else {
				setSelectedLeftIdx(idx);
			}
		},
		[isGraded, userPairs],
	);

	const handleRightClick = useCallback(
		(idx: number) => {
			if (isGraded || selectedLeftIdx === null) return;
			const next = new Map(userPairs);
			next.set(selectedLeftIdx, idx);
			setUserPairs(next);
			setSelectedLeftIdx(null);
		},
		[isGraded, selectedLeftIdx, userPairs],
	);

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
					{(() => {
						switch (question.questionType) {
							case "mcq":
							case "true-false":
								return (
									<div className="flex flex-col gap-2">
										{(question.questionType === "true-false"
											? ["True", "False"]
											: (question.options ?? [])
										).map((option) => {
											const isSelected = selectedOption === option;
											const showResult = isGraded;
											const isOptionCorrect = option === question.correctAnswer;
											return (
												<button
													key={option}
													type="button"
													disabled={isGraded}
													aria-pressed={isSelected}
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
									</div>
								);

							case "short-answer":
								return (
									<div className="flex flex-col gap-2">
										<Textarea
											value={textInput}
											onChange={(e) => setTextInput(e.target.value)}
											disabled={isGraded}
											placeholder="Type your answer..."
											className="min-h-[80px] resize-none rounded-xl text-sm"
											aria-label={`Answer for question ${questionNumber}`}
										/>
									</div>
								);

							case "fill-in-blank":
								return (
									<div className="flex flex-col gap-2">
										{question.sentenceTemplate && (
											<div className="rounded-xl bg-muted/30 p-3 text-sm leading-relaxed">
												{question.sentenceTemplate
													.split("___")
													.map((part, i, arr) => (
														// biome-ignore lint/suspicious/noArrayIndexKey: static split array
														<span key={i}>
															{part}
															{i < arr.length - 1 && (
																<span className="mx-1 inline-block rounded-md bg-[--system-accent]/15 px-2 py-0.5 font-semibold text-[--system-accent]">
																	______
																</span>
															)}
														</span>
													))}
											</div>
										)}
										<Input
											value={textInput}
											onChange={(e) => setTextInput(e.target.value)}
											disabled={isGraded}
											placeholder="Type the missing word..."
											className="rounded-xl text-sm"
											aria-label={`Fill in the blank for question ${questionNumber}`}
										/>
									</div>
								);

							case "matching": {
								const correctPairs = question.pairs ?? [];
								const leftItems = correctPairs.map((p) => p.left);
								const rightItems = correctPairs.map((p) => p.right);
								const showResult = isGraded;
								return (
									<div className="flex flex-col gap-3">
										<div className="grid grid-cols-2 gap-3">
											<div className="flex flex-col gap-2">
												<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													Items
												</span>
												{leftItems.map((item, idx) => {
													const isPaired = userPairs.has(idx);
													const isSelected = selectedLeftIdx === idx;
													const pairedRightIdx = userPairs.get(idx);
													const rightItem =
														pairedRightIdx !== undefined
															? rightItems[pairedRightIdx]
															: undefined;
													const isCorrectPair =
														showResult &&
														isPaired &&
														rightItem !== undefined &&
														correctPairs.some(
															(p) => p.left === item && p.right === rightItem,
														);
													return (
														<button
															key={`left-${item}`}
															type="button"
															disabled={showResult}
															aria-pressed={isSelected}
															aria-label={`Match item: ${item}`}
															onClick={() => handleLeftClick(idx)}
															className={cn(
																"rounded-xl border px-3 py-2 text-left text-sm transition-colors",
																showResult &&
																	isCorrectPair &&
																	"border-success/30 bg-success/10",
																showResult &&
																	isPaired &&
																	!isCorrectPair &&
																	"border-destructive/30 bg-destructive/10",
																!showResult &&
																	isSelected &&
																	"border-[--system-accent] bg-[--system-accent]/5",
																!showResult &&
																	isPaired &&
																	"border-muted-foreground/30 bg-muted/30",
																!showResult &&
																	!isPaired &&
																	!isSelected &&
																	"border-border hover:bg-muted/50",
															)}
														>
															{item}
														</button>
													);
												})}
											</div>
											<div className="flex flex-col gap-2">
												<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													Matches
												</span>
												{rightItems.map((item, idx) => {
													const isTaken = [...userPairs.values()].includes(idx);
													return (
														<button
															key={`right-${item}`}
															type="button"
															disabled={showResult || isTaken}
															aria-label={`Match target: ${item}`}
															onClick={() => handleRightClick(idx)}
															className={cn(
																"rounded-xl border px-3 py-2 text-left text-sm transition-colors",
																showResult && "border-muted-foreground/30",
																!showResult &&
																	isTaken &&
																	"border-muted-foreground/30 bg-muted/30 opacity-50",
																!showResult &&
																	!isTaken &&
																	"border-border hover:bg-muted/50",
															)}
														>
															{item}
														</button>
													);
												})}
											</div>
										</div>
										{userPairs.size > 0 && !showResult && (
											<div className="flex flex-wrap items-center gap-2">
												<span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
													Your pairs:
												</span>
												{[...userPairs.entries()].map(([li, ri]) => (
													<Badge
														key={li}
														variant="secondary"
														className="gap-1 rounded-full text-xs"
													>
														{leftItems[li]} ↔ {rightItems[ri]}
														<button
															type="button"
															onClick={() => {
																const next = new Map(userPairs);
																next.delete(li);
																setUserPairs(next);
															}}
															className="ml-0.5 text-muted-foreground hover:text-foreground"
															aria-label={`Remove pair ${leftItems[li]} ↔ ${rightItems[ri]}`}
														>
															×
														</button>
													</Badge>
												))}
											</div>
										)}
									</div>
								);
							}

							default:
								return null;
						}
					})()}

					{!isGraded && (
						<Button
							size="sm"
							disabled={!canSubmit}
							onClick={handleSubmit}
							className="self-start rounded-full"
						>
							Submit Answer
						</Button>
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

							{!isCorrect && (
								<div className="mt-2 text-muted-foreground text-xs">
									{question.questionType === "matching" ? (
										<span>Correct pairings shown above</span>
									) : question.questionType === "true-false" ||
										question.questionType === "mcq" ? (
										<span>Correct answer: {question.correctAnswer}</span>
									) : (
										<span>Model answer: {question.correctAnswer}</span>
									)}
								</div>
							)}
						</m.div>
					)}
				</CardContent>
			</Card>
		</m.div>
	);
}
