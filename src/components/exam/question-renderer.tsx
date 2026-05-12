"use client";

import type { Question } from "@/types/exam-paper";
import { ContentBlockRenderer } from "./content-block-renderer";
import { MarksDisplay } from "./marks-display";
import { PartRenderer } from "./part-renderer";

interface QuestionRendererProps {
	question: Question;
	sectionId: string;
	answers: Record<string, { value: string | string[] }>;
	flags: string[];
	currentPartId: string | null;
	onAnswer: (partId: string, value: string | string[]) => void;
	onFlag: (partId: string) => void;
	disabled?: boolean;
}

export function QuestionRenderer({
	question,
	sectionId,
	answers,
	flags,
	currentPartId,
	onAnswer,
	onFlag,
	disabled,
}: QuestionRendererProps) {
	const makePartId = (partId: string) =>
		`${sectionId}-${question.id}-${partId}`;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2">
				<h3 className="text-lg font-semibold">
					QUESTION {question.id}
					{question.title ? `: ${question.title}` : ""}
				</h3>
				{question.totalMarks && (
					<MarksDisplay marks={question.totalMarks} className="text-base" />
				)}
			</div>

			{question.context?.map((block, idx) => (
				<div key={idx} className="pl-4 border-l-2 border-muted">
					<ContentBlockRenderer block={block} />
				</div>
			))}

			{question.parts.length === 0 && (
				<p className="text-sm text-muted-foreground italic">No sub-questions</p>
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
								? "ring-1 ring-[--system-accent] bg-[--system-accent]/5"
								: ""
						}`}
					>
						<div className="flex items-start justify-between gap-2 mb-3">
							<div className="flex items-center gap-2 flex-1">
								<span className="text-sm font-medium">
									{question.id}.{part.id}
								</span>
								{part.text && <p className="text-sm">{part.text}</p>}
								<MarksDisplay marks={part.marks} />
							</div>
							<button
								type="button"
								onClick={() => onFlag(fullId)}
								className={`shrink-0 text-xs px-2 py-0.5 rounded transition-colors ${
									flags.includes(fullId)
										? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}
							>
								{flags.includes(fullId) ? "Flagged" : "Flag"}
							</button>
						</div>

						{part.content?.map((block, idx) => (
							<ContentBlockRenderer key={idx} block={block} />
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
							<div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
								{part.subParts.map((subPart) => {
									const subFullId = `${fullId}(${subPart.id})`;
									return (
										<div key={subPart.id}>
											<div className="flex items-center gap-2 mb-2">
												<span className="text-sm font-medium">
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
