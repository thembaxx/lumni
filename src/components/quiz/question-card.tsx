"use client";

import { CancelIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { Confetti, XPGainPopup } from "@/components/celebration";
import { LottieWrapper } from "@/components/lottie";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CalculationInput,
	EssayInput,
	LongAnswerInput,
	MatchingInput,
	ProgrammingInput,
	ShortAnswerInput,
} from "@/components/ui/inputs";
import { VisualContent } from "@/components/visual/visual-content";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useVisualEngine } from "@/hooks/use-visual-engine";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import type { Question, QuestionState, UserAnswer } from "@/types/questions";
import { QuestionDiagram } from "./question-diagram";
import { StepByStep } from "./step-by-step";

interface QuestionCardProps {
	question: Question;
	subject?: string;
	topic?: string;
	questionNumber?: number;
	totalQuestions?: number;
	onNext?: () => void;
	onAnswered?: (correct: boolean, score: number) => void;
}

export function QuestionCard({
	question,
	subject: subjectProp,
	topic: topicProp,
	questionNumber,
	totalQuestions,
	onNext,
	onAnswered,
}: QuestionCardProps) {
	const effectiveSubject = subjectProp || topicProp || "";

	const [state, setState] = useState<QuestionState>({
		selectedOption: null,
		isCorrect: null,
		showHint: false,
		showExplanation: false,
		isSubmitted: false,
		showDiagram: true,
	});

	const [showConfetti, setShowConfetti] = useState(false);
	const [showXPGain, setShowXPGain] = useState(false);
	const [gradeResult, setGradeResult] = useState<{
		correct: boolean;
		score: number;
		feedback: string;
	} | null>(null);
	const [isGrading, setIsGrading] = useState(false);
	const [calcValue, setCalcValue] = useState("");
	const [code, setCode] = useState("");

	const { grade } = useQuestionEngine();

	const { data: visual, isLoading: visualLoading } = useVisualEngine(question);

	const isMCQ = question.type === "multiple-choice";
	const mcqBody = isMCQ ? (question as Question<"multiple-choice">).body : null;
	const options = mcqBody?.options ?? [];
	const hasDiagram = (question.media?.length ?? 0) > 0;

	const handleGrade = useCallback(
		async (answer: UserAnswer) => {
			setIsGrading(true);
			try {
				const result = await grade(question, answer);
				setGradeResult(result);
				setState((prev) => ({
					...prev,
					isSubmitted: true,
					isCorrect: result.correct,
					showExplanation: true,
				}));
				if (result.correct) {
					setShowConfetti(true);
					setShowXPGain(true);
					setTimeout(() => setShowConfetti(false), 2000);
					setTimeout(() => setShowXPGain(false), 1500);
				}
				onAnswered?.(result.correct, result.score);
			} catch {
				setGradeResult({
					correct: false,
					score: 0,
					feedback: "Grading failed. Please try again.",
				});
				setState((prev) => ({
					...prev,
					isSubmitted: true,
					showExplanation: true,
				}));
			}
			setIsGrading(false);
		},
		[grade, question, onAnswered],
	);

	const handleMCQSelect = useCallback(
		(optionId: string) => {
			if (state.isSubmitted) return;
			setState((prev) => ({ ...prev, selectedOption: optionId }));
		},
		[state.isSubmitted],
	);

	const handleMCGSubmit = useCallback(() => {
		if (!state.selectedOption || !isMCQ) return;
		const selectedOpt = options.find((opt) => opt.id === state.selectedOption);
		if (!selectedOpt) return;
		handleGrade({ type: "option-ids", value: [selectedOpt.id] });
	}, [state.selectedOption, isMCQ, options, handleGrade]);

	const handleHint = () => {
		setState((prev) => ({ ...prev, showHint: !prev.showHint }));
	};

	const handleToggleDiagram = () => {
		setState((prev) => ({ ...prev, showDiagram: !prev.showDiagram }));
	};

	const renderInput = () => {
		if (state.isSubmitted) return null;

		switch (question.type) {
			case "multiple-choice":
				return (
					<div
						className={cn(
							"grid gap-2",
							options.every((o) => o.text.length <= 30)
								? "grid-cols-2"
								: "grid-cols-1",
						)}
					>
						{options.map((option, i) => {
							const isSelected = state.selectedOption === option.id;
							return (
								<m.div
									key={option.id}
									initial={{ opacity: 0, x: -8 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{
										delay: i * 0.05,
										duration: 0.25,
										ease: iOSEase,
									}}
									whileHover={{ scale: 1.01 }}
									whileTap={{ scale: 0.98 }}
								>
									<Button
										variant="ghost"
										type="button"
										onClick={() => handleMCQSelect(option.id)}
										className={cn(
											"quiz-option-btn flex w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left h-auto",
											isSelected &&
												"border-[--system-accent] bg-[--system-accent]/10",
										)}
									>
										<span
											className={cn(
												"flex h-6 w-6 items-center justify-center rounded-full border text-sm font-medium",
												isSelected
													? "border-[--system-accent] bg-[--system-accent] text-background"
													: "border-muted-foreground/30",
											)}
										>
											{option.id}
										</span>
										<span className="flex-1 font-medium">
											<MarkdownRenderer
												content={option.text}
												subject={effectiveSubject}
											/>
										</span>
									</Button>
								</m.div>
							);
						})}
						<Button
							onClick={handleMCGSubmit}
							disabled={!state.selectedOption}
							className="col-span-full mt-2"
						>
							Check Answer
						</Button>
					</div>
				);

			case "matching": {
				const body = question as Question<"matching">;
				const matchingPairs = body.body.pairs.map((p) => [p.left, p.right]);
				const table: import("@/types/exam-paper").DataTable = {
					headers: ["Items", "Match"],
					rows: matchingPairs,
				};
				return (
					<MatchingInput
						table={table}
						onChange={(pairs) => handleGrade({ type: "pairs", value: pairs })}
						disabled={isGrading}
					/>
				);
			}

			case "short-answer": {
				const body = question as Question<"short-answer">;
				return (
					<ShortAnswerInput
						maxLength={body.body.maxLength}
						onSubmit={(answer) => handleGrade({ type: "text", value: answer })}
						disabled={isGrading}
					/>
				);
			}

			case "long-answer": {
				const body = question as Question<"long-answer">;
				return (
					<LongAnswerInput
						minWords={body.body.minWords}
						maxWords={body.body.maxWords}
						onSubmit={(answer) => handleGrade({ type: "text", value: answer })}
						disabled={isGrading}
					/>
				);
			}

			case "essay": {
				const body = question as Question<"essay">;
				return (
					<EssayInput
						wordLimit={body.body.wordLimit}
						rubric={body.body.rubric}
						onSubmit={(answer) => handleGrade({ type: "text", value: answer })}
						disabled={isGrading}
					/>
				);
			}

			case "calculation": {
				const body = question as Question<"calculation">;
				return (
					<div className="space-y-3">
						<CalculationInput
							value={calcValue}
							onChange={setCalcValue}
							unit={body.body.unit}
							disabled={isGrading}
						/>
						<Button
							onClick={() => handleGrade({ type: "numeric", value: calcValue })}
							disabled={isGrading || !calcValue.trim()}
						>
							Submit Answer
						</Button>
					</div>
				);
			}

			case "diagram": {
				const diagramBody = question as Question<"diagram">;
				return (
					<div className="text-center text-muted-foreground text-sm py-4">
						{diagramBody.body.instructions ||
							"Interact with the diagram above and submit your answer."}
					</div>
				);
			}

			case "programming": {
				const body = question as Question<"programming">;
				return (
					<div className="space-y-3">
						<ProgrammingInput
							value={code}
							onChange={setCode}
							language={body.body.language}
							starterCode={body.body.starterCode}
							disabled={isGrading}
						/>
						<Button
							onClick={() => handleGrade({ type: "code", value: code })}
							disabled={isGrading || !code.trim()}
						>
							Submit Answer
						</Button>
					</div>
				);
			}

			case "source-based": {
				const body = question as Question<"source-based">;
				return (
					<div className="space-y-3">
						<div className="rounded-lg bg-muted/30 p-4 text-sm">
							<MarkdownRenderer
								content={body.body.source.content}
								subject={effectiveSubject}
							/>
							{body.body.source.attribution && (
								<p className="text-xs text-muted-foreground mt-2">
									— {body.body.source.attribution}
								</p>
							)}
						</div>
						{body.body.subQuestions.map((sq, i) => (
							<div key={i} className="rounded-lg border p-3">
								<p className="text-sm font-medium mb-2">{sq.questionText}</p>
							</div>
						))}
						<Button
							onClick={() => {
								handleGrade({
									type: "mixed",
									value: body.body.subQuestions.map((sq) => ({
										partId: sq.id,
										answer: { type: "text", value: "" },
									})),
								});
							}}
							disabled={isGrading}
						>
							Submit Answer
						</Button>
					</div>
				);
			}

			case "data-response": {
				const body = question as Question<"data-response">;
				return (
					<div className="space-y-3">
						<div className="rounded-lg bg-muted/30 p-4 text-sm font-mono whitespace-pre-wrap">
							{typeof body.body.data === "string"
								? body.body.data
								: JSON.stringify(body.body.data, null, 2)}
						</div>
						{body.body.questions.map((q, i) => (
							<div key={i} className="rounded-lg border p-3">
								<p className="text-sm font-medium mb-2">{q.questionText}</p>
							</div>
						))}
						<Button
							onClick={() => {
								handleGrade({
									type: "mixed",
									value: body.body.questions.map((q) => ({
										partId: q.id,
										answer: { type: "text", value: "" },
									})),
								});
							}}
							disabled={isGrading}
						>
							Submit Answer
						</Button>
					</div>
				);
			}

			case "mixed": {
				const body = question as Question<"mixed">;
				return (
					<div className="space-y-4">
						{body.body.parts.map((part, i) => (
							<div key={part.id} className="rounded-lg border p-3">
								<p className="text-sm font-medium mb-2">
									{i + 1}. {part.questionText}{" "}
									<span className="text-xs text-muted-foreground">
										({part.points} pts)
									</span>
								</p>
							</div>
						))}
						<Button
							onClick={() =>
								handleGrade({
									type: "mixed",
									value: body.body.parts.map((p) => ({
										partId: p.id,
										answer: { type: "text", value: "" },
									})),
								})
							}
							disabled={isGrading}
							className="w-full"
						>
							Submit All Parts
						</Button>
					</div>
				);
			}

			default:
				return (
					<p className="text-muted-foreground text-sm">
						Question type not supported yet.
					</p>
				);
		}
	};

	const renderFeedback = () => {
		if (!state.showExplanation) return null;
		const feedback = gradeResult;
		const isCorrect = feedback?.correct ?? false;
		return (
			<m.div
				initial={{ opacity: 0, scale: 0.95, y: -8 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.3, ease: iOSEase }}
				className={cn(
					"rounded-lg p-4 space-y-3",
					isCorrect
						? "bg-success/10 text-success"
						: "bg-destructive/10 text-destructive",
				)}
			>
				<div className="flex items-center gap-3">
					<LottieWrapper
						animation={isCorrect ? "quiz-correct" : "quiz-incorrect"}
						className="w-10 h-10 shrink-0"
						loop={false}
					/>
					<p className="font-medium">{isCorrect ? "Correct!" : "Incorrect"}</p>
				</div>
				{feedback && (
					<div className="space-y-1">
						<div className="flex items-center gap-2">
							<span className="text-sm font-medium">
								Score: {feedback.score}/{question.points}
							</span>
						</div>
						<div className="text-sm opacity-90">
							<MarkdownRenderer
								content={feedback.feedback || question.explanation}
								subject={effectiveSubject}
							/>
						</div>
					</div>
				)}
				{question.steps && question.steps.length > 0 && (
					<div className="pt-2 border-t border-current/20">
						<StepByStep
							steps={question.steps}
							subject={effectiveSubject}
							className="text-foreground"
						/>
					</div>
				)}
			</m.div>
		);
	};

	return (
		<LazyMotion features={domAnimation}>
			<Confetti trigger={showConfetti} count={30} duration={1500} />
			<XPGainPopup amount={15} visible={showXPGain} />
			<Card className="w-full max-w-2xl">
				<CardHeader className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className="bg-[--system-accent]/10 font-medium"
							>
								<span className="opacity-80">{question.topic}</span>
							</Badge>
							<DifficultyBadge
								difficulty={question.difficulty}
								variant="quiz"
								className="border font-mono text-xs"
							/>
							<Badge
								variant="outline"
								className="bg-[--system-accent]/5 text-xs font-mono"
							>
								{question.type}
							</Badge>
						</div>
						<Badge variant="secondary" className="text-xs">
							{question.points} pts
						</Badge>
					</div>
					<VisualContent visual={visual} isLoading={visualLoading} />
					<div
						className={cn(
							"overflow-y-auto max-h-75 pr-2",
							question.questionText.length > 500 && "scrollbar-thin",
						)}
					>
						<CardTitle className="text-lg leading-relaxed">
							<MarkdownRenderer
								content={question.questionText}
								subject={effectiveSubject}
							/>
						</CardTitle>
					</div>
				</CardHeader>

				{hasDiagram && (
					<CardContent>
						<div className="flex items-center justify-between">
							<p className="text-xs font-medium text-muted-foreground">
								Diagram
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
						{state.showDiagram &&
							question.media?.map((m, i) => (
								<div key={i} className="mt-2">
									{m.diagramData && <QuestionDiagram diagram={m.diagramData} />}
								</div>
							))}
					</CardContent>
				)}

				<CardContent className="space-y-3">
					{renderInput()}

					{isGrading && (
						<div className="flex items-center justify-center gap-2">
							<LottieWrapper
								animation="loading-dots"
								className="w-12 h-6"
								loop
							/>
							<p className="text-sm text-muted-foreground">
								Grading your answer...
							</p>
						</div>
					)}

					<AnimatePresence initial={false}>
						{state.showHint && (
							<m.div
								key="hint"
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.2, ease: iOSEase }}
								className="rounded-lg bg-warning/5 p-4 text-warning"
							>
								<p className="font-medium">Hint:</p>
								<MarkdownRenderer
									content={question.hint}
									subject={effectiveSubject}
								/>
							</m.div>
						)}
					</AnimatePresence>

					<AnimatePresence initial={false}>{renderFeedback()}</AnimatePresence>
				</CardContent>

				<CardFooter className="flex gap-3">
					<Button
						onClick={handleHint}
						variant="outline"
						className={cn("gap-2", state.showHint && "animate-icon-pop")}
					>
						<MinusIcon
							className={cn(
								"h-4 w-4 transition-transform duration-(--duration-normal)",
								state.showHint && "rotate-180",
							)}
						/>
						Hint
					</Button>
					{state.isSubmitted && onNext && (
						<Button onClick={onNext} className="flex-1">
							Next Question
						</Button>
					)}
				</CardFooter>
			</Card>
		</LazyMotion>
	);
}
