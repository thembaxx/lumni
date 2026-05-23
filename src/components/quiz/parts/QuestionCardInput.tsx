"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import {
	CalculationInput,
	EssayInput,
	LongAnswerInput,
	MatchingInput,
	ProgrammingInput,
	ShortAnswerInput,
} from "@/components/ui/inputs";
import type {
	MediaContent,
	Option,
	UserAnswer,
} from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

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
	options: Option[];
	calcValue: string;
	setCalcValue: React.Dispatch<React.SetStateAction<string>>;
	code: string;
	setCode: React.Dispatch<React.SetStateAction<string>>;
	handleMCQSelect: (optionId: string) => void;
	handleMCQSubmit: () => void;
	handleGrade: (answer: UserAnswer) => Promise<void>;
}

export function QuestionCardInput({
	question,
	effectiveSubject,
	state,
	options,
	calcValue,
	setCalcValue,
	code,
	setCode,
	handleMCQSelect,
	handleMCQSubmit,
	handleGrade,
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
										"quiz-option-btn flex h-auto w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left",
										isSelected &&
											"border-[--system-accent] bg-[--system-accent]/10",
									)}
								>
									<span
										className={cn(
											"flex h-6 w-6 items-center justify-center rounded-full border font-medium text-sm",
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
									{option.text.length > 80 && <TTSButton text={option.text} />}
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
				<div className="py-4 text-center text-muted-foreground text-sm">
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
			const [partAnswers, setPartAnswers] = useState<Record<string, string>>(
				{},
			);
			return (
				<div className="flex flex-col gap-3">
					<div className="rounded-lg bg-muted/30 p-4 text-sm">
						<MarkdownRenderer
							content={(source?.content as string) ?? ""}
							subject={effectiveSubject}
						/>
						{!!source?.attribution && (
							<p className="mt-2 text-muted-foreground text-xs">
								: {String(source.attribution)}
							</p>
						)}
					</div>
					{subQuestions?.map((sq, i: number) => {
						const sqId = String((sq as Record<string, unknown>).id ?? i);
						return (
							<div
								key={sqId}
								className="flex flex-col gap-2 rounded-lg border p-3"
							>
								<p className="mb-1 font-medium text-sm">
									{String((sq as Record<string, unknown>).questionText ?? "")}
								</p>
								<input
									type="text"
									className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--system-accent]"
									placeholder="Your answer..."
									value={partAnswers[sqId] ?? ""}
									onChange={(e) =>
										setPartAnswers((prev) => ({
											...prev,
											[sqId]: e.target.value,
										}))
									}
								/>
							</div>
						);
					})}
					<Button
						onClick={() => {
							handleGrade({
								type: "mixed",
								value:
									subQuestions?.map(
										(sq: Record<string, unknown>, i: number) => {
											const sqId = String(sq.id ?? i);
											return {
												partId: sqId,
												answer: {
													type: "text",
													value: partAnswers[sqId] ?? "",
												},
											};
										},
									) ?? [],
							});
						}}
						disabled={
							!subQuestions ||
							subQuestions.length === 0 ||
							Object.values(partAnswers).every((v) => !v.trim())
						}
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
			const [partAnswers, setPartAnswers] = useState<Record<string, string>>(
				{},
			);
			return (
				<div className="flex flex-col gap-3">
					<div className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 font-mono text-sm">
						{typeof qBody.data === "string"
							? qBody.data
							: JSON.stringify(qBody.data, null, 2)}
					</div>
					{questions?.map((q, i: number) => {
						const qId = String((q as Record<string, unknown>).id ?? i);
						return (
							<div
								key={qId}
								className="flex flex-col gap-2 rounded-lg border p-3"
							>
								<p className="mb-1 font-medium text-sm">
									{String((q as Record<string, unknown>).questionText ?? "")}
								</p>
								<input
									type="text"
									className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--system-accent]"
									placeholder="Your answer..."
									value={partAnswers[qId] ?? ""}
									onChange={(e) =>
										setPartAnswers((prev) => ({
											...prev,
											[qId]: e.target.value,
										}))
									}
								/>
							</div>
						);
					})}
					<Button
						onClick={() => {
							handleGrade({
								type: "mixed",
								value:
									questions?.map((q: Record<string, unknown>, i: number) => {
										const qId = String(q.id ?? i);
										return {
											partId: qId,
											answer: { type: "text", value: partAnswers[qId] ?? "" },
										};
									}) ?? [],
							});
						}}
						disabled={
							!questions ||
							questions.length === 0 ||
							Object.values(partAnswers).every((v) => !v.trim())
						}
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
			const [partAnswers, setPartAnswers] = useState<Record<string, string>>(
				{},
			);
			return (
				<div className="flex flex-col gap-4">
					{parts?.map((part, i: number) => {
						const p = part as Record<string, unknown>;
						const pId = String(p.id ?? i);
						return (
							<div
								key={pId}
								className="flex flex-col gap-2 rounded-lg border p-3"
							>
								<p className="mb-1 font-medium text-sm">
									{i + 1}. {String(p.questionText ?? "")}{" "}
									<span className="text-muted-foreground text-xs">
										({String(p.points ?? "")} pts)
									</span>
								</p>
								<input
									type="text"
									className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[--system-accent]"
									placeholder="Your answer..."
									value={partAnswers[pId] ?? ""}
									onChange={(e) =>
										setPartAnswers((prev) => ({
											...prev,
											[pId]: e.target.value,
										}))
									}
								/>
							</div>
						);
					})}
					<Button
						onClick={() =>
							handleGrade({
								type: "mixed",
								value:
									parts?.map((p, i: number) => {
										const part = p as Record<string, unknown>;
										const pId = String(part.id ?? i);
										return {
											partId: pId,
											answer: { type: "text", value: partAnswers[pId] ?? "" },
										};
									}) ?? [],
							})
						}
						disabled={
							!parts ||
							parts.length === 0 ||
							Object.values(partAnswers).every((v) => !v.trim())
						}
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
