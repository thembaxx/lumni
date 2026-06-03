"use client";

import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DataResponseInput } from "@/components/quiz/parts/data-response-input";
import { MixedPartsInput } from "@/components/quiz/parts/mixed-parts-input";
import { SourceBasedInput } from "@/components/quiz/parts/source-based-input";
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
	const t = useTranslations();
	const [textInputValue, setTextInputValue] = useState("");
	const [longAnswerValue, setLongAnswerValue] = useState("");
	const [essayValue, setEssayValue] = useState("");

	useEffect(() => {
		setTextInputValue("");
		setLongAnswerValue("");
		setEssayValue("");
	}, []);

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
										"quiz-option-btn flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left",
										isSelected &&
											"border-(--system-accent) bg-(--system-accent-alpha-10)",
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
						{t("quiz.checkAnswer")}
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
				headers: [t("quiz.items"), t("quiz.match")],
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
					value={textInputValue}
					onChange={setTextInputValue}
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
					value={longAnswerValue}
					onChange={setLongAnswerValue}
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
					value={essayValue}
					onChange={setEssayValue}
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
						{t("quiz.submitAnswer")}
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
						t("quiz.diagramPrompt")}
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
						{t("quiz.submitAnswer")}
					</Button>
				</div>
			);
		}

		case "source-based": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return (
				<SourceBasedInput
					body={qBody}
					effectiveSubject={effectiveSubject}
					onGrade={handleGrade}
				/>
			);
		}

		case "data-response": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			return <DataResponseInput body={qBody} onGrade={handleGrade} />;
		}

		case "mixed": {
			const body = question as Record<string, unknown>;
			const qBody = body.body as Record<string, unknown>;
			const parts = qBody.parts as Record<string, unknown>[] | undefined;
			return <MixedPartsInput parts={parts} onGrade={handleGrade} />;
		}

		default:
			return (
				<p className="text-muted-foreground text-sm">
					{t("quiz.unsupportedType")}
				</p>
			);
	}
}
