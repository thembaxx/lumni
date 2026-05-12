"use client";

import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
						<span className="w-2 h-2 rounded-full bg-emerald-500" /> Answered
					</span>
					<span className="flex items-center gap-1">
						<Flag className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />{" "}
						Flagged
					</span>
					<span className="flex items-center gap-1">
						<span className="w-2 h-2 rounded-full bg-muted-foreground/30" />{" "}
						Unanswered
					</span>
				</div>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-2 space-y-3">
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
															"bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60",
														status === "flagged" &&
															"bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60",
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
