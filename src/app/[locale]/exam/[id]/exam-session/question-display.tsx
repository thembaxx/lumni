"use client";

import {
	ArrowLeft01Icon,
	ArrowRight01Icon,
	Flag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { SessionPartAnswerInput } from "@/components/exam";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import type { QuestionPart } from "@/types/exam-paper";

interface QuestionDisplayProps {
	currentPart: {
		sectionId: string;
		questionId: string;
		part: QuestionPart;
	} | null;
	currentPartId: string | null;
	currentPartIndex: number;
	totalPartsCount: number;
	answers: Record<string, { value: string | string[] }>;
	flags: string[];
	paused: boolean;
	isMock?: boolean;
	onAnswer: (value: string | string[]) => void;
	onToggleFlag: (partId: string) => void;
	onPrevious: () => void;
	onNext: () => void;
	onSubmit: () => void;
}

export function QuestionDisplay({
	currentPart,
	currentPartId,
	currentPartIndex,
	totalPartsCount,
	answers,
	flags,
	paused,
	isMock,
	onAnswer,
	onToggleFlag,
	onPrevious,
	onNext,
	onSubmit,
}: QuestionDisplayProps) {
	const t = useTranslations();

	return (
		<main className="mx-auto w-full max-w-3xl flex-1 p-4 md:p-6">
			<AnimatePresence mode="wait" initial={false}>
				{currentPart && (
					<m.div
						key={currentPart.part.id}
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.2, ease: iOSEase }}
						className="flex flex-col gap-4"
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{currentPart.part.marks && (
									<Badge variant="outline" className="text-xs">
										{t("exam.marksBadge", {
											marks: currentPart.part.marks,
										})}
									</Badge>
								)}
							</div>

							{!isMock && (
								<button
									type="button"
									onClick={() => currentPartId && onToggleFlag(currentPartId)}
									className={cn(
										"rounded-xl p-2 transition-colors",
										currentPartId && flags.includes(currentPartId)
											? "bg-warning/10 text-warning"
											: "text-muted-foreground hover:bg-muted",
									)}
									aria-label="Flag question for review"
								>
									<HugeiconsIcon
										icon={Flag01Icon}
										className={cn(
											"size-5 transition-colors",
											currentPartId && flags.includes(currentPartId)
												? "fill-warning text-warning"
												: "text-muted-foreground",
										)}
									/>
								</button>
							)}
						</div>

						<div className="text-base leading-relaxed">
							{currentPart.part.text && (
								<MarkdownRenderer content={currentPart.part.text} />
							)}
						</div>

						<div className="pt-2">
							<SessionPartAnswerInput
								part={currentPart.part}
								value={
									currentPartId ? (answers[currentPartId]?.value ?? "") : ""
								}
								onChange={onAnswer}
								disabled={paused}
							/>
						</div>

						<div className="flex items-center border-border border-t pt-4">
							{isMock ? (
								<div className="flex-1" />
							) : (
								<Button
									variant="outline"
									onClick={onPrevious}
									disabled={currentPartIndex <= 0}
								>
									<HugeiconsIcon
										icon={ArrowLeft01Icon}
										data-icon="inline-start"
									/>
									{t("exam.previous")}
								</Button>
							)}

							<span className="flex-1 text-center text-muted-foreground text-xs">
								{t("exam.indexOfTotal", {
									index: currentPartIndex + 1,
									total: totalPartsCount,
								})}
							</span>

							<div className="flex flex-1 justify-end">
								{currentPartIndex < totalPartsCount - 1 ? (
									<Button onClick={onNext}>
										{t("exam.next")}
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											data-icon="inline-end"
										/>
									</Button>
								) : (
									<Button onClick={onSubmit}>{t("exam.finishSubmit")}</Button>
								)}
							</div>
						</div>
					</m.div>
				)}
			</AnimatePresence>
		</main>
	);
}
