"use client";

import { useTranslations } from "next-intl";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { cn } from "@/lib/shared";
import type { QuestionPart } from "@/types/exam-paper";

interface PartAnswerInputProps {
	part: QuestionPart;
	value: string | string[];
	onChange: (value: string | string[]) => void;
	disabled: boolean;
}

export function SessionPartAnswerInput({
	part,
	value,
	onChange,
	disabled,
}: PartAnswerInputProps) {
	const t = useTranslations();
	if (part.type === "multiple-choice" && part.options) {
		const selected = Array.isArray(value) ? value[0] : value;
		return (
			<div className="flex flex-col gap-2">
				{part.options.map((opt) => (
					<button
						key={opt.id}
						type="button"
						disabled={disabled}
						onClick={() => onChange(opt.id)}
						className={cn(
							"w-full rounded-xl border-2 p-3 text-left transition-[border-color,background-color]",
							selected === opt.id
								? "border-[--system-accent] bg-[--system-accent]/5"
								: "border-border hover:border-[--system-accent]/30",
						)}
					>
						<span className="font-medium">{opt.id}.</span>{" "}
						<MarkdownRenderer content={opt.text} />
					</button>
				))}
			</div>
		);
	}

	if (part.subParts) {
		return (
			<div className="flex flex-col gap-4">
				{part.subParts.map((subPart) => (
					<div key={subPart.id}>
						<MarkdownRenderer content={subPart.text ?? ""} />
						<div className="mt-2">
							<SessionPartAnswerInput
								part={subPart}
								value={value}
								onChange={onChange}
								disabled={disabled}
							/>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (part.type === "short-answer") {
		return (
			<input
				type="text"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderShortAnswer")}
				aria-label="Short answer input"
			/>
		);
	}

	if (part.type === "long-answer" || part.type === "essay") {
		return (
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={6}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderLongAnswer")}
				aria-label="Long answer input"
			/>
		);
	}

	if (part.type === "calculation") {
		return (
			<input
				type="text"
				inputMode="decimal"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-xl border-2 border-border bg-background p-3 font-mono outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderCalculation")}
				aria-label="Calculation answer input"
			/>
		);
	}

	if (part.type === "matching") {
		return (
			<input
				type="text"
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				className="w-full rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderMatching")}
				aria-label="Matching pairs input"
			/>
		);
	}

	if (part.type === "diagram") {
		const instructions =
			((part as unknown as Record<string, unknown>).instructions as string) ??
			t("exam.placeholderDiagram");
		return (
			<div className="flex flex-col gap-2">
				<p className="text-muted-foreground text-sm">{instructions}</p>
				<textarea
					value={(Array.isArray(value) ? value[0] : value) ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					rows={4}
					className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
					placeholder={t("exam.placeholderShortAnswer")}
					aria-label="Diagram answer input"
				/>
			</div>
		);
	}

	if (part.type === "programming") {
		return (
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={8}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 font-mono text-sm outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderCode")}
				aria-label="Programming answer input"
			/>
		);
	}

	if (
		part.type === "source-based" ||
		part.type === "data-response" ||
		part.type === "mixed"
	) {
		return (
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={4}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderShortAnswer")}
				aria-label="Response input"
			/>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-muted-foreground text-sm">
				{t("exam.unsupportedType", { type: part.type })}
			</p>
			<textarea
				value={(Array.isArray(value) ? value[0] : value) ?? ""}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				rows={4}
				className="w-full resize-y rounded-xl border-2 border-border bg-background p-3 outline-none focus:border-[--system-accent]"
				placeholder={t("exam.placeholderShortAnswer")}
				aria-label="Freeform answer input"
			/>
		</div>
	);
}
