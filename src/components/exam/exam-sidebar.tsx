"use client";

import { Flag } from "@phosphor-icons/react";
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
	onClose,
}: ExamSidebarProps) {
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
		<div className="flex flex-col h-full">
			<div className="p-3 border-b">
				<h3 className="text-sm font-semibold">Question Navigator</h3>
				<div className="flex gap-2 mt-2 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-success" /> Answered
					</span>
					<span className="flex items-center gap-1">
						<Flag className="size-2.5 text-warning" /> Flagged
					</span>
					<span className="flex items-center gap-1">
						<span className="size-2 rounded-full bg-muted-foreground/30" />{" "}
						Unanswered
					</span>
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-2 flex flex-col gap-3">
					{paper.sections.map((section) => (
						<div key={section.id}>
							<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
								Section {section.id}
							</h4>
							{section.questions.map((question) => (
								<div key={question.id} className="ml-1">
									<p className="text-xs font-medium px-2 py-1 text-muted-foreground">
										Q{question.id}
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
														"size-8 rounded text-xs font-medium",
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
