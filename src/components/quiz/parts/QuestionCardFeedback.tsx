"use client";

import {
	Cancel01Icon,
	CheckmarkCircle01Icon,
	MailSend01Icon,
	RadialIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m, motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import type { useSolver } from "@/hooks/use-solver";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { StepByStep } from "../step-by-step";

type Solver = ReturnType<typeof useSolver>;

interface QuestionCardFeedbackProps {
	state: {
		isSubmitted: boolean;
		isCorrect: boolean | null;
		showHint: boolean;
		showExplanation: boolean;
	};
	gradeResult: {
		correct: boolean;
		score: number;
		feedback: string;
	} | null;
	question: {
		id: string;
		questionText: string;
		explanation: string | undefined;
		steps?: string[];
		points: number;
		type: string;
		subject: string;
		hint?: string;
	};
	effectiveSubject: string;
	isCorrect: boolean | null;
	showExplanation: boolean;
	isGrading: boolean;
	solver: Solver;
	followUpMsgs: {
		role: "user" | "assistant";
		content: string;
	}[];
	isSolverEnabled: boolean;
	handleFollowUp: () => void;
	followUpInput: string;
	setFollowUpInput: React.Dispatch<React.SetStateAction<string>>;
}

export function QuestionCardFeedback({
	state,
	gradeResult,
	question,
	effectiveSubject,
	isCorrect,
	showExplanation,
	isGrading,
	solver,
	followUpMsgs,
	isSolverEnabled,
	handleFollowUp,
	followUpInput,
	setFollowUpInput,
}: QuestionCardFeedbackProps) {
	if (!state.showExplanation) {
		return null;
	}

	const feedback = gradeResult;
	const isCorrectAnswer = feedback?.correct ?? false;

	return (
		<m.div
			initial={{ opacity: 0, scale: 0.95, y: -8 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className={cn(
				"flex flex-col gap-3 rounded-lg p-4",
				isCorrectAnswer
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
					{isCorrectAnswer ? (
						<HugeiconsIcon
							icon={CheckmarkCircle01Icon}
							className="size-10 shrink-0"
						/>
					) : (
						<HugeiconsIcon icon={Cancel01Icon} className="size-10 shrink-0" />
					)}
				</motion.div>
				<p className="font-medium">
					{isCorrectAnswer ? "Correct!" : "Incorrect"}
				</p>
			</div>
			{feedback && (
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<span className="font-medium text-sm">
							Score: {feedback.score}/{question.points}
						</span>
					</div>
					<div className="text-sm opacity-90">
						<MarkdownRenderer
							content={(feedback.feedback || question.explanation) ?? ""}
							subject={effectiveSubject}
						/>
					</div>
				</div>
			)}
			{question.steps && question.steps.length > 0 && (
				<div className="border-current/20 border-t pt-2">
					<StepByStep
						steps={question.steps}
						subject={effectiveSubject}
						className="text-foreground"
					/>
				</div>
			)}
			{!isCorrectAnswer && isSolverEnabled && (
				<div className="flex flex-col gap-2 border-current/20 border-t pt-2">
					{solver.isPending ? (
						<div className="flex items-center justify-center gap-2 py-3">
							<HugeiconsIcon
								icon={RadialIcon}
								className="size-5 animate-spin"
							/>
							<span className="text-sm">Solving...</span>
						</div>
					) : solver.data?.steps?.length ? (
						<div className="flex flex-col gap-2">
							<p className="font-bold text-foreground/60 text-xs uppercase tracking-wider">
								Step-by-step solution
							</p>
							<StepByStep
								steps={solver.data.steps}
								subject={effectiveSubject}
								className="text-foreground"
							/>
						</div>
					) : solver.data?.solution ? (
						<div className="whitespace-pre-wrap rounded-xl border border-border/50 bg-card p-4 text-sm leading-relaxed">
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
							className="h-9 gap-2 self-start text-sm"
						>
							<HugeiconsIcon icon={SparklesIcon} data-icon="inline-start" />
							Show me the steps
						</Button>
					)}
				</div>
			)}
			{solver.data && (
				<div className="flex flex-col gap-2 border-current/20 border-t pt-2">
					{followUpMsgs.map((msg, i) => (
						<div
							key={i}
							className={cn(
								"max-w-[90%] rounded-xl px-4 py-3 text-sm",
								msg.role === "user"
									? "ml-auto bg-[--system-accent]/10"
									: "mr-auto border border-border/50 bg-card",
							)}
						>
							{msg.content}
						</div>
					))}
					{solver.isSendingFollowUp && (
						<div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
							<HugeiconsIcon
								icon={RadialIcon}
								className="size-4 animate-spin"
							/>
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
								className="h-9 flex-1 rounded-lg border border-border bg-card px-3 text-base outline-none focus:border-[--system-accent]/40"
							/>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={handleFollowUp}
								disabled={!followUpInput.trim()}
								className="size-9 shrink-0"
							>
								<HugeiconsIcon icon={MailSend01Icon} data-icon />
							</Button>
						</div>
					)}
				</div>
			)}
		</m.div>
	);
}
