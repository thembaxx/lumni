"use client";

import {
	Camera,
	CheckCircle,
	CircleNotch,
	Minus,
	PaperPlaneRight,
	Plus,
	Sparkle,
	X,
} from "@phosphor-icons/react";
import { AnimatePresence, m, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Confetti, XPGainPopup } from "@/components/celebration";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { TTSButton } from "@/components/shared/tts-button";
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
import { useSolver } from "@/hooks/use-solver";
import { useVisualEngine } from "@/hooks/use-visual-engine";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { AnimatedIcon, getIconMapping } from "@/lib/utils/icon-mapping";
import { useBookmarksStore } from "@/store/bookmarks";
import { useToolsStore } from "@/store/tools";
import type { Question, QuestionState, UserAnswer } from "@/types/questions";
import { QuestionDiagram } from "./question-diagram";
import { StepByStep } from "./step-by-step";

const MATH_SUBJECTS = [
	"mathematics",
	"technical-mathematics",
	"physical-sciences",
	"mathematical-literacy",
];

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
	const { addBookmark, removeBookmark, isBookmarked } = useBookmarksStore();
	const bookmarked = isBookmarked(question.id);
	const [gradeResult, setGradeResult] = useState<{
		correct: boolean;
		score: number;
		feedback: string;
	} | null>(null);
	const [isGrading, setIsGrading] = useState(false);
	const [calcValue, setCalcValue] = useState("");
	const effectiveSubjectLower = effectiveSubject.toLowerCase();
	const isMathSubject = MATH_SUBJECTS.some((s) =>
		effectiveSubjectLower.includes(s),
	);
	const openTools = useToolsStore((s) => s.openTools);
	const [code, setCode] = useState("");

	const { grade } = useQuestionEngine();

	const { data: visual, isLoading: visualLoading } = useVisualEngine(question);

	const solver = useSolver();
	const [followUpMsgs, setFollowUpMsgs] = useState<
		{ role: "user" | "assistant"; content: string }[]
	>([]);
	const [followUpInput, setFollowUpInput] = useState("");

	useEffect(() => {
		if (solver.followUpData?.answer) {
			setFollowUpMsgs((prev) => [
				...prev,
				{ role: "assistant", content: solver.followUpData!.answer },
			]);
		}
	}, [solver.followUpData]);

	const handleFollowUp = useCallback(() => {
		const text = followUpInput.trim();
		if (!text || !solver.data) return;
		setFollowUpMsgs((prev) => [...prev, { role: "user", content: text }]);
		setFollowUpInput("");
		solver.followUp({
			question: text,
			context: [
				{
					role: "assistant",
					content: solver.data.solution || solver.data.steps?.join("\n") || "",
				},
				{ role: "user", content: question.questionText },
			],
			subject: effectiveSubject,
		});
	}, [
		followUpInput,
		solver.data,
		solver.followUp,
		effectiveSubject,
		question.questionText,
	]);

	const isMultiPart =
		question.type === "source-based" ||
		question.type === "data-response" ||
		question.type === "mixed";
	const isSolverEnabled = !isMultiPart;

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
					<div className="flex flex-col gap-3">
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
					<div className="flex flex-col gap-3">
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
					<div className="flex flex-col gap-3">
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
					<div className="flex flex-col gap-3">
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
					<div className="flex flex-col gap-4">
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
					"rounded-lg p-4 flex flex-col gap-3",
					isCorrect
						? "bg-success/10 text-success"
						: "bg-destructive/10 text-destructive",
				)}
			>
				<div className="flex items-center gap-3">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ duration: 0.3 }}
					>
						{isCorrect ? (
							<CheckCircle className="size-10 shrink-0" />
						) : (
							<X className="size-10 shrink-0" />
						)}
					</motion.div>
					<p className="font-medium">{isCorrect ? "Correct!" : "Incorrect"}</p>
				</div>
				{feedback && (
					<div className="flex flex-col gap-1">
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
				{!isCorrect && isSolverEnabled && (
					<div className="flex flex-col gap-2 pt-2 border-t border-current/20">
						{solver.isPending ? (
							<div className="flex items-center justify-center gap-2 py-3">
								<CircleNotch className="size-5 animate-spin" />
								<span className="text-sm">Solving...</span>
							</div>
						) : solver.data?.steps?.length ? (
							<div className="flex flex-col gap-2">
								<p className="text-xs font-bold uppercase tracking-wider text-foreground/60">
									Step-by-step solution
								</p>
								<StepByStep
									steps={solver.data.steps}
									subject={effectiveSubject}
									className="text-foreground"
								/>
							</div>
						) : solver.data?.solution ? (
							<div className="rounded-xl bg-card border border-border/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
								{solver.data.solution}
							</div>
						) : solver.isError ? (
							<div className="flex items-center gap-2 py-2">
								<span className="text-sm opacity-80">
									Couldn't generate steps.
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										solver.mutate({
											question: question.questionText,
											subject: effectiveSubject,
										})
									}
									className="h-8 text-xs"
								>
									Try again
								</Button>
							</div>
						) : (
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									solver.mutate({
										question: question.questionText,
										subject: effectiveSubject,
									})
								}
								className="gap-2 h-9 text-sm self-start"
							>
								<Sparkle data-icon="inline-start" />
								Show me the steps
							</Button>
						)}
					</div>
				)}
				{solver.data && (
					<div className="flex flex-col gap-2 pt-2 border-t border-current/20">
						{followUpMsgs.map((msg, i) => (
							<div
								key={i}
								className={cn(
									"rounded-xl px-4 py-3 text-sm max-w-[90%]",
									msg.role === "user"
										? "bg-[--system-accent]/10 ml-auto"
										: "bg-card border border-border/50 mr-auto",
								)}
							>
								{msg.content}
							</div>
						))}
						{solver.isSendingFollowUp && (
							<div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
								<CircleNotch className="size-4 animate-spin" />
								Thinking...
							</div>
						)}
						{solver.followUpError && (
							<div className="flex items-center gap-2 py-2">
								<span className="text-sm opacity-80">
									Couldn't get an answer.
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleFollowUp}
									className="h-8 text-xs"
								>
									Try again
								</Button>
							</div>
						)}
						{!solver.isSendingFollowUp && (
							<div className="flex items-center gap-2">
								<input
									type="text"
									value={followUpInput}
									onChange={(e) => setFollowUpInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleFollowUp();
										}
									}}
									placeholder="Ask a follow-up question..."
									className="flex-1 h-9 rounded-lg bg-card border border-border px-3 text-sm outline-none focus:border-[--system-accent]/40"
								/>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={handleFollowUp}
									disabled={!followUpInput.trim()}
									className="size-9 shrink-0"
								>
									<PaperPlaneRight data-icon />
								</Button>
							</div>
						)}
					</div>
				)}
			</m.div>
		);
	};

	return (
		<Anim layoutId="question-card">
			<Confetti trigger={showConfetti} count={30} duration={1500} />
			<XPGainPopup amount={15} visible={showXPGain} />
			<Card key={question.id} size="sm" className="w-full max-w-2xl">
				<CardHeader className="gap-4">
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
						<div className="flex items-center gap-1">
							<button
								onClick={() =>
									bookmarked
										? removeBookmark(question.id)
										: addBookmark({
												id: question.id,
												questionText: question.questionText,
												subject: question.subject,
												topic: question.topic,
											})
								}
								className="size-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
								aria-label={
									bookmarked ? "Remove bookmark" : "Bookmark question"
								}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill={bookmarked ? "currentColor" : "none"}
									stroke="currentColor"
									strokeWidth="2"
									className={
										bookmarked ? "text-warning" : "text-muted-foreground"
									}
								>
									<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
								</svg>
							</button>
							<TTSButton text={question.questionText} />
							<Badge variant="secondary" className="text-xs">
								{question.points} pts
							</Badge>
						</div>
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
										<Minus data-icon="inline-start" />
										<span className="text-xs">Hide</span>
									</>
								) : (
									<>
										<Plus data-icon="inline-start" />
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

				<CardContent className="flex flex-col gap-3">
					{renderInput()}

					{isGrading && (
						<div className="flex items-center justify-center gap-2">
							<div className="size-12">
								<CircleNotch className="size-12 animate-spin text-muted-foreground" />
							</div>
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

				<CardFooter className="gap-3">
					<Button
						onClick={handleHint}
						variant="outline"
						className={cn("gap-2", state.showHint && "animate-icon-pop")}
					>
						<Minus
							className={cn(
								"transition-transform duration-(--duration-normal)",
								state.showHint && "rotate-180",
							)}
							data-icon="inline-start"
						/>
						Hint
					</Button>
					{isMathSubject && (
						<Button
							variant="outline"
							size="icon"
							onClick={() => openTools("solver", true)}
							className="size-10 shrink-0"
							title="Snap a photo to solve"
						>
							<Camera data-icon />
						</Button>
					)}
					{state.isSubmitted && onNext && (
						<Button onClick={onNext} className="flex-1">
							Next Question
						</Button>
					)}
				</CardFooter>
			</Card>
		</Anim>
	);
}
