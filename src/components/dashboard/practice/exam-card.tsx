"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FadeIn } from "@/components/shared/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import type { PaperListing } from "@/types/exam";
import { PdfViewer } from "./pdf-viewer-client";
import { SmartViewDialog } from "./smart-view-dialog";

interface ExamCardProps {
	exam: PaperListing;
}

export function ExamCard({ exam }: ExamCardProps) {
	const { push } = useRouter();
	const [pdfOpen, setPdfOpen] = useState(false);
	const [smartViewOpen, setSmartViewOpen] = useState(false);

	const handleTakeExam = (e: React.MouseEvent) => {
		e.stopPropagation();
		push(`/exam/${exam.id}`);
	};

	const handleViewPdf = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPdfOpen(true);
	};

	const handlePractice = (e: React.MouseEvent) => {
		e.stopPropagation();
	};

	return (
		<>
			<FadeIn
				duration={0.25}
				distance={6}
				className="flex w-full flex-col justify-between gap-3 overflow-hidden rounded-xl border-0 bg-secondary/40 p-3 transition-colors hover:bg-secondary/60"
			>
				<div className="min-w-0 flex-1 pr-2">
					<p className="truncate font-medium text-sm">{exam.title}</p>
					<div className="mt-1 flex items-center gap-1.5">
						<span className="text-muted-foreground text-xs">{exam.year}</span>
						<span className="text-muted-foreground/50 text-xs">·</span>
						<Badge
							variant="outline"
							className={cn(
								"px-1.5 py-0.5 text-[10px]",
								exam.session === "november"
									? "bg-success/15 text-success-foreground"
									: "bg-[--system-accent]/10 text-muted-foreground",
							)}
						>
							{exam.session === "november" ? "Nov" : "May"}
						</Badge>
						{exam.language && (
							<>
								<span className="text-muted-foreground/50 text-xs">·</span>
								<span className="text-muted-foreground text-xs capitalize">
									{exam.language}
								</span>
							</>
						)}
						{exam.downloadedAt ? (
							<Badge
								variant="outline"
								className="h-5 px-1.5 text-[9px] text-muted-foreground/70"
							>
								Saved
							</Badge>
						) : null}
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					<Button variant="default" size="sm" onClick={handleViewPdf}>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setSmartViewOpen(true)}
					>
						Smart View
					</Button>
					<Button variant="secondary" size="sm" onClick={handlePractice}>
						Practice
					</Button>
					<Button variant="default" size="sm" onClick={handleTakeExam}>
						Take Exam
					</Button>
				</div>
			</FadeIn>

			<PdfViewer open={pdfOpen} onOpenChange={setPdfOpen} exam={exam} />
			<SmartViewDialog
				open={smartViewOpen}
				onOpenChange={setSmartViewOpen}
				exam={exam}
				onViewPdf={() => setPdfOpen(true)}
			/>
		</>
	);
}
