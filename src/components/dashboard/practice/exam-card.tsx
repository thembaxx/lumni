"use client";

import { m } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, FileText, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ExamPaper } from "@/types/exam";

interface ExamCardProps {
	exam: ExamPaper;
}

function PdfViewer({
	open,
	onOpenChange,
	exam,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	exam: ExamPaper;
}) {
	const [pdfPage, setPdfPage] = useState(1);
	const [totalPages] = useState(1);
	const [pdfZoom, setPdfZoom] = useState(100);
	const [isLoading, setIsLoading] = useState(true);

	const pdfUrl = exam.src || exam.localPath || exam.url;
	const googleViewerUrl = pdfUrl
		? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
		: null;

	useEffect(() => {
		if (!open) {
			setPdfPage(1);
			setIsLoading(true);
		}
	}, [open]);

	const handlePrevPage = useCallback(
		() => setPdfPage((p) => Math.max(1, p - 1)),
		[],
	);
	const handleNextPage = useCallback(
		() => setPdfPage((p) => Math.min(totalPages, p + 1)),
		[totalPages],
	);
	const handleZoomIn = useCallback(
		() => setPdfZoom((z) => Math.min(200, z + 25)),
		[],
	);
	const handleZoomOut = useCallback(
		() => setPdfZoom((z) => Math.max(50, z - 25)),
		[],
	);

	const handleDownload = useCallback(() => {
		if (pdfUrl) {
			window.open(pdfUrl, "_blank");
		}
	}, [pdfUrl]);

	const handleIframeLoad = useCallback(() => {
		setIsLoading(false);
	}, []);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[98vw] h-full max-h-[95vh] p-0 gap-0 rounded-2xl overflow-hidden">
				<div className="flex flex-col h-full">
					<div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
						<div className="flex items-center gap-2 min-w-0 flex-1">
							<h2 className="text-sm font-semibold truncate">{exam.title}</h2>
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 shrink-0"
							>
								{exam.year}
							</Badge>
						</div>

						{/* <div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleZoomOut}
							>
								<span className="text-xs">−</span>
							</Button>
							<span className="text-xs w-10 text-center text-muted-foreground">
								{pdfZoom}%
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleZoomIn}
							>
								<span className="text-base">+</span>
							</Button>
						</div> */}

						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handlePrevPage}
								disabled={pdfPage <= 1}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<span className="text-xs w-12 text-center text-muted-foreground">
								{pdfPage}/{totalPages}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={handleNextPage}
								disabled={pdfPage >= totalPages}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
							<Button
								variant="secondary"
								size="sm"
								className="h-8 ml-1 text-xs"
								onClick={handleDownload}
							>
								<Download className="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div className="flex-1 overflow-hidden relative">
						{isLoading && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
								<div className="flex flex-col items-center gap-2">
									<div className="w-5 h-5 rounded-full border border-muted border-t-foreground animate-spin" />
									<span className="text-xs text-muted-foreground">
										Loading PDF...
									</span>
								</div>
							</div>
						)}
						{googleViewerUrl ? (
							<iframe
								src={googleViewerUrl}
								className="w-full h-full"
								title={exam.title}
								onLoad={handleIframeLoad}
							/>
						) : (
							<div className="flex items-center justify-center h-full">
								<div className="text-center">
									<FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
									<p className="text-sm text-muted-foreground">
										PDF unavailable
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function ExamCard({ exam }: ExamCardProps) {
	const [pdfOpen, setPdfOpen] = useState(false);

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
				className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border-0 hover:bg-secondary/60 transition-colors"
			>
				<div className="flex-1 min-w-0 pr-2">
					<p className="text-sm font-medium truncate">{exam.title}</p>
					<div className="flex items-center gap-1.5 mt-0.5">
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
					</div>
				</div>

				<div className="flex items-center gap-1.5 shrink-0">
					{exam.downloadedAt ? (
						<Badge
							variant="outline"
							className="text-[9px] h-5 px-1.5 text-muted-foreground/70"
						>
							Saved
						</Badge>
					) : null}
					<button
						onClick={handleViewPdf}
						className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
						type="button"
					>
						View
					</button>
					<button
						onClick={handlePractice}
						className="h-8 px-3 rounded-full bg-secondary text-xs font-medium hover:bg-secondary/80 transition-colors"
						type="button"
					>
						Practice
					</button>
				</div>
			</m.div>

			<PdfViewer open={pdfOpen} onOpenChange={setPdfOpen} exam={exam} />
		</>
	);
}
