"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { DataResponseInput } from "@/components/quiz/parts/data-response-input";
import { DiagramInput } from "@/components/quiz/parts/diagram-input";
import { MCQOptions } from "@/components/quiz/parts/mcq-options";
import { MixedPartsInput } from "@/components/quiz/parts/mixed-parts-input";
import { SourceBasedInput } from "@/components/quiz/parts/source-based-input";
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

function getBodyField(body: unknown, field: string): unknown {
	const b = body as Record<string, unknown>;
	const inner = b.body as Record<string, unknown> | undefined;
	return inner?.[field];
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
	const [unitValue, setUnitValue] = useState("");

	if (state.isSubmitted) {
		return null;
	}

	switch (question.type) {
		case "multiple-choice":
			return (
				<MCQOptions
					options={options}
					selectedOption={state.selectedOption}
					effectiveSubject={effectiveSubject}
					onSelect={handleMCQSelect}
					onSubmit={handleMCQSubmit}
				/>
			);

		case "matching": {
			const pairs =
				(getBodyField(question, "pairs") as Record<string, unknown>[])?.map(
					(p) => [p.left as string, p.right as string],
				) ?? [];
			return (
				<MatchingInput
					table={{
						headers: [t("quiz.items"), t("quiz.match")],
						rows: pairs,
					}}
					onChange={(pairs: Record<string, unknown>) =>
						handleGrade({ type: "pairs", value: pairs })
					}
				/>
			);
		}

		case "short-answer":
			return (
				<ShortAnswerInput
					value={textInputValue}
					onChange={setTextInputValue}
					maxLength={getBodyField(question, "maxLength") as number | undefined}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
				/>
			);

		case "long-answer":
			return (
				<LongAnswerInput
					value={longAnswerValue}
					onChange={setLongAnswerValue}
					minWords={getBodyField(question, "minWords") as number | undefined}
					maxWords={getBodyField(question, "maxWords") as number | undefined}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
				/>
			);

		case "essay":
			return (
				<EssayInput
					value={essayValue}
					onChange={setEssayValue}
					wordLimit={getBodyField(question, "wordLimit") as number | undefined}
					rubric={
						getBodyField(question, "rubric") as
							| { name: string; description: string; maxScore: number }[]
							| undefined
					}
					onSubmit={(answer: string) =>
						handleGrade({ type: "text", value: answer })
					}
				/>
			);

		case "calculation": {
			const unit = getBodyField(question, "unit") as string | undefined;
			return (
				<div className="flex flex-col gap-3">
					<CalculationInput
						value={calcValue}
						onChange={setCalcValue}
						unit={unitValue}
						onUnitChange={setUnitValue}
					/>
					{unit && (
						<p className="text-muted-foreground text-xs">
							Expected unit: {unit}
						</p>
					)}
					<Button
						onClick={() => {
							const numeric = parseFloat(calcValue);
							handleGrade({
								type: "numeric",
								value: Number.isNaN(numeric)
									? calcValue
									: { value: numeric, unit: unitValue || undefined },
							});
						}}
						disabled={!calcValue.trim()}
					>
						{t("quiz.submitAnswer")}
					</Button>
				</div>
			);
		}

		case "diagram":
			return <DiagramInput onGrade={handleGrade} />;

		case "programming":
			return (
				<div className="flex flex-col gap-3">
					<ProgrammingInput
						value={code}
						onChange={setCode}
						language={getBodyField(question, "language") as string | undefined}
						starterCode={
							getBodyField(question, "starterCode") as string | undefined
						}
					/>
					<Button
						onClick={() => handleGrade({ type: "code", value: code })}
						disabled={!code.trim()}
					>
						{t("quiz.submitAnswer")}
					</Button>
				</div>
			);

		case "source-based":
			return (
				<SourceBasedInput
					body={getBodyField(question, "") as Record<string, unknown>}
					effectiveSubject={effectiveSubject}
					onGrade={handleGrade}
				/>
			);

		case "data-response":
			return (
				<DataResponseInput
					body={getBodyField(question, "") as Record<string, unknown>}
					onGrade={handleGrade}
				/>
			);

		case "mixed": {
			const parts = getBodyField(question, "parts") as
				| Record<string, unknown>[]
				| undefined;
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
