"use client";

import { useTranslations } from "next-intl";
import { VisualContent } from "@/components/visual/visual-content";
import { useVisualEngine } from "@/hooks/use-visual-engine";
import type { Question as ExamQuestion } from "@/types/exam-paper";
import { ContentBlockRenderer } from "./content-block-renderer";
import { MarksDisplay } from "./marks-display";
import { PartRenderer } from "./part-renderer";

interface QuestionRendererProps {
	question: ExamQuestion;
	sectionId: string;
	subject?: string;
	answers: Record<string, { value: string | string[] }>;
	flags: string[];
	currentPartId: string | null;
	onAnswer: (partId: string, value: string | string[]) => void;
	onFlag: (partId: string) => void;
	disabled?: boolean;
}

function buildQuestionText(question: ExamQuestion): string {
	const parts = question.parts
		.flatMap((p) => (p.text ? [p.text] : []))
		.join(" ");
	const context = question.context
		?.flatMap((c) => (c.value ? [c.value] : []))
		.join(" ");
	return [context, parts].filter(Boolean).join(" ") || question.title || "";
}

export function QuestionRenderer({
	question,
	sectionId,
	subject,
	answers,
	flags,
	currentPartId,
	onAnswer,
	onFlag,
	disabled,
}: QuestionRendererProps) {
	const t = useTranslations();
	const questionText = buildQuestionText(question);
	const engineQuestion = subject
		? {
				id: `exam-${sectionId}-${question.id}`,
				questionText,
				subject,
				topic: "",
				type: "mixed" as const,
				difficulty: "Medium" as const,
				bloomTaxonomy: "understand" as const,
				points: question.totalMarks || 0,
				hint: "",
				explanation: "",
				body: { parts: [] },
			}
		: null;

	const { data: visual, isLoading: visualLoading } =
		useVisualEngine(engineQuestion);

	const makePartId = (partId: string) =>
		`${sectionId}-${question.id}-${partId}`;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<h3 className="font-semibold text-lg">
					{t("exam.questionLabel", { id: question.id })}
					{question.title ? `: ${question.title}` : ""}
				</h3>
				{question.totalMarks && (
					<MarksDisplay marks={question.totalMarks} className="text-base" />
				)}
			</div>

			<VisualContent visual={visual} isLoading={visualLoading} />

			{question.context?.map((block) => (
				<div
					key={block.value || block.imagePath || block.type}
					className="border-muted border-l-2 pl-4"
				>
					<ContentBlockRenderer block={block} />
				</div>
			))}

			{question.parts.length === 0 && (
				<p className="text-muted-foreground text-sm italic">
					{t("exam.noSubQuestions")}
				</p>
			)}

			{question.parts.map((part) => {
				const fullId = makePartId(part.id);
				const isCurrent = currentPartId === fullId;

				return (
					<div
						key={part.id}
						id={fullId}
						className={`rounded-lg p-4 transition-colors ${
							isCurrent
								? "bg-[--system-accent]/5 ring-1 ring-[--system-accent]"
								: ""
						}`}
					>
						<div className="mb-3 flex items-start justify-between gap-2">
							<div className="flex flex-1 items-center gap-2">
								<span className="font-medium text-sm">
									{question.id}.{part.id}
								</span>
								{part.text && <p className="text-sm">{part.text}</p>}
								<MarksDisplay marks={part.marks} />
							</div>
							<button
								type="button"
								onClick={() => onFlag(fullId)}
								className={`shrink-0 rounded px-2 py-0.5 text-xs transition-colors ${
									flags.includes(fullId)
										? "bg-amber-100 text-amber-700"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}
							>
								{flags.includes(fullId) ? t("exam.flagged") : t("exam.flag")}
							</button>
						</div>

						{part.content?.map((block) => (
							<ContentBlockRenderer
								key={`content-${block.type}-${block.value?.slice(0, 30) || block.imagePath || ""}`}
								block={block}
							/>
						))}

						<div className="mt-3">
							<PartRenderer
								part={part}
								value={answers[fullId]?.value}
								onChange={(v) => onAnswer(fullId, v)}
								disabled={disabled}
							/>
						</div>

						{part.subParts && part.subParts.length > 0 && (
							<div className="mt-4 flex flex-col gap-4 border-muted border-l-2 pl-4">
								{part.subParts.map((subPart) => {
									const subFullId = `${fullId}(${subPart.id})`;
									return (
										<div key={subPart.id}>
											<div className="mb-2 flex items-center gap-2">
												<span className="font-medium text-sm">
													{subPart.id}
												</span>
												{subPart.text && (
													<p className="text-sm">{subPart.text}</p>
												)}
												<MarksDisplay marks={subPart.marks} />
											</div>
											<PartRenderer
												part={subPart}
												value={answers[subFullId]?.value}
												onChange={(v) => onAnswer(subFullId, v)}
												disabled={disabled}
											/>
										</div>
									);
								})}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
