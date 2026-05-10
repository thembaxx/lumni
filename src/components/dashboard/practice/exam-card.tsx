"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExamPaper } from "@/types/exam";
import { PdfViewer } from "./pdf-viewer-client";
import { SmartViewDialog } from "./smart-view-dialog";

interface ExamCardProps {
	exam: ExamPaper;
}

export function ExamCard({ exam }: ExamCardProps) {
	const [pdfOpen, setPdfOpen] = useState(false);
	const [smartViewOpen, setSmartViewOpen] = useState(false);

	const handleViewPdf = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPdfOpen(true);
	};

	const handlePractice = (e: React.MouseEvent) => {
		e.stopPropagation();
		console.log("Practice for:", exam.id);
	};

	return (
		<>
			<m.div
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.25 }}
				className="flex flex-col w-full justify-between p-3 gap-3 overflow-hidden rounded-xl bg-secondary/40 border-0 hover:bg-secondary/60 transition-colors"
			>
				<div className="flex-1 min-w-0 pr-2">
					<p className="text-sm font-medium truncate">{exam.title}</p>
					<div className="flex items-center gap-1.5 mt-1">
						<span className="text-xs text-muted-foreground">{exam.year}</span>
						<span className="text-xs text-muted-foreground/50">·</span>
						<span
							className={cn(
								"text-[10px] px-1.5 py-0.5 rounded font-medium",
								exam.session === "november"
									? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
									: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
							)}
						>
							{exam.session === "november" ? "Nov" : "May"}
						</span>
						{exam.language && (
							<>
								<span className="text-xs text-muted-foreground/50">·</span>
								<span className="text-xs text-muted-foreground capitalize">
									{exam.language}
								</span>
							</>
						)}
						{exam.downloadedAt ? (
							<Badge
								variant="outline"
								className="text-[9px] h-5 px-1.5 text-muted-foreground/70"
							>
								Saved
							</Badge>
						) : null}
					</div>
				</div>

				<div className="flex items-center gap-1.5 shrink-0">
					<Button
						variant="default"
						size="sm"
						className="h-8 text-xs"
						onClick={handleViewPdf}
					>
						View
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-8 text-xs"
						onClick={() => setSmartViewOpen(true)}
					>
						Smart View
					</Button>
					<Button
						variant="secondary"
						size="sm"
						className="h-8 text-xs"
						onClick={handlePractice}
					>
						Practice
					</Button>
				</div>
			</m.div>

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
