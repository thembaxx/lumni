"use client";

import { m, motion } from "framer-motion";
import { useCallback } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import {
	CalculationInput,
	EssayInput,
	LongAnswerInput,
	MatchingInput,
	ProgrammingInput,
	ShortAnswerInput,
} from "@/components/ui/inputs";
import type { useSolver } from "@/hooks/use-solver";
import type {
	MediaContent,
	Option,
	UserAnswer,
} from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

type Solver = ReturnType<typeof useSolver>;

interface QuestionCardInputProps {
	question: {
		id: string;
		type: string;
		body: unknown;
		points: number;
		media?: MediaContent[];
		hint?: string;
		explanation?: string;
		steps?: string[];
	};
	effectiveSubject: string;
	state: {
		isSubmitted: boolean;
		selectedOption: string | null;
		calcValue: string;
		code: string;
	};
	setState: React.Dispatch<
		React.SetStateAction<{
			isSubmitted: boolean;
			selectedOption: string | null;
			calcValue: string;
			code: string;
			isCorrect: boolean | null;
			showHint: boolean;
			showExplanation: boolean;
			showDiagram: boolean;
		}>
	>;
	isMCQ: boolean;
	options: Option[];
	calcValue: string;
	setCalcValue: React.Dispatch<React.SetStateAction<string>>;
	code: string;
	setCode: React.Dispatch<React.SetStateAction<string>>;
	handleMCQSelect: (optionId: string) => void;
	handleMCQSubmit: () => void;
	handleGrade: (answer: UserAnswer) => Promise<void>;
	handleFollowUp: () => void;
	followUpInput: string;
	setFollowUpInput: React.Dispatch<React.SetStateAction<string>>;
	solver: Solver;
	isSolverEnabled: boolean;
}

export function QuestionCardInput({
	question,
	effectiveSubject,
	state,
	setState,
	isMCQ,
	options,
	calcValue,
	setCalcValue,
	code,
	setCode,
	handleMCQSelect,
	handleMCQSubmit,
	handleGrade,
	handleFollowUp,
	followUpInput,
	setFollowUpInput,
	solver,
	isSolverEnabled,
}: QuestionCardInputProps) {
	if (state.isSubmitted) {
		return null;
	}

	switch (question.type) {
		case "multiple-choice": {
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
						onClick={handleMCQSubmit}
						disabled={!state.selectedOption}
						className="col-span-full mt-2"
					>
						Check Answer
					</Button>
				</div>
			);
		}

		case "matching": {
			const body = question as Record<string, unknown>;
			const matchingPairs = (body.body as Record<string, unknown>)
				.pairs as Record<string, unknown>[];
			const pairs =
				matchingPairs?.map((p: Record<string, unknown>) => [
					p.left as string,
					p.right as string,
				]) ?? [];
			const table = {
				headers: ["Items", "Match"],
				rows: pairs,
			};
			return (
				<MatchingInput
					table={table}
					onChange={(pairs: Record<string, unknown>) =>
						handleGrade({ type: "pairs", value: pairs })
					}
					disabled={false}
				/>
			);
		}

		case "short-answer": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<ShortAnswerInput
					maxLength={qBody.maxLength as number | undefined}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
					disabled={false}
				/>
			);
		}

		case "long-answer": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<LongAnswerInput
					minWords={qBody.minWords as number | undefined}
					maxWords={qBody.maxWords as number | undefined}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
					disabled={false}
				/>
			);
		}

		case "essay": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<EssayInput
					wordLimit={qBody.wordLimit as number | undefined}
					rubric={
						qBody.rubric as
							| { name: string; description: string; maxScore: number }[]
							| undefined
					}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
					disabled={false}
				/>
			);
		}

		case "calculation": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<div className="flex flex-col gap-3">
					<CalculationInput
						value={calcValue}
						onChange={setCalcValue}
						unit={qBody.unit as string | undefined}
						disabled={false}
					/>
					<Button
						onClick={() => handleGrade({ type: "numeric", value: calcValue })}
						disabled={!calcValue.trim()}
					>
						Submit Answer
					</Button>
				</div>
			);
		}

		case "diagram": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<div className="text-center text-muted-foreground text-sm py-4">
					{(qBody.instructions as string | undefined) ||
						"Interact with the diagram above and submit your answer."}
				</div>
			);
		}

		case "programming": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<div className="flex flex-col gap-3">
					<ProgrammingInput
						value={code}
						onChange={setCode}
						language={qBody.language as string | undefined}
						starterCode={qBody.starterCode as string | undefined}
						disabled={false}
					/>
					<Button
						onClick={() => handleGrade({ type: "code", value: code })}
						disabled={!code.trim()}
					>
						Submit Answer
					</Button>
				</div>
			);
		}

		case "source-based": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			const source = qBody.source as Record<string, unknown> | undefined;
			const subQuestions = qBody.subQuestions as
				| Record<string, unknown>[]
				| undefined;
			return (
				<div className="flex flex-col gap-3">
					<div className="rounded-lg bg-muted/30 p-4 text-sm">
						<MarkdownRenderer
							content={(source?.content as string) ?? ""}
							subject={effectiveSubject}
						/>
						{!!source?.attribution && (
							<p className="text-xs text-muted-foreground mt-2">
								— {String(source.attribution)}
							</p>
						)}
					</div>
					{subQuestions?.map((sq, i: number) => (
						<div key={i} className="rounded-lg border p-3">
							<p className="text-sm font-medium mb-2">
								{String((sq as Record<string, unknown>).questionText ?? "")}
							</p>
						</div>
					))}
					<Button
						onClick={() => {
							handleGrade({
								type: "mixed",
								value:
									subQuestions?.map((sq: Record<string, unknown>) => ({
										partId: sq.id,
										answer: { type: "text", value: "" },
									})) ?? [],
							});
						}}
						disabled={true}
						title="Interactive sub-questions not yet implemented"
					>
						Submit Answer
					</Button>
				</div>
			);
		}

		case "data-response": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			const questions = qBody.questions as
				| Record<string, unknown>[]
				| undefined;
			return (
				<div className="flex flex-col gap-3">
					<div className="rounded-lg bg-muted/30 p-4 text-sm font-mono whitespace-pre-wrap">
						{typeof qBody.data === "string"
							? qBody.data
							: JSON.stringify(qBody.data, null, 2)}
					</div>
					{questions?.map((q, i: number) => (
						<div key={i} className="rounded-lg border p-3">
							<p className="text-sm font-medium mb-2">
								{String((q as Record<string, unknown>).questionText ?? "")}
							</p>
						</div>
					))}
					<Button
						onClick={() => {
							handleGrade({
								type: "mixed",
								value:
									questions?.map((q: Record<string, unknown>) => ({
										partId: q.id,
										answer: { type: "text", value: "" },
									})) ?? [],
							});
						}}
						disabled={true}
						title="Interactive sub-questions not yet implemented"
					>
						Submit Answer
					</Button>
				</div>
			);
		}

		case "mixed": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			const parts = qBody.parts as Record<string, unknown>[] | undefined;
			return (
				<div className="flex flex-col gap-4">
					{parts?.map((part, i: number) => {
						const p = part as Record<string, unknown>;
						return (
							<div key={String(p.id)} className="rounded-lg border p-3">
								<p className="text-sm font-medium mb-2">
									{i + 1}. {String(p.questionText ?? "")}{" "}
									<span className="text-xs text-muted-foreground">
										({String(p.points ?? "")} pts)
									</span>
								</p>
							</div>
						);
					})}
					<Button
						onClick={() =>
							handleGrade({
								type: "mixed",
								value:
									parts?.map((p) => {
										const part = p as Record<string, unknown>;
										return {
											partId: String(part.id),
											answer: { type: "text", value: "" },
										};
									}) ?? [],
							})
						}
						disabled={true}
						title="Interactive sub-questions not yet implemented"
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
}
