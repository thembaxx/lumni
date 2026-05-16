"use client";

import { AnimatePresence, m, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Confetti, XPGainPopup } from "@/components/celebration";
import { Anim } from "@/components/shared/anim";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useSolver } from "@/hooks/use-solver";
import { useVisualEngine } from "@/hooks/use-visual-engine";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { useBookmarksStore } from "@/store/bookmarks";
import { useToolsStore } from "@/store/tools";

interface QuestionState {
	selectedOption: string | null;
	isCorrect: boolean | null;
	showHint: boolean;
	showExplanation: boolean;
	isSubmitted: boolean;
	showDiagram: boolean;
	calcValue: string;
	code: string;
}

import { QuestionDiagram } from "../question-diagram";
import { StepByStep } from "../step-by-step";
import { QuestionCardControls } from "./QuestionCardControls";
import { QuestionCardFeedback } from "./QuestionCardFeedback";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionCardInput } from "./QuestionCardInput";
import { QuestionCardMedia } from "./QuestionCardMedia";

interface QuestionCardProps {
	question: Question;
	subject?: string;
	topic?: string;
	questionNumber?: number;
	totalQuestions?: number;
	onNext?: () => void;
	onAnswered?: (correct: boolean, score: number) => void;
}

const MATH_SUBJECTS = [
	"mathematics",
	"technical-mathematics",
	"physical-sciences",
	"mathematical-literacy",
];

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
		calcValue: "",
		code: "",
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

	const handleMCQSubmit = useCallback(() => {
		if (!state.selectedOption || !isMCQ) return;
		const selectedOpt = options.find((opt) => opt.id === state.selectedOption);
		if (!selectedOpt) return;
		handleGrade({ type: "option-ids", value: [selectedOpt.id] });
	}, [state.selectedOption, isMCQ, options, handleGrade]);

	const handleToggleDiagram = () => {
		setState((prev) => ({ ...prev, showDiagram: !prev.showDiagram }));
	};

	return (
		<Anim layoutId="question-card">
			<Confetti trigger={showConfetti} count={30} duration={1500} />
			<XPGainPopup amount={15} visible={showXPGain} />
			<QuestionCardHeader
				question={question}
				effectiveSubject={effectiveSubject}
				bookmarked={bookmarked}
				onBookmarkToggle={() => {
					bookmarked
						? removeBookmark(question.id)
						: addBookmark({
								id: question.id,
								questionText: question.questionText,
								subject: question.subject,
								topic: question.topic,
							});
				}}
				isMathSubject={isMathSubject}
				onToolClick={() => openTools("solver", true)}
			/>
			<QuestionCardMedia
				visual={visual}
				isLoading={visualLoading}
				questionMedia={question.media ?? []}
				showDiagram={state.showDiagram}
				onToggleDiagram={handleToggleDiagram}
				hasDiagram={hasDiagram}
			/>
			<QuestionCardInput
				question={question}
				effectiveSubject={effectiveSubject}
				state={state}
				setState={setState}
				isMCQ={isMCQ}
				options={options}
				calcValue={calcValue}
				setCalcValue={setCalcValue}
				code={code}
				setCode={setCode}
				handleMCQSelect={handleMCQSelect}
				handleMCQSubmit={handleMCQSubmit}
				handleGrade={handleGrade}
				handleFollowUp={handleFollowUp}
				followUpInput={followUpInput}
				setFollowUpInput={setFollowUpInput}
				solver={solver}
				isSolverEnabled={isSolverEnabled}
			/>
			<QuestionCardFeedback
				state={state}
				gradeResult={gradeResult}
				question={question}
				effectiveSubject={effectiveSubject}
				isCorrect={state.isCorrect}
				showExplanation={state.showExplanation}
				isGrading={isGrading}
				solver={solver}
				followUpMsgs={followUpMsgs}
				isSolverEnabled={isSolverEnabled}
				handleFollowUp={handleFollowUp}
				followUpInput={followUpInput}
				setFollowUpInput={setFollowUpInput}
			/>
			<QuestionCardControls
				isMCQ={isMCQ}
				options={options}
				handleMCQSelect={handleMCQSelect}
				handleMCQSubmit={handleMCQSubmit}
				handleGrade={handleGrade}
				isGrading={isGrading}
				onNext={onNext}
				onAnswered={onAnswered}
				isSubmitted={state.isSubmitted}
				questionNumber={questionNumber}
				totalQuestions={totalQuestions}
				effectiveSubject={effectiveSubject}
				solver={solver}
				isSolverEnabled={isSolverEnabled}
				handleFollowUp={handleFollowUp}
				followUpInput={followUpInput}
				setFollowUpInput={setFollowUpInput}
			/>
		</Anim>
	);
}
