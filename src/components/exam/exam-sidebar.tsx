"use client";

import { Flag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/shared";
import type { ExamPaper } from "@/types/exam-paper";

interface ExamSidebarProps {
	paper: ExamPaper;
	answers: Record<string, { value: string | string[] }>;
	flags: string[];
	currentPartId: string | null;
	onNavigate: (partId: string) => void;
	onClose?: () => void;
}

export function ExamSidebar({
	paper,
	answers,
	flags,
	currentPartId,
	onNavigate,
	onClose: _onClose,
}: ExamSidebarProps) {
	const t = useTranslations();
	const getStatus = (
		sectionId: string,
		questionId: string,
		partId: string,
	): "unanswered" | "answered" | "flagged" => {
		const fullId = `${sectionId}-${questionId}-${partId}`;
		if (flags.includes(fullId)) return "flagged";
		if (answers[fullId]) return "answered";
		return "unanswered";
	};

	return (
		<div className="flex h-full flex-col">
			<div className="border-b p-3">
				<h3 className="font-semibold text-sm">{t("exam.questionNavigator")}</h3>
				<div className="mt-2 flex gap-2 text-muted-foreground text-xs">
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-success" />{" "}
						{t("exam.answered")}
					</span>
					<span className="flex items-center gap-1">
						<HugeiconsIcon
							icon={Flag01Icon}
							className="size-2.5 text-warning"
						/>{" "}
						{t("exam.flagged")}
					</span>
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-muted-foreground/30" />{" "}
						{t("exam.unanswered")}
					</span>
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-3 p-2">
					{paper.sections.map((section) => (
						<div key={section.id}>
							<h4 className="px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
								{t("exam.sectionLabel", { id: section.id })}
							</h4>
							{section.questions.map((question) => (
								<div key={question.id} className="ml-1">
									<p className="px-2 py-1 font-medium text-muted-foreground text-xs">
										{t("exam.questionLabelShort", { id: question.id })}
									</p>
									<div className="flex flex-wrap gap-1 px-2 pb-2">
										{question.parts.map((part) => {
											const fullId = `${section.id}-${question.id}-${part.id}`;
											const status = getStatus(
												section.id,
												question.id,
												part.id,
											);

											return (
												<Button
													key={part.id}
													type="button"
													variant="ghost"
													onClick={() => onNavigate(fullId)}
													className={cn(
														"size-8 rounded font-medium text-xs",
														currentPartId === fullId &&
															"ring-2 ring-[--system-accent] ring-offset-1",
														status === "answered" &&
															"bg-success/10 text-success-foreground hover:bg-success/10",
														status === "flagged" &&
															"bg-warning/10 text-warning-foreground hover:bg-warning/10",
														status === "unanswered" &&
															"bg-muted text-muted-foreground hover:bg-muted/80",
													)}
												>
													{part.id.split(".").pop()}
												</Button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
