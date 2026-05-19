"use client";

import {
	CalculationInput,
	DataResponseInput,
	DiagramInput,
	EssayInput,
	LongAnswerInput,
	MatchingInput,
	MixedInput,
	MultipleChoiceInput,
	ProgrammingInput,
	ShortAnswerInput,
	SourceBasedInput,
} from "@/components/ui/inputs";
import type { QuestionPart } from "@/types/exam-paper";

interface PartRendererProps {
	part: QuestionPart;
	value: string | string[] | Record<string, string | string[]> | undefined;
	onChange: (value: string | string[]) => void;
	disabled?: boolean;
}

export function PartRenderer({
	part,
	value,
	onChange,
	disabled,
}: PartRendererProps) {
	const partValue = value as string | undefined;

	switch (part.type) {
		case "multiple-choice":
			return (
				<MultipleChoiceInput
					options={part.options || []}
					value={partValue}
					onChange={onChange}
					disabled={disabled}
				/>
			);

		case "matching":
			return (
				<MatchingInput
					table={part.table!}
					value={(value as Record<string, string>) || {}}
					onChange={(pairs) => onChange(JSON.stringify(pairs))}
					disabled={disabled}
				/>
			);

		case "short-answer":
			return (
				<ShortAnswerInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
				/>
			);

		case "long-answer":
			return (
				<LongAnswerInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
				/>
			);

		case "essay":
			return (
				<EssayInput value={partValue} onChange={onChange} disabled={disabled} />
			);

		case "calculation":
			return (
				<CalculationInput
					value={partValue || ""}
					onChange={onChange}
					disabled={disabled}
				/>
			);

		case "diagram":
			return (
				<DiagramInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
				/>
			);

		case "source-based":
			return (
				<SourceBasedInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
					sourceRefs={part.sourceRefs || []}
					content={part.content}
				/>
			);

		case "programming":
			return (
				<ProgrammingInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
					language={part.content?.find((c) => c.type === "code")?.language}
					starterCode={part.content?.find((c) => c.type === "code")?.value}
				/>
			);

		case "data-response":
			return (
				<DataResponseInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
					content={part.content}
				/>
			);

		case "mixed":
			return (
				<MixedInput
					value={
						typeof value === "object" && !Array.isArray(value)
							? (value as Record<string, string | string[]>)
							: {}
					}
					onChange={(subId, v) => {
						const current = {
							...((typeof value === "object" && !Array.isArray(value)
								? value
								: {}) as Record<string, string | string[]>),
						};
						current[subId] = v;
						onChange(JSON.stringify(current));
					}}
					disabled={disabled}
					content={part.content}
					subParts={part.subParts}
				/>
			);

		default:
			return (
				<ShortAnswerInput
					value={partValue}
					onChange={onChange}
					disabled={disabled}
				/>
			);
	}
}
